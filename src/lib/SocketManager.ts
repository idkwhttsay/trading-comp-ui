import { Client } from '@stomp/stompjs';
import { fetchSnapshot, fetchUpdateBySeq, getBuildupData, HTTPStatusCodes } from './api';
import orderBookInstance from './OrderBook';
import userPortfolio from './UserPortfolio';
import CandlestickTracker from './CandlestickTracker';
import { SeqBuffer } from './SeqBuffer';
import { getWsBaseUrl } from '../config/runtime';
import { createLogger } from '../utils/logger';
import { safeJsonParse, safeParse } from '../utils/validation';
import {
    ChartUpdateSchema,
    OrderBookSnapshotSchema,
    OrderBookUpdatesSchema,
    PortfolioMessageSchema,
} from '../domain/schemas';

const log = createLogger('SocketManager');

const TOPICS = Object.freeze({
    ORDERBOOK: '/topic/orderbook',
    PRIVATE: '/user/queue/private',
    CHART: '/topic/chart',
});

function buildBrokerUrl({ sessionToken, username }) {
    const base = getWsBaseUrl();
    const url = new URL(base);
    url.pathname = '/exchange-socket';
    url.searchParams.set('Session-ID', sessionToken);
    url.searchParams.set('Username', username);
    return url.toString();
}

class SocketManager {
    public stompClient: Client | null;
    public connected: boolean;

    private lastAppliedSeq: number | null;
    private seqBuffer: SeqBuffer;
    private pendingBySeq: Map<number, unknown>;
    private gapFillInProgress: boolean;
    private needsResnapshot: boolean;

    constructor() {
        this.stompClient = null;
        this.connected = false;

        // Update recovery (seq) state
        this.lastAppliedSeq = null;
        this.seqBuffer = new SeqBuffer(1000);
        this.pendingBySeq = new Map();
        this.gapFillInProgress = false;
        this.needsResnapshot = false;
    }

    isReady() {
        return Boolean(this.stompClient && this.connected);
    }

    // Initialize and configure the WebSocket connection
    async connect() {
        const buildupData = getBuildupData();

        if (!buildupData || !buildupData.sessionToken || !buildupData.username) {
            log.error('Buildup data is incomplete or unavailable; cannot connect');
            return;
        }

        if (this.stompClient) {
            // Avoid duplicated clients if connect() is called multiple times.
            this.disconnect();
        }

        // Initialize seq from a fresh snapshot. If this fails, we can still run, but gap-fill may be limited.
        if (this.lastAppliedSeq === null) {
            await this.resnapshotAndResetSeq({ reason: 'initial-connect' });
        }

        const brokerURL = buildBrokerUrl(buildupData);

        // Create a new STOMP client
        this.stompClient = new Client({
            brokerURL,
            debug: (str) => {
                //console.log(str); // Debugging logs
            },
            reconnectDelay: 5000, // Reconnect after 5 seconds if disconnected
            heartbeatIncoming: 4000, // Client heartbeat
            heartbeatOutgoing: 4000, // Server heartbeat
        });

        // Define event handlers
        this.stompClient.onConnect = async (frame) => {
            this.connected = true;

            if (this.needsResnapshot) {
                await this.resnapshotAndResetSeq({ reason: 'reconnect' });
                this.needsResnapshot = false;
            }

            this.subscribeToTopics();
        };

        this.stompClient.onDisconnect = () => {
            this.connected = false;
        };

        this.stompClient.onWebSocketError = (error) => {
            log.error('WebSocket error', error);
        };

        this.stompClient.onWebSocketClose = () => {
            // On reconnect, re-onboard from snapshot; local state may be stale.
            this.needsResnapshot = true;
        };

        this.stompClient.onStompError = (frame) => {
            log.error('STOMP error', {
                message: frame?.headers?.message,
                body: frame?.body,
            });
        };

        // Activate the WebSocket connection
        this.stompClient.activate();
    }

