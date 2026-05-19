import { users, userDirectory, rooms, messages } from '../utils/storage.js';

const waitingQueue = [];
const pairedBySocket = new Map();
const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const chatNamespace = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    const clearWaitingForSocket = (socketId) => {
      const index = waitingQueue.findIndex((item) => item.socketId === socketId);
      if (index !== -1) {
        waitingQueue.splice(index, 1);
      }
    };

    const normalizeInterests = ({ interests, interest, sports, sport }) => {
      const incoming = Array.isArray(interests) && interests.length > 0
        ? interests
        : (Array.isArray(sports) && sports.length > 0 ? sports : [interest || sport || 'General']);

      const normalized = incoming
        .map((item) => String(item || '').trim())
        .filter(Boolean);

      return normalized.length > 0 ? [...new Set(normalized)] : ['General'];
    };

    const hasInterestOverlap = (a, b) => a.some((interestName) => b.includes(interestName));

    const clearPairingForSocket = (socketId) => {
      const pair = pairedBySocket.get(socketId);
      if (!pair) {
        return;
      }

      const { peerSocketId, roomId } = pair;
      pairedBySocket.delete(socketId);

      const peerSocket = io.sockets.sockets.get(peerSocketId);
      if (peerSocket) {
        pairedBySocket.delete(peerSocketId);
        peerSocket.leave(roomId);
        peerSocket.emit('stranger-disconnected');
      }

      socket.leave(roomId);
    };

    const enqueueOrMatch = ({ userId, username, interest, interests, sport, sports, bio, profileInterests, profileSports }) => {
      const normalizedInterests = normalizeInterests({ interests, interest, sports, sport });
      const incomingProfileInterests = Array.isArray(profileInterests) ? profileInterests : profileSports;
      const normalizedProfileInterests = Array.isArray(incomingProfileInterests)
        ? incomingProfileInterests.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
      const profile = {
        userId,
        username: username || 'New Friend',
        bio: String(bio || '').trim(),
        interests: normalizedProfileInterests.length > 0
          ? [...new Set(normalizedProfileInterests)]
          : normalizedInterests,
        sports: normalizedProfileInterests.length > 0
          ? [...new Set(normalizedProfileInterests)]
          : normalizedInterests
      };

      // Try to find someone with matching interests first
      let rivalIndex = waitingQueue.findIndex(
        (candidate) => candidate.socketId !== socket.id
          && hasInterestOverlap(candidate.interests, normalizedInterests)
      );

      // Fallback: connect to anyone available if no interest match
      if (rivalIndex === -1) {
        rivalIndex = waitingQueue.findIndex(
          (candidate) => candidate.socketId !== socket.id
        );
      }

      if (rivalIndex === -1) {
        waitingQueue.push({
          socketId: socket.id,
          userId,
          username,
          interests: normalizedInterests,
          profile
        });
        socket.emit('matchmaking', {
          interest: normalizedInterests.join(', '),
          sport: normalizedInterests.join(', ')
        });
        return;
      }

      const [rival] = waitingQueue.splice(rivalIndex, 1);

      const rivalSocket = io.sockets.sockets.get(rival.socketId);
      if (!rivalSocket) {
        waitingQueue.push({
          socketId: socket.id,
          userId,
          username,
          interests: normalizedInterests,
          profile
        });
        socket.emit('matchmaking', {
          interest: normalizedInterests.join(', '),
          sport: normalizedInterests.join(', ')
        });
        return;
      }

      const matchedInterest = normalizedInterests.find((item) => rival.interests.includes(item)) || '';

      const roomId = `random-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      socket.join(roomId);
      rivalSocket.join(roomId);

      pairedBySocket.set(socket.id, { peerSocketId: rival.socketId, roomId });
      pairedBySocket.set(rival.socketId, { peerSocketId: socket.id, roomId });

      socket.emit('stranger-found', {
        roomId,
        interest: matchedInterest,
        sport: matchedInterest,
        peer: rival.profile || {
          username: rival.username || 'New Friend',
          bio: '',
          interests: rival.interests || [],
          sports: rival.interests || []
        }
      });

      rivalSocket.emit('stranger-found', {
        roomId,
        interest: matchedInterest,
        sport: matchedInterest,
        peer: profile
      });
    };

    socket.on('find-stranger', ({ userId, username, interest, interests, sport, sports, bio, profileInterests, profileSports }) => {
      clearWaitingForSocket(socket.id);
      clearPairingForSocket(socket.id);
      enqueueOrMatch({
        userId,
        username,
        interest,
        interests,
        sport,
        sports,
        bio,
        profileInterests,
        profileSports
      });
    });

    socket.on('next-stranger', ({ userId, username, interest, interests, sport, sports, bio, profileInterests, profileSports }) => {
      clearPairingForSocket(socket.id);
      enqueueOrMatch({
        userId,
        username,
        interest,
        interests,
        sport,
        sports,
        bio,
        profileInterests,
        profileSports
      });
    });

    socket.on('cancel-matchmaking', () => {
      clearWaitingForSocket(socket.id);
    });

    socket.on('leave-random-chat', () => {
      clearPairingForSocket(socket.id);
    });

    // User joins a room
    socket.on('join-room', ({ roomId, userId, username }) => {
      socket.join(roomId);

      if (userId && username) {
        userDirectory.set(userId, { username });
      }

      const room = rooms.get(roomId);
      if (room && !room.members.includes(userId)) {
        room.members.push(userId);
      }

      // Find user and update online status
      for (let [email, user] of users) {
        if (user.id === userId) {
          user.onlineStatus = true;
          break;
        }
      }

      // Notify room members
      io.to(roomId).emit('user-joined', {
        userId,
        username,
        membersCount: room?.members.length || 1
      });
    });

    // Send message
    socket.on('send-message', ({ roomId, userId, username, message, interest, sport }) => {
      const messageInterest = interest || sport || 'General';
      const messageObj = {
        id: Date.now().toString(),
        roomId,
        senderSocketId: socket.id,
        userId,
        username,
        message,
        interest: messageInterest,
        sport: messageInterest,
        timestamp: new Date(),
        likes: 0,
        reactions: {},
        reactedUsers: {}
      };

      messages.push(messageObj);

      // Broadcast to room
      io.to(roomId).emit('new-message', messageObj);
    });

    // User leaves room
    socket.on('leave-room', ({ roomId, userId, username }) => {
      socket.leave(roomId);

      const room = rooms.get(roomId);
      if (room) {
        room.members = room.members.filter(id => id !== userId);
      }

      io.to(roomId).emit('user-left', {
        userId,
        username,
        membersCount: room?.members.length || 0
      });

      // Check if user is still in any room
      if (socket.rooms.size === 1) { // Only the default room remains
        for (let [email, user] of users) {
          if (user.id === userId) {
            user.onlineStatus = false;
            break;
          }
        }
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId, username }) => {
      socket.to(roomId).emit('user-typing', { username });
    });

    // Stop typing
    socket.on('stop-typing', ({ roomId }) => {
      socket.to(roomId).emit('user-stop-typing', {});
    });

    // Like message
    socket.on('like-message', ({ messageId, roomId }) => {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        message.likes = (message.likes || 0) + 1;
        io.to(roomId).emit('message-liked', { messageId, likes: message.likes });
      }
    });

    socket.on('react-message', ({ messageId, roomId, userId, reactionKey, emoji }) => {
      if (!ALLOWED_REACTIONS.includes(emoji)) {
        return;
      }

      const message = messages.find((m) => m.id === messageId && m.roomId === roomId);
      if (!message) {
        return;
      }

      const reactionOwner = reactionKey || userId || socket.id;

      if (!message.reactions || typeof message.reactions !== 'object') {
        message.reactions = {};
      }

      if (!message.reactedUsers || typeof message.reactedUsers !== 'object') {
        message.reactedUsers = {};
      }

      const previousReaction = message.reactedUsers[reactionOwner];

      if (previousReaction) {
        message.reactions[previousReaction] = Math.max((message.reactions[previousReaction] || 1) - 1, 0);
        if (message.reactions[previousReaction] === 0) {
          delete message.reactions[previousReaction];
        }
      }

      if (previousReaction === emoji) {
        delete message.reactedUsers[reactionOwner];
      } else {
        message.reactedUsers[reactionOwner] = emoji;
        message.reactions[emoji] = (message.reactions[emoji] || 0) + 1;
      }

      io.to(roomId).emit('message-reacted', {
        roomId,
        messageId,
        reactions: message.reactions,
        reactedUsers: message.reactedUsers
      });
    });

    socket.on('disconnect', () => {
      clearWaitingForSocket(socket.id);
      clearPairingForSocket(socket.id);
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
