const router = require('express').Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

/* GET /api/dashboard/stats — summary counts */
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [[volunteers]] = await pool.query(
      "SELECT COUNT(*) AS c FROM users WHERE role = 'volunteer'"
    );

    const [[activeProjects]] = await pool.query(
      "SELECT COUNT(*) AS c FROM events WHERE status IN ('active','upcoming') AND published = 1"
    );

    const [[pendingHours]] = await pool.query(
      "SELECT COUNT(*) AS c FROM session_attendance WHERE status = 'pending'"
    );

    const [[newRegs]] = await pool.query(
      "SELECT COUNT(*) AS c FROM users WHERE role = 'volunteer' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    res.json({
      success: true,
      stats: {
        volunteers: volunteers.c,
        activeProjects: activeProjects.c,
        pendingHours: pendingHours.c,
        newRegistrations: newRegs.c
      }
    });
  } catch (err) { next(err); }
});

/* GET /api/dashboard/recent-donations — last 5 */
router.get('/recent-donations', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, donor_name, donation_type, amount, quantity_description, status, created_at
       FROM donations
       ORDER BY created_at DESC
       LIMIT 5`
    );
    res.json({ success: true, donations: rows });
  } catch (err) { next(err); }
});

/* GET /api/dashboard/recent-volunteers — last 5 */
router.get('/recent-volunteers', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, city, created_at
       FROM users
       WHERE role = 'volunteer'
       ORDER BY created_at DESC
       LIMIT 5`
    );
    res.json({ success: true, volunteers: rows });
  } catch (err) { next(err); }
});

module.exports = router;