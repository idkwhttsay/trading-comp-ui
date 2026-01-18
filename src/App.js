import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './Dashboard/AuthPage'; // Import new authentication page

import NewDashboard from './Dashboard/NewDashboard'; // Adjust the path if necessary
import { OrderBookProvider, PortfolioProvider, SocketProvider } from './providers';

function App() {
    return (
        <SocketProvider>
            <OrderBookProvider>
                <PortfolioProvider>
                    <Router>
                        <Routes>
                            <Route path="/" element={<AuthPage />} />
                            <Route path="/dashboard" element={<NewDashboard />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </Router>
                </PortfolioProvider>
            </OrderBookProvider>
        </SocketProvider>
    );
}

export default App;
