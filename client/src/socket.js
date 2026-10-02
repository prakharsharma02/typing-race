import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

// autoConnect: false — App.jsx connects explicitly once, rather than every
// importer of this module triggering a fresh connection attempt.
export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});
