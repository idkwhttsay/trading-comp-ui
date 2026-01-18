import React, { useMemo } from 'react';
import './TradeTable.css';
import { removeHandler } from '../../lib/api';
import { createLogger } from '../../utils/logger';
import { usePortfolio } from '../../app/providers';

const log = createLogger('NewTradeTable');

const TradeTable = () => {
    const portfolio = usePortfolio();
    const positions = (portfolio?.positions || {}) as Record<string, any>;
    const openOrders = useMemo(() => (portfolio as any)?.Orders || [], [portfolio]);

    const handleRemoveOrder = (orderId) => {
        log.info('Removing order', { orderId });
        removeHandler({ orderId: orderId });
    };

    return (
        <div className="pnl-dashboard">
            {/* Flex container for tables */}
            <div className="tables-container">
                {/* Current Positions Table */}
                <div className="table-wrapper">
                    <h3>Current Positions</h3>
                    <table className="pnl-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Action</th>
                                <th>Price</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(positions).length > 0 ? (
                                Object.entries(positions).map(([ticker, details], index) => (
                                    <tr key={`position-${index}`}>
                                        <td>{ticker}</td>
                                        <td>{}</td>
                                        <td>{(details as any)?.averagePrice}</td>
                                        <td>{(details as any)?.quantity}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} style={{ textAlign: 'center' }}>
                                        No positions available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Open Orders Table */}
                <div className="table-wrapper">
                    <h3>Open Orders</h3>
                    <table className="pnl-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Side</th>
                                <th>Price</th>
                                <th>Volume</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {openOrders.length > 0 ? (
                                openOrders.map((order, index) => (
                                    <tr key={`order-${index}`}>
                                        <td>{order.ticker}</td>
                                        <td>{order.side}</td>
                                        <td>{order.price}</td>
                                        <td>{order.volume}</td>
                                        <td>
                                            <button
                                                className="remove-order-btn"
                                                onClick={() => handleRemoveOrder(order.orderId)}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center' }}>
                                        No open orders
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TradeTable;
