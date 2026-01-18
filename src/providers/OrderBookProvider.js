import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import orderBookInstance from '../HelperClasses/OrderBook';

const OrderBookContext = createContext(null);

export function OrderBookProvider({ children }) {
    const [orderBooks, setOrderBooks] = useState(() => orderBookInstance.orderBooks || {});

    const handleUpdate = useCallback((nextBooks) => {
        // OrderBook notifies with its internal `this.orderBooks` object, which is mutated in place.
        // React state updates are referential; ensure a new reference so consumers re-render.
        setOrderBooks(nextBooks ? { ...nextBooks } : {});
    }, []);

    useEffect(() => {
        orderBookInstance.subscribe(handleUpdate);
        setOrderBooks(orderBookInstance.orderBooks || {});

        return () => {
            orderBookInstance.unsubscribe(handleUpdate);
        };
    }, [handleUpdate]);

    const value = useMemo(() => ({ orderBooks }), [orderBooks]);

    return <OrderBookContext.Provider value={value}>{children}</OrderBookContext.Provider>;
}

export function useOrderBook(ticker) {
    const ctx = useContext(OrderBookContext);
    if (!ctx) {
        throw new Error('useOrderBook must be used within <OrderBookProvider>');
    }

    const book = ticker ? ctx.orderBooks?.[ticker] : undefined;
    const bidVolumes = book?.bidVolumes || {};
    const askVolumes = book?.askVolumes || {};

    return {
        bidVolumes,
        askVolumes,
        hasOrderBook:
            Boolean(book) &&
            (Object.keys(bidVolumes).length > 0 || Object.keys(askVolumes).length > 0),
    };
}
