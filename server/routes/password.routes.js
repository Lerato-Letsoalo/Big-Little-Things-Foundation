const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sendPasswordResetEmail } = require('../utils/email');
const rateLimit = require('express-rate-limit');

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

/* ============================================================
   POST /api/password/forgot
   ============================================================ */
router.post('/forgot', resetLimiter, async (req, res, next) => {
  try {
    const email = (req.body.email || '').toString().trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const [users] = await pool.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
    
    if (!users.length) {
      return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    }

    const user = users[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password.html?token=${rawToken}`;
    await sendPasswordResetEmail(email, user.full_name, resetLink);

    res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) { next(err); }
});

/* ============================================================
   POST /api/password/reset
   ============================================================ */
router.post('/reset', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query(
      'SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired.' });
    }

    const tokenRow = rows[0];
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, tokenRow.user_id]);
    await pool.query('DELETE FROM password_reset_tokens WHERE id = ?', [tokenRow.id]);

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) { next(err); }
});

module.exports = router;