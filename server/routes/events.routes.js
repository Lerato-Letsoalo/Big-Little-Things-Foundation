const router = require('express').Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { galleryUpload } = require('../middleware/upload');

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM events WHERE published = 1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY (event_date IS NULL) ASC, event_date ASC, id DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, events: rows });
  } catch (err) { next(err); }
});

router.get('/all', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY id DESC');
    res.json({ success: true, events: rows });
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, galleryUpload.single('image'), async (req, res, next) => {
  try {
    const { title, description, category, status, event_date, published } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required.' });
    const imagePath = req.file ? `/uploads/gallery/${req.file.filename}` : null;
    const [result] = await pool.query(
      'INSERT INTO events (title, description, category, status, event_date, image_path, published) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, category || null, status || 'upcoming', event_date || null, imagePath, published === 'false' ? 0 : 1]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, galleryUpload.single('image'), async (req, res, next) => {
  try {
    const { title, description, category, status, event_date, published } = req.body;
    const [rows] = await pool.query('SELECT image_path FROM events WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Event not found.' });
    let imagePath = rows[0].image_path;
    if (req.file) imagePath = `/uploads/gallery/${req.file.filename}`;
    await pool.query(
      'UPDATE events SET title = ?, description = ?, category = ?, status = ?, event_date = ?, image_path = ?, published = ? WHERE id = ?',
      [title, description || null, category || null, status, event_date || null, imagePath, published === 'false' ? 0 : 1, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;