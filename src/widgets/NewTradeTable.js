import React, { useEffect, useState } from 'react';
import './TradeTable.css';
import userPortfolio from '../HelperClasses/UserPortfolio';
import { removeHandler } from '../HelperClasses/api.js';

const TradeTable = () => {
  const [balance, setBalance] = useState(0);
  const [positions, setPositions] = useState({});
  const [openOrders, setOpenOrders] = useState([]);
  const [pnl, setPnl] = useState(0);

  useEffect(() => {
    const handlePortfolioUpdate = (portfolioData) => {
      setBalance(portfolioData.balance || 0);
      setPositions(portfolioData.positions || {});
      setOpenOrders(portfolioData.Orders || []);
      setPnl(portfolioData.pnl || 0);
    };

    userPortfolio.subscribe(handlePortfolioUpdate);

    const currentPortfolio = userPortfolio.getPortfolio();
    setBalance(currentPortfolio.balance || 0);
    setPositions(currentPortfolio.positions || {});
    setOpenOrders(currentPortfolio.Orders || []);

    return () => {
      userPortfolio.unsubscribe(handlePortfolioUpdate);
    };
  }, []);

  const handleRemoveOrder = (orderId) => {
    console.log(`Removing order with ID: ${orderId}`);
    removeHandler({ orderId: orderId });
  };

  return (
    <div className="pnl-dashboard">
      <div className="tables-container">
        <div className="table-wrapper">
          <h3>Account</h3>
          <p>Balance: {balance}</p>
          <p>PnL: {pnl}</p>
        </div>
      </div>
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
                    <td>{details.averagePrice}</td>
                    <td>{details.quantity}</td>
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
