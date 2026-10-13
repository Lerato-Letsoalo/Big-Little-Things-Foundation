const router = require('express').Router();
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { generateCertificateCode } = require('../utils/certificate');

console.log('[volunteers.routes.js] loaded');

/* ============================================================
   VOLUNTEER — Dashboard summary
   MUST be before any /:id routes
   ============================================================ */
router.get('/me/summary', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [[totalLogged]] = await pool.query(
      "SELECT COUNT(*) AS c FROM session_attendance WHERE user_id = ?",
      [userId]
    );
    const [[attended]] = await pool.query(
      "SELECT COUNT(*) AS c FROM session_attendance WHERE user_id = ? AND status = 'approved'",
      [userId]
    );
    const [[certs]] = await pool.query(
      "SELECT COUNT(*) AS c FROM certificates WHERE user_id = ?",
      [userId]
    );
    const [[approvedTotal]] = await pool.query(
      "SELECT COALESCE(SUM(hours), 0) AS total FROM session_attendance WHERE user_id = ? AND status = 'approved'",
      [userId]
    );

    const [recentHours] = await pool.query(
      `SELECT sa.id, sa.hours, sa.status, sa.created_at,
              vs.title AS session_title, vs.session_date
       FROM session_attendance sa
       JOIN volunteer_sessions vs ON vs.id = sa.session_id
       WHERE sa.user_id = ?
       ORDER BY sa.created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      summary: {
        totalLogged: totalLogged.c,
        attended: attended.c,
        certificates: certs.c,
        approvedHours: parseFloat(approvedTotal.total),
        recentHours
      }
    });
  } catch (err) { next(err); }
});

/* ============================================================
   VOLUNTEER — All my events
   ============================================================ */
router.get('/me/events', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT sa.id, sa.hours, sa.status, sa.created_at,
              vs.title AS session_title, vs.session_date
       FROM session_attendance sa
       JOIN volunteer_sessions vs ON vs.id = sa.session_id
       WHERE sa.user_id = ?
       ORDER BY sa.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, events: rows });
  } catch (err) { next(err); }
});

/* ============================================================
   VOLUNTEER — Log a new event
   ============================================================ */
router.post('/me/log', requireAuth, async (req, res, next) => {
  try {
    const { event_name, event_date, hours_worked, location, notes } = req.body;

    if (!event_name || !event_date || hours_worked == null) {
      return res.status(400).json({ success: false, message: 'Event name, date and hours are required.' });
    }
    if (parseFloat(hours_worked) <= 0) {
      return res.status(400).json({ success: false, message: 'Hours must be greater than zero.' });
    }

    const description = [location, notes].filter(Boolean).join(' — ');

    const [sessionResult] = await pool.query(
      'INSERT INTO volunteer_sessions (title, session_date, description) VALUES (?, ?, ?)',
      [event_name, event_date, description || null]
    );

    await pool.query(
      "INSERT INTO session_attendance (session_id, user_id, hours, status) VALUES (?, ?, ?, 'pending')",
      [sessionResult.insertId, req.user.id, parseFloat(hours_worked)]
    );

    res.status(201).json({
      success: true,
      message: 'Event submitted for approval. You will be notified once reviewed.'
    });
  } catch (err) { next(err); }
});

/* ============================================================
   VOLUNTEER — Update profile
   ============================================================ */
router.put('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const { full_name, phone, city, skills, about_me } = req.body;
    if (!full_name) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    await pool.query(
      'UPDATE users SET full_name = ?, phone = ?, city = ?, skills = ?, about_me = ? WHERE id = ?',
      [full_name, phone || null, city || null, skills || null, about_me || null, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated.' });
  } catch (err) { next(err); }
});

/* ============================================================
   ADMIN — list volunteers
   ============================================================ */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.city, u.phone, u.created_at,
              COALESCE(SUM(CASE WHEN sa.status = 'approved' THEN sa.hours END), 0) AS approved_hours
       FROM users u
       LEFT JOIN session_attendance sa ON sa.user_id = u.id
       WHERE u.role = 'volunteer'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, volunteers: rows });
  } catch (err) { next(err); }
});

/* ============================================================
   ADMIN — hours list
   ============================================================ */
router.get('/hours', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT sa.id, sa.session_id, sa.user_id, sa.hours, sa.status, sa.created_at,
              u.full_name AS volunteer_name, u.email AS volunteer_email,
              vs.title AS session_title, vs.session_date
       FROM session_attendance sa
       JOIN users u ON u.id = sa.user_id
       JOIN volunteer_sessions vs ON vs.id = sa.session_id
       ORDER BY sa.created_at DESC`
    );
    res.json({ success: true, hours: rows });
  } catch (err) { next(err); }
});

