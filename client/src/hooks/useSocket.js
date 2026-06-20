import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

/**
 * Hook to manage Socket.io connection lifecycle.
 *
 * Returns a stable `socket` ref, connection status, and a `reconnectCount`
 * counter that increments on every reconnection (but NOT the initial connect).
 * Consumers can use `reconnectCount` as an effect dependency to trigger
 * re-join / resync logic after a network interruption.
 */
export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const isInitialConnect = useRef(true);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,   // Never give up
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,       // Cap backoff at 5s
      pingTimeout: 60000,              // Match server — tolerate slow networks
    });

    socket.on('connect', () => {
      setIsConnected(true);
      if (isInitialConnect.current) {
        isInitialConnect.current = false;
      } else {
        // This is a REconnect — bump the counter so useRoom can resync
        setReconnectCount((c) => c + 1);
      }
    });

    socket.on('disconnect', () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event, data, callback) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data, callback);
    }
  }, []);

  return { socket: socketRef.current, isConnected, reconnectCount, emit };
}