    // Subscribe to specific topics
    subscribeToTopics() {
        if (!this.stompClient || !this.connected) {
            log.error('Cannot subscribe: WebSocket client is not connected');
            return;
        }

        // Subscribe to public orderbook updates
        this.stompClient.subscribe(TOPICS.ORDERBOOK, (message) => {
            const parsed = safeJsonParse(message.body);
            if (!parsed) {
                log.warn('Invalid JSON on orderbook topic');
                return;
            }
            this.handleOrderbookMessage(parsed);
        });

        // Subscribe to private user-specific updates
        this.stompClient.subscribe(TOPICS.PRIVATE, (message) => {
            const parsed = safeJsonParse(message.body);
            if (!parsed) {
                log.warn('Invalid JSON on private topic');
                return;
            }
            this.handlePrivateMessage(parsed);
        });
        this.stompClient.subscribe(TOPICS.CHART, (message) => {
            const parsed = safeJsonParse(message.body);
            if (!parsed) {
                log.warn('Invalid JSON on chart topic');
                return;
            }
            this.handleChartUpdate(parsed);
        });
    }

    // Disconnect from the WebSocket server
    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.connected = false;
            this.stompClient = null;
        }
    }

    // Handle incoming public orderbook messages
    async handleOrderbookMessage(data) {
        const incomingSeq = this.extractSeq(data);
        const updates = this.extractUpdates(data);

        // Heartbeat / non-update payloads: do not mutate orderbook.
        if (!updates) {
            return;
        }

        const validatedUpdates = safeParse(OrderBookUpdatesSchema, updates, {
            source: 'ws',
            topic: 'orderbook',
            seq: incomingSeq,
        });
        if (!validatedUpdates) {
            return;
        }

        // If server isn't sending seq yet, fall back to best-effort.
        if (incomingSeq === null) {
            orderBookInstance.updateVolumes(validatedUpdates);
            return;
        }

        // Deduplicate
        if (this.seqBuffer.has(incomingSeq)) {
            return;
        }

        // If we don't have a baseline yet, try to snapshot now.
        if (this.lastAppliedSeq === null) {
            await this.resnapshotAndResetSeq({ reason: 'missing-baseline' });
        }

        // During a gap-fill, buffer incoming updates by seq.
        if (this.gapFillInProgress) {
            this.pendingBySeq.set(incomingSeq, validatedUpdates);
            return;
        }

        await this.applyWithGapFill(incomingSeq, validatedUpdates);
        await this.drainPendingInOrder();
    }

    extractSeq(data) {
        if (!data || typeof data !== 'object') return null;
        const raw = data.seq ?? data.sequence ?? data.sequenceNumber;
        const num = Number(raw);
        return Number.isFinite(num) ? num : null;
    }

    extractUpdates(data) {
        if (!data || typeof data !== 'object') return null;
        const content = data.content;

        // Some servers may return updates directly instead of a JSON string.
        if (Array.isArray(content)) return content;

        if (typeof content !== 'string') {
            return null;
        }

        try {
            const parsed = JSON.parse(content);
            return Array.isArray(parsed) ? parsed : null;
        } catch (_) {
            return null;
        }
    }

    markApplied(seq) {
        this.seqBuffer.add(seq);
        this.lastAppliedSeq = seq;
    }

    async applyWithGapFill(incomingSeq, updates) {
        // If we somehow receive an older seq, just dedupe/skip.
        if (this.lastAppliedSeq !== null && incomingSeq <= this.lastAppliedSeq) {
            this.seqBuffer.add(incomingSeq);
            return;
        }

        this.gapFillInProgress = true;
        try {
            // Fill missing seqs if we see a gap.
            if (this.lastAppliedSeq !== null && incomingSeq > this.lastAppliedSeq + 1) {
                for (let missing = this.lastAppliedSeq + 1; missing < incomingSeq; missing++) {
                    const ok = await this.fetchAndApplyMissingSeq(missing);
                    if (!ok) {
                        // Out of retention or inconsistent; snapshot and stop attempting further incremental fill.
                        await this.resnapshotAndResetSeq({ reason: 'invalid-seq' });
                        break;
                    }
                }
            }

            // Apply the incoming websocket update.
            if (!this.seqBuffer.has(incomingSeq)) {
                orderBookInstance.updateVolumes(updates);
                this.markApplied(incomingSeq);
            }
        } finally {
            this.gapFillInProgress = false;
        }
    }

    async fetchAndApplyMissingSeq(seq) {
        const resp = await fetchUpdateBySeq(seq);
        if (!resp || resp.status !== HTTPStatusCodes.OK) {
            return false;
        }

        // Accept either { content: "[...]" } or { update: ... } shapes.
        const updates =
            this.extractUpdates(resp) ||
            this.extractUpdates(resp.update ? { content: resp.update } : null);

        const validatedUpdates = updates
            ? safeParse(OrderBookUpdatesSchema, updates, {
                  source: 'rest',
                  endpoint: 'updates',
                  seq,
              })
            : null;

        if (!validatedUpdates) {
            return false;
        }

        if (!this.seqBuffer.has(seq)) {
            orderBookInstance.updateVolumes(validatedUpdates);
            this.markApplied(seq);
        }
        return true;
    }

    async resnapshotAndResetSeq({ reason }) {
        try {
            const snap = await fetchSnapshot();
            if (!snap || snap.status !== HTTPStatusCodes.OK) {
                log.warn('Snapshot request failed', { reason, snap });
                return;
            }

            // Accept either { orderBookData, latestSeq } or { snapshot, latestSeq }.
            const book = snap.orderBookData ?? snap.snapshot ?? snap.orderbook ?? null;
            const latestSeq = Number(
                snap.latestSeq ?? snap.seq ?? snap.sequence ?? snap.sequenceNumber,
            );

            if (!book || !Number.isFinite(latestSeq)) {
                log.warn('Snapshot missing fields', { snap });
                return;
            }

            // If orderBookData is a JSON string, parse it.
            const parsedBook = typeof book === 'string' ? safeJsonParse(book) : book;
            if (!parsedBook) {
                log.warn('Snapshot book is invalid JSON', { snap });
                return;
            }

            const validatedBook = safeParse(OrderBookSnapshotSchema, parsedBook, {
                source: 'rest',
                endpoint: 'snapshot',
                reason,
            });
            if (!validatedBook) {
                return;
            }

            orderBookInstance.resetFromSnapshot(validatedBook);
            this.lastAppliedSeq = latestSeq;
            this.seqBuffer.clear();
            this.pendingBySeq.clear();
        } catch (e) {
            log.warn('Resnapshot failed', { reason, error: e });
        }
    }

    async drainPendingInOrder() {
        if (this.lastAppliedSeq === null) return;
        while (this.pendingBySeq.has(this.lastAppliedSeq + 1)) {
            const nextSeq = this.lastAppliedSeq + 1;
            const nextUpdates = this.pendingBySeq.get(nextSeq);
            this.pendingBySeq.delete(nextSeq);
            await this.applyWithGapFill(nextSeq, nextUpdates);
        }
    }

    // Handle incoming private messages
    handlePrivateMessage(data) {
        const validated = safeParse(PortfolioMessageSchema, data, {
            source: 'ws',
            topic: 'private',
        });
        if (!validated) return;

        userPortfolio.updatePortfolio(validated);
    }
    handleChartUpdate(data) {
        const validated = safeParse(ChartUpdateSchema, data, {
            source: 'ws',
            topic: 'chart',
        });
        if (!validated) return;

        Object.entries(validated).forEach(([ticker, ohlc]) => {
            CandlestickTracker.insertCandle(ticker, {
                open: ohlc.open,
                high: ohlc.high,
                low: ohlc.low,
                close: ohlc.close,
                timestamp: Date.now(),
            });
        });
    }

    // Add your logic to process private messages

    // Publish messages to a specific destination
    sendMessage(destination, body) {
        if (!this.isReady()) {
            log.error('Cannot send message: WebSocket client is not connected');
            return;
        }

        this.stompClient.publish({
            destination,
            body: JSON.stringify(body),
        });

        //console.log(`Message sent to ${destination}:`, body);
    }
}

// Export a singleton instance of SocketManager
const socketManager = new SocketManager();
export default socketManager;
