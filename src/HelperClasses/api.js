import orderBookInstance from './OrderBook';
import { controls } from './controls';
import { getApiBaseUrl } from '../config/runtime';

const API_BASE_URL = getApiBaseUrl();

export const HTTPStatusCodes = Object.freeze({
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  LOCKED: 423,
  TOO_MANY_REQUESTS: 429,
});

export const ErrorCodes = Object.freeze({
  SUCCESS: 0,
  AUTHENTICATION_FAILED: 1,
  RATE_LIMITED: 2,
  TRADE_LOCKED: 3,
  BAD_INPUT: 4,
  AUCTION_LOCKED: 5,
  POSITION_LIMIT_EXCEEDED: 6,
  INSUFFICIENT_BALANCE: 7,
});

let messages = [];

class AsyncAPICall {
  constructor(path, dependency) {
    this.path = path;
    this.data = null;
    this.promise = Promise.resolve();
    this.subscriber = (val) => {};
    this.dependency = dependency;
    this.counter = 0;
  }

  setSubscriber(callbackFunction) {
    this.subscriber = callbackFunction;
  }

  async requestHelper(form) {
    const requestBody = { ...(form || {}) };

    if (this.dependency !== null) {
      await this.dependency.promise;
      if (this.dependency.data && typeof this.dependency.data === 'object') {
        Object.assign(requestBody, this.dependency.data);
      }
    }

    const resp = await fetch(API_BASE_URL + this.path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    let jsonResponse;
    try {
      jsonResponse = await resp.json();
    } catch (_) {
      jsonResponse = { message: { errorMessage: 'Non-JSON response' } };
    }

    jsonResponse.status = resp.status;

    const errorMessage = jsonResponse?.message?.errorMessage;
    const errorCode = jsonResponse?.message?.errorCode;
    if (typeof errorMessage === 'string' || typeof errorCode === 'number') {
      messages.push({
        errorMessage: `${this.path}: ${errorMessage ?? ''}`.trim(),
        errorCode,
      });
    }

    this.data = { ...jsonResponse, ...requestBody };

    if (this.path === '/buildup') {
      if (this.data.username) localStorage.setItem('username', this.data.username);
      if (this.data.apiKey) localStorage.setItem('apiKey', this.data.apiKey);
    }

    this.counter++;
    if (controls) {
      controls.messageCount++;
      controls.messageSubscriber(controls.messageCount);
    }
    this.subscriber(this.counter);
  }

  request(form) {
    this.promise = this.requestHelper(form);
    return this.promise;
  }
}

let buildupObject = new AsyncAPICall('/buildup', null);
let teardownObject = new AsyncAPICall('/teardown', buildupObject);
let limitOrderObject = new AsyncAPICall('/limit_order', buildupObject);
let marketOrderObject = new AsyncAPICall('/market_order', buildupObject);
let bidAuctionObject = new AsyncAPICall('/bid_auction', buildupObject);
let removeObject = new AsyncAPICall('/remove', buildupObject);
let tickers = [];
const setTickers = (newTickers) => {
  if (Array.isArray(newTickers)) {
    // ✅ Ensure only valid strings get added
    const filteredTickers = newTickers.filter((ticker) => typeof ticker === 'string');
    tickers.splice(0, tickers.length, ...filteredTickers);
  }
};
export function buildupHandler(data, subscriber) {
  // Set a subscriber that gets triggered when the API call completes
  buildupObject.setSubscriber((counter) => {
    subscriber(counter);

    // After the build-up is successful (counter > 0), connect to WebSocket
    if (counter > 0) {
      const buildupData = getBuildupData();
      if (
        buildupData &&
        buildupData.username &&
        buildupData.sessionToken &&
        buildupData.orderBookData
      ) {
        buildupData.orderBookData = JSON.parse(buildupData.orderBookData);
        setTickers(Object.keys(buildupData.orderBookData));
        orderBookInstance._createSortedMap(buildupData.orderBookData);
      } else {
        console.error('Buildup data is incomplete. Cannot connect to WebSocket.');
      }
    }
  });

  // Initiate the API call
  buildupObject.request(data);
}

export function teardownHandler(data, subscriber) {
  teardownObject.setSubscriber(subscriber);
  teardownObject.request(data);
}

export function limitOrderHandler(data, subscriber) {
  limitOrderObject.setSubscriber(subscriber);
  limitOrderObject.request(data);
}

export function marketOrderHandler(data, subscriber) {
  marketOrderObject.setSubscriber(subscriber);
  marketOrderObject.request(data);
}
export function bidAuctionHandler(data, subscriber) {
  bidAuctionObject.setSubscriber(subscriber);
  bidAuctionObject.request(data);
}
export function removeHandler(data) {
  removeObject.request(data);
}

export function getBuildupData() {
  return buildupObject.data;
}

export function getTeardownData() {
  return teardownObject.data;
}

export function getLimitOrderData() {
  return limitOrderObject.data;
}

export function getMarketOrderData() {
  return marketOrderObject.data;
}
export function getBidAuctionData() {}
export function getTickers() {
  return Array.isArray(tickers) && tickers.length > 0 ? [...tickers] : [];
}
export function getMessageList() {
  return messages;
}

// --- Update-recovery endpoints (seq) ---

async function requestWithAuth(method, pathWithQuery) {
  const buildupData = getBuildupData();
  if (!buildupData || !buildupData.sessionToken || !buildupData.username) {
    return {
      status: HTTPStatusCodes.UNAUTHORIZED,
      message: {
        errorMessage: 'Missing session credentials',
        errorCode: ErrorCodes.AUTHENTICATION_FAILED,
      },
    };
  }

  const url = new URL(API_BASE_URL + pathWithQuery);
  // Backends commonly auth these endpoints the same way as the websocket.
  url.searchParams.set('Session-ID', buildupData.sessionToken);
  url.searchParams.set('Username', buildupData.username);

  const resp = await fetch(url.toString(), {
    method,
    headers: {
      Accept: 'application/json',
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    },
    body:
      method !== 'GET'
        ? JSON.stringify({ username: buildupData.username, sessionToken: buildupData.sessionToken })
        : undefined,
  });

  let json;
  try {
    json = await resp.json();
  } catch (_) {
    json = { message: { errorMessage: 'Non-JSON response' } };
  }
  json.status = resp.status;
  return json;
}

export async function fetchSnapshot() {
  // Prefer GET (as per docs), but fall back to POST if server is implemented that way.
  const getResp = await requestWithAuth('GET', '/snapshot');
  if (getResp.status === HTTPStatusCodes.OK) return getResp;
  if (getResp.status === 404 || getResp.status === 405) {
    return await requestWithAuth('POST', '/snapshot');
  }
  return getResp;
}

export async function fetchUpdateBySeq(seq) {
  const safeSeq = Number(seq);
  if (!Number.isFinite(safeSeq) || safeSeq < 0) {
    return {
      status: HTTPStatusCodes.BAD_REQUEST,
      message: { errorMessage: 'Invalid seq', errorCode: ErrorCodes.BAD_INPUT },
    };
  }
  return await requestWithAuth('GET', `/updates?seq=${encodeURIComponent(String(safeSeq))}`);
}
