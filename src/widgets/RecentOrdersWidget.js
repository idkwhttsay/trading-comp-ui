import React from 'react';
import './RecentOrdersWidget.css';

const RecentOrdersWidget = ({ orders }) => {
  return (
    <div className="recent-orders">
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Trade Price</th>
            <th>Quantity</th>
            <th>Total Value</th> {/* New Column Header */}
          </tr>
        </thead>
        <tbody>
          {orders && orders.length > 0 ? (
            orders.map((order, index) => (
              <tr key={index}>
                <td>{order.is_buy ? 'Buy' : 'Sell'}</td>
                <td>${order.price.toFixed(2)}</td>
                <td>{order.quantity}</td>
                <td>${(order.price * order.quantity).toFixed(2)}</td> {/* Calculate Total Value */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>
                No orders available for this stock.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RecentOrdersWidget;
