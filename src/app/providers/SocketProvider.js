import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import socketManager from '../../lib/SocketManager';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [isConnected, setIsConnected] = useState(() => Boolean(socketManager?.connected));

    const connect = useCallback(async () => {
        await socketManager.connect();
        setIsConnected(Boolean(socketManager?.connected));
    }, []);

    const disconnect = useCallback(() => {
        socketManager.disconnect();
        setIsConnected(false);
    }, []);

    const value = useMemo(
        () => ({
            connect,
            disconnect,
            isConnected,
            isReady: () => socketManager.isReady(),
            sendMessage: (destination, body) => socketManager.sendMessage(destination, body),
        }),
        [connect, disconnect, isConnected],
    );

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) {
        throw new Error('useSocket must be used within <SocketProvider>');
    }
    return ctx;
}