/* ============================================================
   ADMIN — sessions CRUD
   ============================================================ */
router.post('/sessions', requireAdmin, async (req, res, next) => {
  try {
    const { event_id, title, session_date, description } = req.body;
    if (!title || !session_date) {
      return res.status(400).json({ success: false, message: 'Title and date required.' });
    }
    const [result] = await pool.query(
      'INSERT INTO volunteer_sessions (event_id, title, session_date, description) VALUES (?, ?, ?, ?)',
      [event_id || null, title, session_date, description || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
});

router.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM volunteer_sessions ORDER BY session_date DESC');
    res.json({ success: true, sessions: rows });
  } catch (err) { next(err); }
});

router.post('/sessions/:id/register', requireAuth, async (req, res, next) => {
  try {
    const { hours } = req.body;
    await pool.query(
      "INSERT INTO session_attendance (session_id, user_id, hours, status) VALUES (?, ?, ?, 'pending') ON DUPLICATE KEY UPDATE hours = VALUES(hours)",
      [req.params.id, req.user.id, hours || 0]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

/* ============================================================
   ADMIN — attendance
   ============================================================ */
router.post('/attendance', requireAdmin, async (req, res, next) => {
  try {
    const { session_id, user_id, hours } = req.body;
    if (!session_id || !user_id || hours == null) {
      return res.status(400).json({ success: false, message: 'session_id, user_id and hours required.' });
    }
    const [result] = await pool.query(
      "INSERT INTO session_attendance (session_id, user_id, hours, status) VALUES (?, ?, ?, 'pending') ON DUPLICATE KEY UPDATE hours = VALUES(hours), status = 'pending'",
      [session_id, user_id, hours]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
});

router.get('/attendance', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `SELECT sa.*, u.full_name, u.email, vs.title AS session_title, vs.session_date
               FROM session_attendance sa
               JOIN users u ON u.id = sa.user_id
               JOIN volunteer_sessions vs ON vs.id = sa.session_id`;
    const params = [];
    if (status) { sql += ' WHERE sa.status = ?'; params.push(status); }
    sql += ' ORDER BY sa.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, attendance: rows });
  } catch (err) { next(err); }
});

router.put('/attendance/:id', requireAdmin, async (req, res, next) => {
  try {
    const { status, admin_notes, hours } = req.body;
    if (!['pending','approved','rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    await pool.query(
      "UPDATE session_attendance SET status = ?, admin_notes = ?, hours = COALESCE(?, hours), approved_at = IF(? = 'approved', NOW(), NULL) WHERE id = ?",
      [status, admin_notes || null, hours ?? null, status, req.params.id]
    );

    if (status === 'approved') {
      const [rows] = await pool.query('SELECT user_id FROM session_attendance WHERE id = ?', [req.params.id]);
      if (rows.length) {
        const code = generateCertificateCode();
        await pool.query(
          'INSERT IGNORE INTO certificates (user_id, attendance_id, certificate_code) VALUES (?, ?, ?)',
          [rows[0].user_id, req.params.id, code]
        );
      }
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

/* ============================================================
   ADMIN — remove volunteer
   This MUST be the LAST route (it uses /:id)
   ============================================================ */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ? AND role = 'volunteer'", [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;