class OrderBook {
  constructor(rawOrderBook = {}) {
    if (typeof rawOrderBook !== 'object' || Array.isArray(rawOrderBook)) {
      throw new TypeError('Input data must be an object.');
    }

    this.orderBooks = {};
    this.subscribers = [];

    // Initialize order books
    for (const [ticker, volumes] of Object.entries(rawOrderBook)) {
      this.orderBooks[ticker] = {
        bidVolumes: this._createSortedMap(volumes.bidVolumes || {}, true),
        askVolumes: this._createSortedMap(volumes.askVolumes || {}, false),
      };
    }
  }

  // Subscribe to changes
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
      console.log('✅ Subscribed a new callback. Total subscribers:', this.subscribers.length);
    }
  }

  // Unsubscribe from changes
  unsubscribe(callback) {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  // Notify all subscribers
  _notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.orderBooks));
  }

  // Helper to create a sorted map (object) from volumes
  _createSortedMap(volumes, reverse) {
    if (!volumes || typeof volumes !== 'object') {
      console.warn('⚠️ Invalid volumes received:', volumes);
      return {};
    }

    console.log('🔄 Building Up Order Book for All Tickers...');

    // **Log all tickers (top-level keys in volumes)**
    const tickers = Object.keys(volumes);
    console.log('📌 Tickers in Order Book:', tickers);

    // **Store processed order books**

    // **Iterate through each ticker**
    for (const ticker of tickers) {
      const tickerData = volumes[ticker];

      if (!tickerData || typeof tickerData !== 'object') {
        console.warn(`⚠️ Skipping invalid ticker: ${ticker}`);
        continue;
      }

      console.log(`📊 Processing Ticker: ${ticker}`);

      // **Extract bidVolumes and askVolumes**
      const bidVolumes = tickerData.bidVolumes || {};
      const askVolumes = tickerData.askVolumes || {};

      console.log(`📉 Ask Volume Keys for ${ticker}:`, Object.keys(askVolumes));
      console.log(`📈 Bid Volume Keys for ${ticker}:`, Object.keys(bidVolumes));

      // **Sort bidVolumes (high-to-low) and askVolumes (low-to-high)**
      this.orderBooks[ticker] = {
        bidVolumes: Object.fromEntries(
          Object.entries(bidVolumes)
            .filter(
              ([price, qty]) =>
                !isNaN(parseFloat(price)) && !isNaN(parseFloat(qty)) && parseFloat(qty) > 0,
            )
            .map(([price, qty]) => [parseFloat(price), parseFloat(qty)])
            .sort(([priceA], [priceB]) => priceB - priceA), // High to Low
        ),
        askVolumes: Object.fromEntries(
          Object.entries(askVolumes)
            .filter(
              ([price, qty]) =>
                !isNaN(parseFloat(price)) && !isNaN(parseFloat(qty)) && parseFloat(qty) > 0,
            )
            .map(([price, qty]) => [parseFloat(price), parseFloat(qty)])
            .sort(([priceA], [priceB]) => priceA - priceB), // Low to High
        ),
      };

      console.log(`✅ Built Order Book for ${ticker}:`, this.orderBooks[ticker]);
    }
    this._notifySubscribers();
  }

  updateVolumes(updates) {
    updates.forEach(({ ticker, price, side, volume }) => {
      const sideKey = side.toLowerCase() === 'bid' ? 'bidVolumes' : 'askVolumes';
      //console.log(ticker, price, side, volume);

      // Ensure the ticker exists
      if (!this.orderBooks[ticker]) {
        this.orderBooks[ticker] = { bidVolumes: {}, askVolumes: {} };
      }

      // Convert price to a numeric key for consistency
      const numericPrice = parseFloat(price);

      if (volume === 0) {
        // Remove price level if volume is zero
        console.log('Delete Occurring');
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
          .filter(([p, q]) => !isNaN(parseFloat(p)) && !isNaN(parseFloat(q)) && parseFloat(q) > 0)
          .map(([p, q]) => [parseFloat(p), parseFloat(q)])
          .sort(([pA], [pB]) => (sideKey === 'bidVolumes' ? pB - pA : pA - pB)),
      );
    });

    this._notifySubscribers(); // Notify React components
  }

  resetFromSnapshot(rawOrderBook) {
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
