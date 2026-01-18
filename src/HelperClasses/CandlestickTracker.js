import { createLogger } from '../util/logger';

const log = createLogger('CandlestickTracker');

class CandlestickTracker {
  constructor() {
    this.tickerCandlesticks = new Map(); // Stores candlestick data per ticker
    this.subscribers = new Set(); // Stores subscribers (e.g., UI components)
  }

  /**
   * Inserts OHLC data directly for a specific ticker.
   * @param {string} ticker - The stock ticker symbol
   * @param {Object} ohlc - OHLC data in the format { open, high, low, close, timestamp }
   */
  insertCandle(ticker, ohlc) {
    if (!this.tickerCandlesticks.has(ticker)) {
      this.tickerCandlesticks.set(ticker, []);
    }

    this.tickerCandlesticks.get(ticker).push({
      x: new Date(ohlc.timestamp), // Use the provided timestamp
      y: [ohlc.open, ohlc.high, ohlc.low, ohlc.close], // Store OHLC values
    });

    log.debug('Inserted candlestick', { ticker, ohlc });

    // Notify subscribers after inserting new candlestick
    this.notifySubscribers();
  }

  /**
   * Retrieves all stored candlestick data for all tickers.
   * @returns {Object} { ticker: [{ x: Date, y: [open, high, low, close] }] }
   */
  getAllCandlestickData() {
    const result = {};
    this.tickerCandlesticks.forEach((data, ticker) => {
      result[ticker] = data;
    });
    return result;
  }

  /**
   * Retrieves candlestick data for a specific ticker.
   * @param {string} ticker - The stock ticker symbol.
   * @returns {Array} Array of candlestick objects [{ x: Date, y: [open, high, low, close] }]
   */
  getCandlestickData(ticker) {
    return this.tickerCandlesticks.get(ticker) || [];
  }

  /**
   * Subscribes a callback function to receive updates when new candlesticks are added.
   * @param {Function} callback - Function to be called on updates.
   */
  subscribe(callback) {
    this.subscribers.add(callback);
  }

  /**
   * Unsubscribes a callback function from receiving updates.
   * @param {Function} callback - Function to remove from subscribers.
   */
  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  /**
   * Notifies all subscribers when data is updated.
   */
  notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.getAllCandlestickData()));
  }
}

// Export a singleton instance
const candlestickTracker = new CandlestickTracker();
export default candlestickTracker;
