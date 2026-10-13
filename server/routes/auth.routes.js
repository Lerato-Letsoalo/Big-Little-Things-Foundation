const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

/* ============================================================
   POST /api/auth/register
   Register a new volunteer account
   ============================================================ */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, full_name, phone, city } = req.body;

    // --- Validation ---
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and full name are required.'
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.'
      });
    }
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // --- Check for duplicate email ---
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    // --- Hash password ---
    const hash = await bcrypt.hash(password, 12);

    // --- Insert new volunteer (single quotes for SQL string literal) ---
    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash, full_name, phone, city, role) VALUES (?, ?, ?, ?, ?, 'volunteer')",
      [email, hash, full_name, phone || null, city || null]
    );

    // --- Success ---
    res.status(201).json({
      success: true,
      message: 'Registration successful. You can now log in.',
      userId: result.insertId
    });
  } catch (err) {
    next(err);
  }
});

/* ============================================================
   POST /api/auth/login
   Authenticate user and set JWT cookie
   ============================================================ */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // --- Find user ---
    const [rows] = await pool.query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const user = rows[0];

    // --- Verify password ---
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // --- Issue JWT ---
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // --- Set secure cookie ---
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // --- Success ---
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ============================================================
   POST /api/auth/logout
   Clear auth cookie
   ============================================================ */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out.' });
});

/* ============================================================
   GET /api/auth/me
   Return current authenticated user
   ============================================================ */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, full_name, phone, city, role, skills, about_me, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;