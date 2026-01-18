import React from 'react';
import './PriceLevelWidgets.css';

type PriceLevelWidgetProps = {
    price: React.ReactNode;
    quantity: React.ReactNode;
    amount?: React.ReactNode;
    className?: string;
};

const PriceLevelWidget = ({ price, quantity, amount, className }: PriceLevelWidgetProps) => {
    return (
        <div className={`price-level-widget ${className}`}>
            <span className="price">{price}</span>
            <span className="quantity">{quantity}</span>
            <span className="amount">{amount}</span> {/* Supports JSX like buttons */}
        </div>
    );
};

export default PriceLevelWidget;
