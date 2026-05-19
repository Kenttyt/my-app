import express from 'express';
import { messages, rooms, users, userDirectory } from '../utils/storage.js';

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
    const directoryEntry = userDirectory.get(memberId);

    return {
      id: memberId,
      username: matchedUser?.username || directoryEntry?.username || 'Unknown user',
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

// Delete a room
router.delete('/rooms/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Only the creator can delete the room
    if (room.creator !== req.user.id) {
      return res.status(403).json({ error: 'Only the room creator can delete this room' });
    }

    rooms.delete(roomId);

    // Clean up messages for this room
    const roomMessageIndexes = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].roomId === roomId) {
        roomMessageIndexes.push(i);
      }
    }
    for (const index of roomMessageIndexes) {
      messages.splice(index, 1);
    }

    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
