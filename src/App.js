import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/auth/AuthPage';
import NewDashboard from './pages/dashboard/NewDashboard';
import { OrderBookProvider, PortfolioProvider, SocketProvider } from './app/providers';

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
