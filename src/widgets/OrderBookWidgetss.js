import React, { useEffect, useRef, useState } from 'react';
import PriceLevelWidget from './PriceLevelWidgets';
import './OrderBookWidgets.css';
import { truncateDecimal } from '../util/math'; // Import the truncateDecimal function
import { useOrderBook } from '../providers';

const OrderBookWidget = ({ selectedStock }) => {
    const { bidVolumes, askVolumes, hasOrderBook } = useOrderBook(selectedStock);

    const sortedBids = Object.entries(bidVolumes)
        .map(([price, quantity]) => ({ P: parseFloat(price), Q: quantity }))
        .sort((a, b) => b.P - a.P); // Sorted from highest to lowest

    const sortedAsks = Object.entries(askVolumes)
        .map(([price, quantity]) => ({ P: parseFloat(price), Q: quantity }))
        .sort((a, b) => a.P - b.P); // Sorted from lowest to highest

    const spread =
        sortedAsks.length > 0 && sortedBids.length > 0
            ? `${truncateDecimal(sortedAsks[0].P - sortedBids[0].P, 2)} (${truncateDecimal((100 * (sortedAsks[0].P - sortedBids[0].P)) / ((sortedAsks[0].P + sortedBids[0].P) / 2), 2)}%)`
            : `N/A`;

    const [autoCenter, setAutoCenter] = useState(true);

    const asksRef = useRef(null);

    useEffect(() => {
        if (asksRef.current && autoCenter) {
            asksRef.current.scrollTop = asksRef.current.scrollHeight - asksRef.current.clientHeight;
        }
    }, [sortedAsks, autoCenter]);

    const bidsRef = useRef(null);

    useEffect(() => {
        if (bidsRef.current && autoCenter) {
            bidsRef.current.scrollTop = 0;
        }
    }, [sortedBids, autoCenter]);

    useEffect(() => {
        const handleBidsScroll = () => {
            if (bidsRef.current && bidsRef.current.scrollTop !== 0) {
                setAutoCenter((prev) => (prev ? !prev : prev));
            }
        };

        const handleAsksScroll = () => {
            if (
                asksRef.current &&
                asksRef.current.scrollTop !==
                    asksRef.current.scrollHeight - asksRef.current.clientHeight
            ) {
                setAutoCenter((prev) => (prev ? !prev : prev));
            }
        };

        const bidsDivElement = bidsRef.current;
        if (bidsDivElement) {
            bidsDivElement.addEventListener('scroll', handleBidsScroll);
        }

        const asksDivElement = asksRef.current;
        if (asksDivElement) {
            asksDivElement.addEventListener('scroll', handleAsksScroll);
        }

        return () => {
            if (bidsDivElement) {
                bidsDivElement.removeEventListener('scroll', handleBidsScroll);
            }

            if (asksDivElement) {
                asksDivElement.removeEventListener('scroll', handleAsksScroll);
            }
        };
    }, [autoCenter]);

    const handleReCenter = () => {
        setAutoCenter((prev) => (prev ? prev : !prev));
    };

    return (
        <div className="order-book-widget">
            <h4>Order Book for {selectedStock}</h4>
            {!hasOrderBook || (sortedBids.length === 0 && sortedAsks.length === 0) ? (
                <p className="empty-order-book">Empty Order Book</p>
            ) : (
                <>
                    <div className="column-headers">
                        <span className="header price-header"> Price </span>
                        <span className="header quantity-header"> Quantity </span>
                        {/*<span className="header orders-header"> Amount </span>*/}
                    </div>
                    <div ref={asksRef} className="order-book-scrollable-asks">
                        {/* Asks */}
                        {sortedAsks.length > 0 ? (
                            sortedAsks.map((ask, index) => (
                                <PriceLevelWidget
                                    key={`ask-${index}`}
                                    price={truncateDecimal(ask.P, 2)}
                                    quantity={truncateDecimal(ask.Q, 2)}
                                    // amount={truncateDecimal(ask.P * ask.Q)}
                                    className="ask-row"
                                />
                            ))
                        ) : (
                            <p className="empty-section">No asks available</p>
                        )}
                    </div>

                    {/* Spread & Re-Center in a single row */}
                    <PriceLevelWidget
                        price={`Spread: ${spread}`}
                        quantity={''} // No quantity needed
                        amount={
                            <button
                                onClick={handleReCenter}
                                style={{
                                    backgroundColor: autoCenter ? 'grey' : 'black',
                                    color: 'white',
                                    padding: '5px 10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '5px',
                                }}
                            >
                                Re-Center
                            </button>
                        }
                        className="spread-row"
                    />

                    <div ref={bidsRef} className="order-book-scrollable-bids">
                        {/* Bids */}
                        {sortedBids.length > 0 ? (
                            sortedBids.map((bid, index) => (
                                <PriceLevelWidget
                                    key={`bid-${index}`}
                                    price={truncateDecimal(bid.P, 2)}
                                    quantity={truncateDecimal(bid.Q, 2)}
                                    // amount={truncateDecimal(bid.Q * bid.P, 2)}
                                    className="bid-row"
                                />
                            ))
                        ) : (
                            <p className="empty-section">No bids available</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderBookWidget;
