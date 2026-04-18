import express from 'express';
import { messages, rooms, users } from '../utils/storage.js';

const router = express.Router();

// Get chat rooms
router.get('/rooms', (req, res) => {
  const interest = String(req.query.interest || req.query.sport || '').trim();

  let filteredRooms = Array.from(rooms.values());
  if (interest) {
    filteredRooms = filteredRooms.filter((r) => (r.interest || r.sport) === interest);
  }

  res.json({
    rooms: filteredRooms.map(r => ({
      id: r.id,
      name: r.name,
      interest: r.interest || r.sport,
      sport: r.interest || r.sport,
      memberCount: r.members.length,
      createdAt: r.createdAt
    }))
  });
});

// Get messages for a room
router.get('/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const roomMessages = messages.filter(m => m.roomId === roomId);

  res.json({
    messages: roomMessages.slice(-50) // Last 50 messages
  });
});

// Get joined users for a room
router.get('/rooms/:roomId/members', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const uniqueMemberIds = [...new Set(room.members || [])];

  const members = uniqueMemberIds.map((memberId) => {
    const matchedUser = Array.from(users.values()).find((u) => u.id === memberId);

    return {
      id: memberId,
      username: matchedUser?.username || 'Unknown user',
      onlineStatus: Boolean(matchedUser?.onlineStatus)
    };
  });

  res.json({
    roomId,
    memberCount: members.length,
    members
  });
});

// Create a new room
router.post('/rooms', (req, res) => {
  try {
    const { name, interest, sport } = req.body;
    const roomName = String(name || '').trim();
    const roomInterest = String(interest || sport || '').trim() || roomName;

    if (!roomName) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const roomId = Date.now().toString();
    const room = {
      id: roomId,
      name: roomName,
      interest: roomInterest,
      sport: roomInterest,
      creator: req.user.id,
      members: [req.user.id],
      createdAt: new Date()
    };

    rooms.set(roomId, room);

    res.status(201).json({
      message: 'Room created',
      room: {
        id: roomId,
        name: roomName,
        interest: roomInterest,
        sport: roomInterest,
        memberCount: 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

export default router;
