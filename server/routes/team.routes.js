const router = require('express').Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { teamUpload } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// PUBLIC — list team members
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, role, bio, image_path, image_alt FROM team_members ORDER BY display_order, id');
    res.json({ success: true, team: rows });
  } catch (err) { next(err); }
});

// ADMIN — create
router.post('/', requireAdmin, teamUpload.single('image'), async (req, res, next) => {
  try {
    const { name, role, bio, image_alt, display_order } = req.body;
    if (!name || !role || !bio) return res.status(400).json({ success: false, message: 'Name, role and bio required.' });
    const imagePath = req.file ? `/uploads/team/${req.file.filename}` : null;
    const [result] = await pool.query(
      'INSERT INTO team_members (name, role, bio, image_path, image_alt, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name, role, bio, imagePath, image_alt || name, display_order || 0]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
});

// ADMIN — update
router.put('/:id', requireAdmin, teamUpload.single('image'), async (req, res, next) => {
  try {
    const { name, role, bio, image_alt, display_order, remove_image } = req.body;
    const [rows] = await pool.query('SELECT image_path FROM team_members WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Team member not found.' });

    let imagePath = rows[0].image_path;
    if (req.file) {
      if (imagePath) fs.unlink(path.join(__dirname, '..', '..', imagePath), () => {});
      imagePath = `/uploads/team/${req.file.filename}`;
    } else if (remove_image === 'true') {
      if (imagePath) fs.unlink(path.join(__dirname, '..', '..', imagePath), () => {});
      imagePath = null;
    }

    await pool.query(
      'UPDATE team_members SET name = ?, role = ?, bio = ?, image_path = ?, image_alt = ?, display_order = ? WHERE id = ?',
      [name, role, bio, imagePath, image_alt || name, display_order || 0, req.params.id]
    );
    res.json({ success: true, image_path: imagePath });
  } catch (err) { next(err); }
});

// ADMIN — delete
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT image_path FROM team_members WHERE id = ?', [req.params.id]);
    if (rows.length && rows[0].image_path) fs.unlink(path.join(__dirname, '..', '..', rows[0].image_path), () => {});
    await pool.query('DELETE FROM team_members WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;