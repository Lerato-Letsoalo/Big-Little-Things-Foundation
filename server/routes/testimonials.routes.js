const router = require('express').Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// PUBLIC — published only
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, author_name, event_label, content FROM testimonials WHERE status = 'published' ORDER BY display_order, id"
    );
    res.json({ success: true, testimonials: rows });
  } catch (err) { next(err); }
});

// ADMIN — all
router.get('/all', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM testimonials ORDER BY display_order, id');
    res.json({ success: true, testimonials: rows });
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { author_name, event_label, content, status, display_order } = req.body;
    if (!author_name || !content) return res.status(400).json({ success: false, message: 'Author and content required.' });
    const [result] = await pool.query(
      'INSERT INTO testimonials (author_name, event_label, content, status, display_order) VALUES (?, ?, ?, ?, ?)',
      [author_name, event_label || null, content, status || 'draft', display_order || 0]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { author_name, event_label, content, status, display_order } = req.body;
    await pool.query(
      'UPDATE testimonials SET author_name = ?, event_label = ?, content = ?, status = ?, display_order = ? WHERE id = ?',
      [author_name, event_label || null, content, status, display_order || 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;