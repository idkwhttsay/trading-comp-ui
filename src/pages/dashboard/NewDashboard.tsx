import React, { useEffect, useRef, useState } from 'react';
import './Dashboard.css';
import {
    LimitOrdersWidget,
    OrderType,
    SelectedStockWidget,
} from '../../components/widgets/PlaceOrders';
import MarketOrdersWidget from '../../components/widgets/MarketOrderWidget';
import TradeTable from '../../components/widgets/NewTradeTable';
import OrderBookWidget from '../../components/widgets/OrderBookWidgetss';
import ChartWidget from '../../components/widgets/ChartWidget';
import AuctionWidget from '../../components/widgets/AuctionWidget';
import EquitiesDashboard from '../../components/widgets/EquityDashboard';
import { getBuildupData, getTickers, HTTPStatusCodes } from '../../lib/api';
import MessageViewer from '../../components/widgets/MessageViewer';
import PnLWidget from '../../components/widgets/PnLWidget';
import RealizedPnLWidget from '../../components/widgets/realisedPnLWidget';
import Profile from '../../components/widgets/Profile';
import { useNavigate } from 'react-router-dom';

const NewDashboard = () => {
    const [selectedStock, setSelectedStock] = useState(getTickers()[0] || 'AAPL');
    const [orderType, setOrderType] = useState('market'); // State to track selected order type

    const didCheckAuthRef = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (didCheckAuthRef.current) return;
        didCheckAuthRef.current = true;

        const data = getBuildupData();
        if (data === null || data.status !== HTTPStatusCodes.OK) {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="dashboard">
            {/* COLUMN 1 */}
            <div className="column-1">
                {/* PNL WIDGET */}
                <div className="widget pnl-Widget-wrapper">
                    <PnLWidget />
                </div>

                {/* REALISED PNL WIDGET */}
                <div className="widget pnl-Widget-wrapper">
                    <RealizedPnLWidget />
                </div>

                {/* LIST OF EQUITIES */}
                <div className="widget equities">
                    <EquitiesDashboard
                        selectedStock={selectedStock}
                        setSelectedStock={setSelectedStock}
                    />
                </div>

                <div className="Profile-Features">
                    <div className="widget auctionWidget">
                        <AuctionWidget />
                    </div>

                    <div className="widget profileWidget">
                        <Profile />
                    </div>
                </div>
                {/* AUCTION WIDGET */}

                <div className="widget messageViewer">
                    <MessageViewer />
                </div>
            </div>

            {/* COLUMN 2 */}
            <div className="column-2">
                {/* CURRENT POSITION WIDGET */}
                <div className="widget position-info">
                    <div className="widget-container">
                        <div className="widget-item selected-stock">
                            <SelectedStockWidget selectedStock={selectedStock} />
                        </div>
                        <div className="widget-item order-type">
                            <OrderType orderType={orderType} setOrderType={setOrderType} />
                        </div>
                        <div className="widget-item place-orders">
                            {orderType === 'limit' ? (
                                <LimitOrdersWidget selectedStock={selectedStock} />
                            ) : (
                                <MarketOrdersWidget selectedStock={selectedStock} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart Widget */}
                <div className="widget chart">
                    <ChartWidget selectedStock={selectedStock} />
                </div>

                {/* TRADE TABLE */}
                <div className="widget trade-table">
                    <TradeTable />
                </div>
            </div>

            {/* COLUMN 3 */}
            <div className="column-3">
                <div className="widget order-book">
                    <OrderBookWidget selectedStock={selectedStock} />
                </div>
            </div>
        </div>
    );
};

export default NewDashboard;
