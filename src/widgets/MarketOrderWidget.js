import React, { useState } from 'react';
import { marketOrderHandler } from '../HelperClasses/api';
import './PlaceOrders.css';

const MarketOrdersWidget = ({ selectedStock }) => {
    const [amount, setAmount] = useState(10);
    const [, setSubscribeVar] = useState(0);

    const handleBuy = () => {
        if (!selectedStock) {
            console.error('❌ No stock selected for buying.');
            return;
        }

        marketOrderHandler({ ticker: selectedStock, volume: amount, isBid: true }, setSubscribeVar);

        console.log(`🟢 Buy order placed for ${amount} shares of ${selectedStock} at market.`);
    };

    const handleSell = () => {
        if (!selectedStock) {
            console.error('❌ No stock selected for selling.');
            return;
        }

        marketOrderHandler(
            { ticker: selectedStock, volume: amount, isBid: false },
            setSubscribeVar,
        );

        console.log(`🔴 Sell order placed for ${amount} shares of ${selectedStock} at market.`);
    };

    return (
        <div className="widget-container">
            <div className="buy-sell-flex">
                <div className="buy-sell-column-1">
                    <button className="buy-button" onClick={handleBuy}>
                        {' '}
                        Buy{' '}
                    </button>
                    <button className="sell-button" onClick={handleSell}>
                        {' '}
                        Sell{' '}
                    </button>
                </div>

                <div className="buy-sell-column-2">
                    <label htmlFor="volume"> Volume: </label>
                </div>

                <div className="buy-sell-column-3">
                    <div className="input-group">
                        <input
                            id="volume"
                            type="number"
                            className={`quantity-input ${amount === 0 || amount === '' ? 'placeholder-visible' : ''}`}
                            value={amount === '' ? '' : amount}
                            onChange={(e) => {
                                const value = e.target.value;
                                setAmount(value === '' ? '' : Number(value));
                            }}
                            placeholder="Enter Quantity"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketOrdersWidget;
