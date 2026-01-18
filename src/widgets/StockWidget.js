import React from 'react';
import './StockWidget.css';

const StockWidget = ({ ticker, selected }) => {
  console.log('🔍 StockWidget received ticker:', ticker);

  // Ensure ticker is always a valid string
  if (!ticker || typeof ticker !== 'string') {
    console.error('❌ Invalid ticker received:', ticker);
    return <div className="stock-widget"> Build Up First! </div>;
  }

  return (
    <div className={`${selected ? 'selected-' : ''}stock-widget`}>
      <div className="stock-header">
        <span className="ticker"> {ticker} </span>
      </div>
    </div>
  );
};

export default StockWidget;
