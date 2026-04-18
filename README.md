# 🏟️ SportTalk - Real-Time Sports Chat Platform

A modern web-based real-time chat application designed specifically for sports enthusiasts to connect, communicate, and interact based on shared sports interests.

## Features

### Core Functionality
- **Real-Time Chat**: Socket.IO-powered real-time messaging with WebSocket support
- **Sports Categories**: Browse and chat in rooms organized by 14 different sports
- **User Authentication**: Secure registration and login with JWT tokens
- **Sports Interests**: Users can select multiple sports interests to find like-minded enthusiasts
- **Dynamic Room Creation**: Create new chat rooms for specific sports topics
- **Online Status**: See who's online and available for conversation
- **Typing Indicators**: Real-time typing notifications
- **Message Likes**: Users can like messages to show appreciation

## Quick Start

### Installation

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   ```

### Running the Application

**Terminal 1 - Start Backend Server**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3001`

**Terminal 2 - Start Frontend Development Server**
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

## Project Structure

```
my-app/
├── src/
│   ├── components/          # React components
│   ├── contexts/            # Auth context
│   ├── services/            # API service
│   ├── styles/              # Component styles
│   └── App.jsx
├── backend/
│   ├── middleware/          # Auth middleware
│   ├── routes/              # API routes
│   ├── websocket/           # Socket.IO handlers
│   ├── utils/               # Storage & utilities
│   └── server.js
└── package.json
```

## Available Sports

Basketball, Football, Soccer, Baseball, Tennis, Golf, Hockey, Cricket, Volleyball, Swimming, Cycling, MMA, Boxing, Esports

## Technologies

- **Frontend**: React 19, Vite, Socket.IO Client, Axios
- **Backend**: Node.js, Express, Socket.IO, JWT, bcryptjs
- **Styling**: CSS3 with modern gradients and animations

## Key Components

- **AuthPage.jsx** - User registration and login
- **RoomList.jsx** - Browse and create chat rooms
- **ChatRoom.jsx** - Real-time chat interface
- **UserProfile.jsx** - Manage user preferences

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/chat/rooms` - Get chat rooms
- `POST /api/chat/rooms` - Create new room
- `GET /api/chat/rooms/:roomId/messages` - Get messages

## WebSocket Events

- `join-room` - Join a chat room
- `send-message` - Send a message
- `user-typing` - Real-time typing indicator
- `like-message` - Like a message

## Production Notes

This is a demo with in-memory storage. For production:
- Replace with MongoDB for data persistence
- Add rate limiting and security headers
- Use HTTPS and WSS
- Implement comprehensive error handling
- Add logging and monitoring

## Built with ❤️ for sports enthusiasts everywhere! 🏆
