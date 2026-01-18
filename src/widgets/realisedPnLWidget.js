import React, { useMemo } from 'react';
import { usePortfolio } from '../providers';
import './PnLWidget.css';

const RealizedPnLWidget = () => {
    const portfolio = usePortfolio();
    const balance = useMemo(() => portfolio?.balance || 0, [portfolio]);

    return (
        <div className={`pnl-widget ${balance >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
            <p className="pnl-heading">Balance</p>
            <p className="pnl-value">${balance.toFixed(0)}</p>
        </div>
    );
};

export default RealizedPnLWidget;
