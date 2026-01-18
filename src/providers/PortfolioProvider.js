import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import userPortfolio from '../HelperClasses/UserPortfolio';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
    const [portfolio, setPortfolio] = useState(() => userPortfolio.getPortfolio());

    const handleUpdate = useCallback((next) => {
        setPortfolio(next);
    }, []);

    useEffect(() => {
        userPortfolio.subscribe(handleUpdate);
        setPortfolio(userPortfolio.getPortfolio());

        return () => {
            userPortfolio.unsubscribe(handleUpdate);
        };
    }, [handleUpdate]);

    const value = useMemo(() => ({ portfolio }), [portfolio]);

    return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
    const ctx = useContext(PortfolioContext);
    if (!ctx) {
        throw new Error('usePortfolio must be used within <PortfolioProvider>');
    }
    return ctx.portfolio;
}
