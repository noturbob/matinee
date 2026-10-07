import { io, type Socket } from "socket.io-client";
import { siteConfig } from "@/config/site";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(siteConfig.apiUrl, {
      autoConnect: false,         // we connect manually after auth
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}