import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext({
  ws: null,
  connected: false,
  sendMessage: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
});

export const WebSocketProvider = ({ children, role = 'customer' }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const subscribersRef = useRef(new Map());

  // Subscribe function
  const subscribe = useCallback((event, callback) => {
    if (!subscribersRef.current.has(event)) {
      subscribersRef.current.set(event, new Set());
    }
    subscribersRef.current.get(event).add(callback);
    
    return () => unsubscribe(event, callback);
  }, []);

  // Unsubscribe function
  const unsubscribe = useCallback((event, callback) => {
    if (subscribersRef.current.has(event)) {
      subscribersRef.current.get(event).delete(callback);
    }
  }, []);

  // Send message function
  const sendMessage = useCallback((event, data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket not connected. Cannot send event:', event);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setConnected(false);
      }
      return;
    }

    let reconnectInterval;
    
    const connect = async () => {
      try {
        const token = await user.getIdToken();
        // Fallback to local server during dev
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[WS] Connected');
          setConnected(true);
          // Authenticate immediately
          ws.send(JSON.stringify({
            event: 'auth',
            data: { token, role }
          }));
        };

        ws.onmessage = (messageEvent) => {
          try {
            const parsed = JSON.parse(messageEvent.data);
            // The server sends back { event: string, ...rest }
            const { event, ...rest } = parsed;
            
            // Ensure auth ack is logged
            if (event === 'auth:ack') {
              console.log('[WS] Auth Ack:', rest);
            }
            
            // For events like 'chat:message', the data is usually at the top level or within a 'data' key
            const payload = rest.data !== undefined ? rest.data : rest;

            if (event && subscribersRef.current.has(event)) {
              subscribersRef.current.get(event).forEach(cb => cb(payload));
            }
          } catch (err) {
            console.error('[WS] Error parsing message', err);
          }
        };

        ws.onclose = () => {
          console.log('[WS] Disconnected');
          setConnected(false);
          wsRef.current = null;
          // Attempt to reconnect after 3s
          reconnectInterval = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.error('[WS] Error', err);
          ws.close();
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('[WS] Connect error', err);
        reconnectInterval = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, role]);

  // Ping/Pong keep-alive
  useEffect(() => {
    if (!connected) return;
    
    const pingInterval = setInterval(() => {
      sendMessage('ping', {});
    }, 30000);
    
    return () => clearInterval(pingInterval);
  }, [connected, sendMessage]);

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, connected, sendMessage, subscribe, unsubscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
