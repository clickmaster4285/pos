"use client";
import { io } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:8000";

export const socket = io(URL, {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: false,           
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});
