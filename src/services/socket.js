import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Single shared socket instance for the entire app
const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export const ensureSocketConnected = () => new Promise((resolve) => {
  if (socket.connected) {
    resolve();
    return;
  }

  const handleConnect = () => {
    socket.off('connect', handleConnect);
    resolve();
  };

  socket.on('connect', handleConnect);
  socket.connect();
});

export default socket;
