import React, { useMemo } from 'react';
import { usePortfolio } from '../../app/providers';
import './PnLWidget.css';

const PnLWidget = () => {
    const portfolio = usePortfolio();
    const pnl = useMemo(() => portfolio?.pnl || 0, [portfolio]);

    return (
        <div className={`pnl-widget ${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
            <p className="pnl-heading">Estimated PnL</p>
            <p className="pnl-value">${pnl.toFixed(0)}</p>
        </div>
    );
};

export default PnLWidget;
