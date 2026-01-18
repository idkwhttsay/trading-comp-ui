import React, { useEffect, useState } from 'react';
import './EquityDashboard.css';
import { getTickers } from '../HelperClasses/api.js';
import StockWidget from './StockWidget.js'; // Ensure StockWidget is imported
import { createLogger } from '../util/logger';

const log = createLogger('EquityDashboard');

const EquitiesDashboard = ({ selectedStock, setSelectedStock }) => {
    const [tickers, setTickers] = useState([]);

    useEffect(() => {
        const fetchedTickers = getTickers();
        log.debug('Retrieved tickers', { fetchedTickers });
        if (Array.isArray(fetchedTickers)) {
            setTickers(fetchedTickers);
        } else {
            log.error('getTickers() did not return an array', { fetchedTickers });
            setTickers([]);
        }
    }, []);

    const handleStockClick = (ticker) => {
        setSelectedStock(ticker);
    };

    return (
        <div className="equities-dashboard">
            <div className="tickers-container">
                {tickers.length > 0 ? (
                    tickers.map((ticker) => (
                        <div
                            key={ticker}
                            className={`stock-item ${selectedStock === ticker ? 'selected' : ''}`}
                            onClick={() => handleStockClick(ticker)}
                        >
                            <StockWidget ticker={ticker} selected={selectedStock === ticker} />
                        </div>
                    ))
                ) : (
                    <p> No tickers available </p>
                )}
            </div>
        </div>
    );
};

export default EquitiesDashboard;
