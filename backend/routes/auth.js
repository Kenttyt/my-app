import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users, INTERESTS } from '../utils/storage.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, interests, sports } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedUsername = String(username || '').trim();
    const normalizedInterests = Array.isArray(interests)
      ? interests
      : (Array.isArray(sports) ? sports : []);

    if (!normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (users.has(normalizedEmail)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    const user = {
      id: userId,
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      interests: normalizedInterests,
      createdAt: new Date(),
      onlineStatus: false
    };

    users.set(normalizedEmail, user);

    const token = jwt.sign(
      { id: userId, email: normalizedEmail, username: normalizedUsername },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        username: normalizedUsername,
        email: normalizedEmail,
        interests: user.interests,
        sports: user.interests
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        interests: user.interests || user.sports || [],
        sports: user.interests || user.sports || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get available interests
router.get('/interests', (req, res) => {
  res.json({ interests: INTERESTS, sports: INTERESTS });
});

// Backward-compatible sports route
router.get('/sports', (req, res) => {
  res.json({ interests: INTERESTS, sports: INTERESTS });
});

export default router;
