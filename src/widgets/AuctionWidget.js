import React, { useState } from 'react';
// import DataFinder from "../HelperClasses/DataFinder";
import './AuctionWidget.css';
import { bidAuctionHandler } from '../HelperClasses/api';

// const calculatePnL = () => {
//     const pnlResults = DataFinder.getPositionData("12345").map(trade => {
//         const marketData = DataFinder.getStockInfo(trade.ticker);
//
//         if (!marketData) {
//             console.warn(`Market data not found for ticker: ${trade.ticker}`);
//             return { ...trade, pnl: 0 };
//         }
//
//         const marketPrice = marketData.price;
//         let pnl = 0;
//
//         if (trade.is_buy) {
//             pnl = (marketPrice - trade.price) * trade.quantity;
//         } else if (trade.is_sell) {
//             pnl = (trade.price - marketPrice) * trade.quantity;
//         }
//
//         return { ...trade, pnl: pnl.toFixed(2), result: (pnl > 0 ? "Profit" : "Loss") };
//     });
//
//     return pnlResults;
// };
//
// const pnlData = calculatePnL();
// const realizedPnL = pnlData.reduce((total, trade) => total + parseFloat(trade.pnl), 0);

const AuctionWidget = () => {
    const [inputValue, setInputValue] = useState(0);
    const [, setSubscribeVar] = useState(true);

    const handleInputChange = (e) => {
        const value = parseFloat(e.target.value);
        setInputValue(value);
    };

    const handleSubmit = () => {
        // alert(`Submitted value: ${inputValue}`);
        console.log(`Auctioned value: ${inputValue}`);
        bidAuctionHandler({ bid: inputValue }, setSubscribeVar);
    };

    return (
        <div className="auction-widget">
            <div className="auction-widget-header">Auction</div>
            <div className="auction-widget-content">
                <input
                    type="number"
                    placeholder="Enter auction bid"
                    value={inputValue}
                    onChange={handleInputChange}
                    className="auction-widget-input"
                />
                <button className="auction-widget-button" onClick={handleSubmit}>
                    Submit
                </button>
            </div>
        </div>
    );
};

export default AuctionWidget;
