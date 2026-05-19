import { io } from 'socket.io-client';

// Single shared socket instance for the entire app
const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export default socket;
