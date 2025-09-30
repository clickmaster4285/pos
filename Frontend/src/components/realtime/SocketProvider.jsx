// SocketProvider.jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { socket as sharedSocket } from "@/lib/socket";

const SocketContext = createContext({ socket: null, isConnected: false });
export const useSocket = () => useContext(SocketContext);

function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(sharedSocket.connected);
  const token = useSelector((s) => s.auth.token);

  useEffect(() => {
    if (!token) return;
    sharedSocket.auth = { token };
    sharedSocket.io.opts.extraHeaders = {
      Authorization: `Bearer ${token}`,
    };
    if (sharedSocket.disconnected) sharedSocket.connect();
  }, [token]);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onConnectError = (err) => console.error("socket connect_error:", err?.message || err);
    const onSocketId = ({ socketId }) => {
      document.cookie = `socket_id=${encodeURIComponent(socketId)}; path=/; max-age=86400; samesite=lax`;
    };

    sharedSocket.on("connect", onConnect);
    sharedSocket.on("disconnect", onDisconnect);
    sharedSocket.on("connect_error", onConnectError);
    sharedSocket.on("socket_id", onSocketId);

    return () => {
      sharedSocket.off("connect", onConnect);
      sharedSocket.off("disconnect", onDisconnect);
      sharedSocket.off("connect_error", onConnectError);
      sharedSocket.off("socket_id", onSocketId);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: sharedSocket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;