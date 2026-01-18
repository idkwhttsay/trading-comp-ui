import React, { useEffect, useState } from 'react';
import userPortfolio from '../HelperClasses/UserPortfolio';
import './PnLWidget.css';

const PnLWidget = () => {
  const [pnl, setPnl] = useState(0);

  useEffect(() => {
    const handlePortfolioUpdate = (portfolioData) => {
      setPnl(portfolioData.pnl || 0);
    };

    userPortfolio.subscribe(handlePortfolioUpdate);
    setPnl(userPortfolio.getPortfolio().pnl || 0);

    return () => userPortfolio.unsubscribe(handlePortfolioUpdate);
  }, []);

  return (
    <div className={`pnl-widget ${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
      <p className="pnl-heading">Estimated PnL</p>
      <p className="pnl-value">${pnl.toFixed(0)}</p>
    </div>
  );
};

export default PnLWidget;
