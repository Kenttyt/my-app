💬 StrangerTalk - Real-Time Stranger Chat Platform

A modern web-based real-time chat application designed for people to connect, communicate, and meet strangers from around the world instantly.

Features

Core Functionality
• Real-Time Chat: Socket.IO-powered real-time messaging with WebSocket support
• Random Chat Rooms: Join public rooms and meet new people instantly
• User Authentication: Secure registration and login with JWT tokens
• Interest Matching: Users can select interests to connect with like-minded people
• Dynamic Room Creation: Create custom chat rooms for specific topics
• Online Status: See who's online and available for conversation
• Typing Indicators: Real-time typing notifications
• Message Likes: Users can like messages to interact with others

Quick Start

Installation

Install Frontend Dependencies
npm install

Install Backend Dependencies
cd backend
npm install
cd ..

Configure Environment
cp backend/.env.example backend/.env

Running the Application

Terminal 1 - Start Backend Server
cd backend
npm run dev

Backend runs on http://localhost:3001

Terminal 2 - Start Frontend Development Server
npm run dev

Frontend runs on http://localhost:5173

Project Structure

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

Main Features
• Public chat rooms
• Stranger matching system
• Anonymous chatting
• User profiles
• Interest-based conversations
• Live online users
• Real-time notifications
• Responsive modern UI

Technologies
• Frontend: React 19, Vite, Socket.IO Client, Axios
• Backend: Node.js, Express, Socket.IO, JWT, bcryptjs
• Styling: CSS3 with modern gradients and animations

Key Components
• AuthPage.jsx — User registration and login
• RoomList.jsx — Browse and create chat rooms
• ChatRoom.jsx — Real-time chat interface
• UserProfile.jsx — Manage user preferences
• OnlineUsers.jsx — Display active users

API Endpoints
• POST /api/auth/register — Register new user
• POST /api/auth/login — Login user
• GET /api/chat/rooms — Get chat rooms
• POST /api/chat/rooms — Create new room
• GET /api/chat/rooms/:roomId/messages — Get messages

WebSocket Events
• join-room — Join a chat room
• send-message — Send a message
• user-typing — Real-time typing indicator
• like-message — Like a message
• online-users — Fetch online users

Production Notes

This is a demo with in-memory storage. For production:

• Replace with MongoDB for data persistence
• Add rate limiting and security headers
• Use HTTPS and WSS
• Implement comprehensive error handling
• Add logging and monitoring
• Add moderation and reporting system
Future Improvements

• Add private one-on-one messaging
• Implement voice and video calling
• Add AI-powered user matching
• Introduce dark mode and theme customization
• Add emoji reactions and GIF support
• Implement message encryption for better privacy
• Add friend request and follow system
• Support image and file sharing
• Add admin dashboard and moderation tools
• Create mobile app version for Android and iOS

Deployment Recommendations

• Deploy frontend using Vercel or Netlify
• Deploy backend using Render, Railway, or VPS
• Store environment variables securely
• Use MongoDB Atlas for cloud database hosting
• Enable Cloudflare protection and CDN
• Optimize Socket.IO performance for scalability

Built with ❤️ for connecting people worldwide 🌎
