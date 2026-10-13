const router = require('express').Router();
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { streamCertificate } = require('../utils/certificate');

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.certificate_code, c.issued_at,
              vs.title AS session_title, vs.session_date, sa.hours
       FROM certificates c
       JOIN session_attendance sa ON sa.id = c.attendance_id
       JOIN volunteer_sessions vs ON vs.id = sa.session_id
       WHERE c.user_id = ? ORDER BY c.issued_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, certificates: rows });
  } catch (err) { next(err); }
});

router.get('/:id/download', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.certificate_code, c.user_id, sa.hours,
              vs.title AS session_title, vs.session_date, u.full_name
       FROM certificates c
       JOIN session_attendance sa ON sa.id = c.attendance_id
       JOIN volunteer_sessions vs ON vs.id = sa.session_id
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    const cert = rows[0];
    if (cert.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    streamCertificate(res, {
      code: cert.certificate_code,
      volunteerName: cert.full_name,
      hours: cert.hours,
      sessionTitle: cert.session_title,
      sessionDate: cert.session_date
    });
  } catch (err) { next(err); }
});

module.exports = router;