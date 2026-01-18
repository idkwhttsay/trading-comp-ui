import React, { useState, useEffect } from 'react';
import samplePnLData from '../../SampleData/samplePnlData.json';
import sampleStockWidgetData from '../../SampleData/sampleStockWidgetData.json';
import DataFinder from '../../lib/DataFinder';
import { createLogger } from '../../utils/logger';

const log = createLogger('BuySellWidget');

const BuyButton = ({ selectedStock }) => {
    //const stock = sampleStockWidgetData.find(stock => stock.ticker === selectedStock);
    const stock = DataFinder.getDataMatch(sampleStockWidgetData, 'ticker', selectedStock);

    const price = stock.price;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
    const [activeButton, setActiveButton] = useState(null); // Reference to the active button
    const [modalContent, setModalContent] = useState(''); // To store the content type (buy/sell)
    const isPositive = stock.percentageChange.includes('+');
    const [orderType, setOrderType] = useState('market'); // State to manage Market/Limit toggle
    const [quantityType, setQuantityType] = useState('shares'); // State to manage shares/dollars toggle
    const [quantity, setQuantity] = useState(0);
    const [limitPrice, setLimitPrice] = useState(0);

    const handleOrderTypeChange = (type) => {
        setOrderType(type); // Change the order type to Market or Limit
    };

    const handleQuantityTypeChange = (type) => {
        setQuantityType(type); // Change the order type to Market or Limit
    };

    const updateModalPosition = (buttonElement) => {
        if (buttonElement) {
            const buttonRect = buttonElement.getBoundingClientRect();
            const top = buttonRect.bottom + window.scrollY + 10; // Position below the button
            const left = buttonRect.left + window.scrollX + buttonRect.width / 2; // Center horizontally

            setModalPosition({ top, left });
        }
    };

    const handleBuySellClick = (event, type) => {
        if (isModalOpen && event.target === activeButton) {
            setIsModalOpen(false);
        } else {
            const buttonElement = event.target;
            setActiveButton(buttonElement); // Store reference to the button
            updateModalPosition(buttonElement);
            setModalContent(type); // Set modal content to "buy" or "sell"
            setIsModalOpen(true);
        }
    };

    const handleCompleteClick = (type) => {
        setIsModalOpen(false);
        log.info('Order complete (UI only)', {
            type,
            orderType,
            quantity,
            limitPrice,
            price,
            selectedStock,
        });
    };

    // Recalculate modal position on window resize
    useEffect(() => {
        const handleResize = () => {
            if (isModalOpen && activeButton) {
                updateModalPosition(activeButton);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isModalOpen, activeButton]);

    return (
        <div>
            <span>Current Stock: {selectedStock}</span>
            <br></br>
            <span>Current Price: {price}</span>
            <div className="button-container">
                <button
                    className="button buy"
                    onClick={(event) => handleBuySellClick(event, 'buy')}
                >
                    Buy
                </button>
                <button
                    className="button sell"
                    onClick={(event) => handleBuySellClick(event, 'sell')}
                >
                    Sell
                </button>
            </div>
            {isModalOpen && (
                <div
                    className="modal"
                    style={{
                        top: `${modalPosition.top}px`,
                        left: `${modalPosition.left}px`,
                    }}
                >
                    <div className="modal-box">
                        <div className="triangle"></div>
                        <div className="modal-content">
                            {modalContent === 'buy' ? (
                                <div className="buy-section">
                                    <span>Trading: {selectedStock}</span>
                                    <br></br>
                                    <span className="price-span">{price}</span>{' '}
                                    <span
                                        className={
                                            isPositive
                                                ? 'price-change-positive'
                                                : 'price-change-negative'
                                        }
                                    >
                                        ({stock.change}/{stock.percentageChange})
                                    </span>
                                    {/* Quantity Type Toggle Buttons */}
                                    <div className="order-type-toggle">
                                        <button
                                            className={`order-btn ${quantityType === 'shares' ? 'active' : ''}`}
                                            onClick={() => handleQuantityTypeChange('shares')}
                                        >
                                            Shares
                                        </button>
                                        <span className="divider"></span>
                                        <button
                                            className={`order-btn ${quantityType === 'dollars' ? 'active' : ''}`}
                                            onClick={() => handleQuantityTypeChange('dollars')}
                                        >
                                            Dollars
                                        </button>
                                    </div>
                                    {/* Quantity Input Field */}
                                    <div className="quantity-input-container">
                                        <label htmlFor="quantity" className="quantity-label">
                                            Enter Quantity:
                                        </label>
                                        <input
                                            type="number"
                                            id="quantity"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="quantity-input"
                                            placeholder="Enter quantity"
                                        />
                                    </div>
                                    {/* Order Type Toggle Buttons */}
                                    <div className="order-type-toggle">
                                        <button
                                            className={`order-btn ${orderType === 'market' ? 'active' : ''}`}
                                            onClick={() => handleOrderTypeChange('market')}
                                        >
                                            Market
                                        </button>
                                        <span className="divider"></span>
                                        <button
                                            className={`order-btn ${orderType === 'limit' ? 'active' : ''}`}
                                            onClick={() => handleOrderTypeChange('limit')}
                                        >
                                            Limit
                                        </button>
                                    </div>
                                    <div>
                                        {/* Limit Order Price Selector */}
                                        <div
                                            className={`quantity-input-container ${orderType === 'limit' ? '' : 'hidden'}`}
                                        >
                                            <label htmlFor="quantity" className="quantity-label">
                                                Enter Limit Price:
                                            </label>
                                            <input
                                                type="number"
                                                id="quantity"
                                                value={limitPrice}
                                                onChange={(e) => setLimitPrice(e.target.value)}
                                                className="quantity-input"
                                                placeholder="Enter Limit Price"
                                            />
                                        </div>
                                    </div>
                                    <br></br>
                                    <br></br>
                                    {/* Estimated Value or Shares Amt */}
                                    {quantityType === 'shares' && (
                                        <div>
                                            <span>
                                                Estimated Value: $
                                                {orderType === 'limit'
                                                    ? (quantity * limitPrice).toFixed(2)
                                                    : (quantity * stock.price).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {quantityType === 'dollars' && (
                                        <div>
                                            <span>
                                                Est.Shares Amt:{' '}
                                                {orderType === 'limit'
                                                    ? (quantity / limitPrice).toFixed(2)
                                                    : (quantity / stock.price).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        className="button complete-order"
                                        onClick={() => handleCompleteClick('buy')}
                                    >
                                        Complete Order
                                    </button>
                                </div>
                            ) : (
                                <div className="sell-section">
                                    <span>Trading: {selectedStock}</span>
                                    <br></br>
                                    <span className="price-span">{price}</span>{' '}
                                    <span
                                        className={
                                            isPositive
                                                ? 'price-change-positive'
                                                : 'price-change-negative'
                                        }
                                    >
                                        ({stock.change}/{stock.percentageChange})
                                    </span>
                                    <br></br>
                                    <span className="price-span">
                                        Owned:{' '}
                                        {
                                            samplePnLData.find(
                                                (stock) => stock.ticker === selectedStock,
                                            ).quantity
                                        }
                                    </span>
                                    {/* Quantity Type Toggle Buttons */}
                                    <div className="order-type-toggle">
                                        <button
                                            className={`order-btn ${quantityType === 'shares' ? 'active' : ''}`}
                                            onClick={() => handleQuantityTypeChange('shares')}
                                        >
                                            Shares
                                        </button>
                                        <span className="divider"></span>
                                        <button
                                            className={`order-btn ${quantityType === 'dollars' ? 'active' : ''}`}
                                            onClick={() => handleQuantityTypeChange('dollars')}
                                        >
                                            Dollars
                                        </button>
                                    </div>
                                    {/* Quantity Input Field */}
                                    <div className="quantity-input-container">
                                        <label htmlFor="quantity" className="quantity-label">
                                            Enter Quantity:
                                        </label>
                                        <input
                                            type="number"
                                            id="quantity"
                                            value={quantity}
                                            min={0}
                                            max={
                                                quantityType === 'shares'
                                                    ? samplePnLData.find(
                                                          (stock) => stock.ticker === selectedStock,
                                                      ).quantity
                                                    : samplePnLData.find(
                                                          (stock) => stock.ticker === selectedStock,
                                                      ).quantity * price
                                            }
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="quantity-input"
                                            placeholder="Enter quantity"
                                        />
                                    </div>
                                    {/* Order Type Toggle Buttons */}
                                    <div className="order-type-toggle">
                                        <button
                                            className={`order-btn ${orderType === 'market' ? 'active' : ''}`}
                                            onClick={() => handleOrderTypeChange('market')}
                                        >
                                            Market
                                        </button>
                                        <span className="divider"></span>
                                        <button
                                            className={`order-btn ${orderType === 'limit' ? 'active' : ''}`}
                                            onClick={() => handleOrderTypeChange('limit')}
                                        >
                                            Limit
                                        </button>
                                    </div>
                                    <div>
                                        {/* Limit Order Price Selector */}
                                        <div
                                            className={`quantity-input-container ${orderType === 'limit' ? '' : 'hidden'}`}
                                        >
                                            <label htmlFor="quantity" className="quantity-label">
                                                Enter Limit Price:
                                            </label>
                                            <input
                                                type="number"
                                                id="quantity"
                                                value={limitPrice}
                                                onChange={(e) => setLimitPrice(e.target.value)}
                                                className="quantity-input"
                                                placeholder="Enter Limit Price"
                                            />
                                        </div>
                                    </div>
                                    <br></br>
                                    {/* Estimated Value or Shares Amt */}
                                    {quantityType === 'shares' && (
                                        <div>
                                            <span>
                                                Estimated Value: $
                                                {orderType === 'limit'
                                                    ? quantity * limitPrice
                                                    : quantity * stock.price}
                                            </span>
                                        </div>
                                    )}
                                    {quantityType === 'dollars' && (
                                        <div>
                                            <span>
                                                Est. Shares Amt:{' '}
                                                {orderType === 'limit'
                                                    ? (quantity / limitPrice).toFixed(2)
                                                    : (quantity / stock.price).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        className="button complete-order"
                                        onClick={() => handleCompleteClick('sell')}
                                    >
                                        Complete Order
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyButton;
