"use client";

import { useEffect, useRef, useState } from "react";

export function useWebSocket(orderId: string | null, onMessage: (data: unknown) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
    const host = wsUrl || (typeof window !== "undefined" ? `${protocol}://${window.location.host}` : "");
    const socket = new WebSocket(`${host}/ws/orders/${orderId}`);
    ws.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        onMessage(event.data);
      }
    };

    return () => {
      socket.close();
    };
  }, [orderId, onMessage]);

  return { connected };
}
