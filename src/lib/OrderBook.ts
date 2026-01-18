import { createLogger } from '../utils/logger';

const log = createLogger('OrderBook');

export type OrderBookSideVolumes = Record<number, number>;

export type TickerOrderBook = {
    bidVolumes: OrderBookSideVolumes;
    askVolumes: OrderBookSideVolumes;
};

export type OrderBooksByTicker = Record<string, TickerOrderBook>;

class OrderBook {
    public orderBooks: OrderBooksByTicker;
    private subscribers: Array<(books: OrderBooksByTicker) => void>;

    constructor(rawOrderBook: unknown = {}) {
        if (typeof rawOrderBook !== 'object' || Array.isArray(rawOrderBook)) {
            throw new TypeError('Input data must be an object.');
        }

        this.orderBooks = {};
        this.subscribers = [];

        // Initialize order books
        for (const [ticker, volumes] of Object.entries(rawOrderBook as Record<string, any>)) {
            this.orderBooks[ticker] = {
                bidVolumes: this._createSortedMap(volumes.bidVolumes || {}, true),
                askVolumes: this._createSortedMap(volumes.askVolumes || {}, false),
            };
        }
    }

    // Subscribe to changes
    subscribe(callback: (books: OrderBooksByTicker) => void) {
        if (typeof callback === 'function') {
            this.subscribers.push(callback);
            log.debug('Subscriber added', { total: this.subscribers.length });
        }
    }

    // Unsubscribe from changes
    unsubscribe(callback: (books: OrderBooksByTicker) => void) {
        this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    }

    // Notify all subscribers
    _notifySubscribers() {
        this.subscribers.forEach((callback) => callback(this.orderBooks));
    }

    // Helper to create a sorted map (object) from volumes
    _createSortedMap(volumes: any, reverse?: boolean): any {
        if (!volumes || typeof volumes !== 'object') {
            log.warn('Invalid volumes received', { volumes });
            return {};
        }

        log.debug('Building order book');

        // **Log all tickers (top-level keys in volumes)**
        const tickers = Object.keys(volumes);
        log.debug('Tickers in order book', { tickers });

        // **Store processed order books**

        // **Iterate through each ticker**
        for (const ticker of tickers) {
            const tickerData = volumes[ticker];

            if (!tickerData || typeof tickerData !== 'object') {
                log.warn('Skipping invalid ticker data', { ticker });
                continue;
            }

            log.debug('Processing ticker', { ticker });

            const toNumber = (value: unknown): number => {
                if (typeof value === 'number') return value;
                if (typeof value === 'string') return parseFloat(value);
                return NaN;
            };

            // **Extract bidVolumes and askVolumes**
            const bidVolumes = tickerData.bidVolumes || {};
            const askVolumes = tickerData.askVolumes || {};

            log.debug('Volume keys', {
                ticker,
                askKeys: Object.keys(askVolumes),
                bidKeys: Object.keys(bidVolumes),
            });

            // **Sort bidVolumes (high-to-low) and askVolumes (low-to-high)**
            this.orderBooks[ticker] = {
                bidVolumes: Object.fromEntries(
                    Object.entries(bidVolumes)
                        .filter(
                            ([price, qty]) =>
                                !isNaN(parseFloat(price)) &&
                                !isNaN(toNumber(qty)) &&
                                toNumber(qty) > 0,
                        )
                        .map(([price, qty]) => [parseFloat(price), toNumber(qty)])
                        .sort(([priceA], [priceB]) => priceB - priceA), // High to Low
                ),
                askVolumes: Object.fromEntries(
                    Object.entries(askVolumes)
                        .filter(
                            ([price, qty]) =>
                                !isNaN(parseFloat(price)) &&
                                !isNaN(toNumber(qty)) &&
                                toNumber(qty) > 0,
                        )
                        .map(([price, qty]) => [parseFloat(price), toNumber(qty)])
                        .sort(([priceA], [priceB]) => priceA - priceB), // Low to High
                ),
            };

            log.debug('Built order book for ticker', { ticker });
        }
        this._notifySubscribers();
    }

    updateVolumes(
        updates: Array<
            {
                ticker: string;
                price?: number | string;
                side?: string;
                volume?: number;
            } & Record<string, unknown>
        >,
    ) {
        updates.forEach((update) => {
            const ticker = update.ticker;
            const price = update.price;
            const side = update.side;
            const volume = update.volume;

            if (
                !ticker ||
                typeof side !== 'string' ||
                (typeof price !== 'number' && typeof price !== 'string') ||
                typeof volume !== 'number'
            ) {
                return;
            }

            const sideKey = side.toLowerCase() === 'bid' ? 'bidVolumes' : 'askVolumes';
            //console.log(ticker, price, side, volume);

            // Ensure the ticker exists
            if (!this.orderBooks[ticker]) {
                this.orderBooks[ticker] = { bidVolumes: {}, askVolumes: {} };
            }

            // Convert price to a numeric key for consistency
            const numericPrice = typeof price === 'number' ? price : parseFloat(price);

            if (!Number.isFinite(numericPrice)) {
                return;
            }

            if (volume === 0) {
                // Remove price level if volume is zero
                log.debug('Deleting price level (volume=0)', {
                    ticker,
                    side: sideKey,
                    price: numericPrice,
                });
                delete this.orderBooks[ticker][sideKey][numericPrice];
            } else {
                // Merge the update into the existing order book
                this.orderBooks[ticker][sideKey] = {
                    ...this.orderBooks[ticker][sideKey],
                    [numericPrice]: volume,
                };
            }

            // Ensure sorting and cleaning are maintained
            this.orderBooks[ticker][sideKey] = Object.fromEntries(
                Object.entries(this.orderBooks[ticker][sideKey])
                    .filter(
                        ([p, q]) =>
                            !isNaN(parseFloat(p)) &&
                            typeof q === 'number' &&
                            Number.isFinite(q) &&
                            q > 0,
                    )
                    .map(([p, q]) => [parseFloat(p), q])
                    .sort(([pA], [pB]) => (sideKey === 'bidVolumes' ? pB - pA : pA - pB)),
            );
        });

        this._notifySubscribers(); // Notify React components
    }

    resetFromSnapshot(rawOrderBook: any) {
        this.orderBooks = {};
        this._createSortedMap(rawOrderBook);
    }

    // Convert the object to a string representation
    toString() {
        const output = [];
        for (const [ticker, data] of Object.entries(this.orderBooks)) {
            output.push(`Ticker: ${ticker}`);
            output.push('  Bid Volumes:');
            for (const [price, volume] of Object.entries(data.bidVolumes)) {
                output.push(`    ${parseFloat(price).toFixed(2)}: ${volume.toFixed(2)}`);
            }
            output.push('  Ask Volumes:');
            for (const [price, volume] of Object.entries(data.askVolumes)) {
                output.push(`    ${parseFloat(price).toFixed(2)}: ${volume.toFixed(2)}`);
            }
        }
        return output.join('\n');
    }
}

// Singleton instance
const orderBookInstance = new OrderBook();

export default orderBookInstance;
