import React from 'react';
import './StockWidget.css';
import { createLogger } from '../../utils/logger';

const log = createLogger('StockWidget');

const StockWidget = ({ ticker, selected }) => {
    log.debug('Received ticker', { ticker });

    // Ensure ticker is always a valid string
    if (!ticker || typeof ticker !== 'string') {
        log.warn('Invalid ticker received', { ticker });
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
