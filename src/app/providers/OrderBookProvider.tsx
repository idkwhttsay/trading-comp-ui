import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import orderBookInstance, {
    type OrderBooksByTicker,
    type TickerOrderBook,
} from '../../lib/OrderBook';

type OrderBookContextValue = {
    orderBooks: OrderBooksByTicker;
};

const OrderBookContext = createContext<OrderBookContextValue | undefined>(undefined);

export function OrderBookProvider({ children }: { children: React.ReactNode }) {
    const [orderBooks, setOrderBooks] = useState<OrderBooksByTicker>(
        () => orderBookInstance.orderBooks || {},
    );

    const handleUpdate = useCallback((nextBooks: OrderBooksByTicker) => {
        // OrderBook mutates its internal `orderBooks` in place.
        // Ensure a new reference so React consumers always re-render.
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

export function useOrderBook(ticker: string) {
    const ctx = useContext(OrderBookContext);
    if (!ctx) {
        throw new Error('useOrderBook must be used within <OrderBookProvider>');
    }

    const book: TickerOrderBook | undefined = ticker ? ctx.orderBooks?.[ticker] : undefined;
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
