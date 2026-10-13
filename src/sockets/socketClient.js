import { io } from "socket.io-client";

let socketInstance = null;

// When VITE_API_URL is configured, strip the "/api" suffix to get the server origin.
// When it is not configured we pass `undefined`, which makes socket.io connect to the
// CURRENT ORIGIN - so Vite's /socket.io proxy applies in dev and the deployed origin
// is used in production (matching the relative "/api" base used by api/client.js).
const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "") || undefined
  : undefined;

export function getSocket() {
  const token = localStorage.getItem("token");

  // Self-heal: after a logout there is no token, so drop any socket that is still
  // connected under the previous user's identity. A later authenticated getSocket()
  // builds a fresh connection.
  if (!token && socketInstance) {
    disconnectSocket();
  }

  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      autoConnect: false,
      auth: { token },
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[SocketClient] Connection error:", err.message);
    });

    // Once reconnection attempts are exhausted the socket is permanently dead and
    // getSocket() would keep handing out the same instance. Null it out so the next
    // getSocket() call builds a fresh one.
    socketInstance.on("reconnect_failed", () => {
      console.warn("[SocketClient] Reconnection failed; discarding socket instance.");
      const dead = socketInstance;
      socketInstance = null;
      dead?.disconnect();
    });
  } else if (token && socketInstance.auth?.token !== token) {
    // Keep auth token in sync if changed
    socketInstance.auth = { token };
    socketInstance.extraHeaders = { Authorization: `Bearer ${token}` };
  }

  if (!socketInstance.connected && token) {
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function joinRoomSocket(roomId) {
  const socket = getSocket();
  if (socket && roomId) {
    socket.emit("join_room", { roomId });
  }
}
