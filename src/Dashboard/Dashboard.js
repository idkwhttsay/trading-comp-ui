import React, { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import AuthenticationInput from '../widgets/AuthenticationInput.js';
import samplePnlData from '../SampleData/samplePnlData.json';
import { getTickers } from '../HelperClasses/api';

const Dashboard = () => {
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [tickers, setTickers] = useState([]);

    useEffect(() => {
        let interval;
        const fetchTickers = async () => {
            try {
                const fetchedTickers = getTickers();
                const validTickers = Array.isArray(fetchedTickers)
                    ? fetchedTickers.filter((ticker) => typeof ticker === 'string')
                    : [];

                if (validTickers.length > 0) setTickers(validTickers);
            } catch (error) {
                console.error('Error fetching tickers:', error);
                setTickers([]); // Default to empty array on error
            }
        };
        interval = setInterval(fetchTickers, 3000);
        return () => clearInterval(interval);
    }, []);

    const ordersForSelected = useMemo(() => {
        return samplePnlData.filter(
            (order) => typeof order.ticker === 'string' && order.ticker === selectedStock,
        );
    }, [selectedStock]);

    // Placeholder for a future user-info submission widget.
    // Keeping the state here so existing UI behavior remains unchanged.

    return (
        <div className="dashboard">
            <div className="column-1">
                <div className="widget user-info">
                    <h3>User Authentication</h3>
                    <AuthenticationInput />
                </div>

                <div className="widget">
                    <h3>Tickers</h3>
                    <div className="tickers">
                        {tickers.length === 0 ? (
                            <p>Waiting for tickers…</p>
                        ) : (
                            tickers.map((ticker) => (
                                <button
                                    key={ticker}
                                    type="button"
                                    onClick={() => setSelectedStock(ticker)}
                                    className={ticker === selectedStock ? 'selected' : ''}
                                >
                                    {ticker}
                                </button>
                            ))
                        )}
                    </div>
                    <p>Selected: {selectedStock}</p>
                    <p>Sample orders: {ordersForSelected.length}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
