const router = require('express').Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email and message required.' });
    await pool.query(
      'INSERT INTO contact_enquiries (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || null, message]
    );
    res.status(201).json({ success: true, message: 'Thank you. Your enquiry has been received.' });
  } catch (err) { next(err); }
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_enquiries ORDER BY created_at DESC');
    res.json({ success: true, enquiries: rows });
  } catch (err) { next(err); }
});

router.put('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending','in_progress','resolved'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    await pool.query('UPDATE contact_enquiries SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;