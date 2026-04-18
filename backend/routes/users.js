import express from 'express';
import { users } from '../utils/storage.js';

const router = express.Router();

// Get user profile
router.get('/profile', (req, res) => {
  const user = users.get(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const interests = user.interests || user.sports || [];

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    interests,
    sports: interests,
    onlineStatus: user.onlineStatus
  });
});

const updateInterests = (req, res) => {
  try {
    const { interests, sports } = req.body;
    const user = users.get(req.user.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.interests = Array.isArray(interests)
      ? interests
      : (Array.isArray(sports) ? sports : []);

    res.json({
      message: 'Interests updated',
      interests: user.interests,
      sports: user.interests
    });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
};

router.put('/interests', updateInterests);
router.put('/sports', updateInterests);

// Search users by interest
router.get('/search', (req, res) => {
  try {
    const interest = String(req.query.interest || req.query.sport || '').trim();
    if (!interest) {
      return res.status(400).json({ error: 'Interest parameter required' });
    }

    const matchingUsers = Array.from(users.values())
      .filter((u) => {
        const userInterests = u.interests || u.sports || [];
        return userInterests.includes(interest) && u.email !== req.user.email;
      })
      .map(u => ({
        id: u.id,
        username: u.username,
        interests: u.interests || u.sports || [],
        sports: u.interests || u.sports || [],
        onlineStatus: u.onlineStatus
      }));

    res.json({ users: matchingUsers });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get all online users
router.get('/online', (req, res) => {
  const onlineUsers = Array.from(users.values())
    .filter(u => u.onlineStatus && u.email !== req.user.email)
    .map(u => ({
      id: u.id,
      username: u.username,
      interests: u.interests || u.sports || [],
      sports: u.interests || u.sports || []
    }));

  res.json({ users: onlineUsers });
});

export default router;
