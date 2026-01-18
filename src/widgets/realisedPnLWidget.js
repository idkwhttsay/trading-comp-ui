import React, { useEffect, useState } from 'react';
import userPortfolio from '../HelperClasses/UserPortfolio';
import './PnLWidget.css';

const RealizedPnLWidget = () => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const handlePortfolioUpdate = (portfolioData) => {
      setBalance(portfolioData.balance || 0);
    };

    userPortfolio.subscribe(handlePortfolioUpdate);
    setBalance(userPortfolio.getPortfolio().balance || 0);

    return () => userPortfolio.unsubscribe(handlePortfolioUpdate);
  }, []);

  return (
    <div className={`pnl-widget ${balance >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
      <p className="pnl-heading">Balance</p>
      <p className="pnl-value">${balance.toFixed(0)}</p>
    </div>
  );
};

export default RealizedPnLWidget;
