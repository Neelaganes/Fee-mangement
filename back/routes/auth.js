const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');
const router = express.Router();

// ═══════════════════════════════════════════
// In-memory fallback users (when DB is unavailable)
// ═══════════════════════════════════════════
const fallbackUsers = [
  { id: 1, username: 'admin', password: '$2a$10$dummyhash', full_name: 'Administrator', role: 'admin' },
  { id: 2, username: 'teacher', password: '$2a$10$dummyhash', full_name: 'Mr. Teacher', role: 'teacher' },
];

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  let connection;
  try {
    connection = await getConnection();

    if (connection) {
      // ──── Oracle DB Login ────
      const result = await connection.execute(
        `SELECT id, username, password, full_name, role FROM users WHERE username = :1`,
        [username],
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.PASSWORD);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.ID, username: user.USERNAME, role: user.ROLE },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        role: user.ROLE,
        name: user.FULL_NAME
      });
    } else {
      // ──── Fallback: Simple credential check ────
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
          { id: 1, username: 'admin', role: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({ token, role: 'admin', name: 'Administrator' });
      } else if (username === 'teacher' && password === 'teacher123') {
        const token = jwt.sign(
          { id: 2, username: 'teacher', role: 'teacher' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({ token, role: 'teacher', name: 'Mr. Teacher' });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
