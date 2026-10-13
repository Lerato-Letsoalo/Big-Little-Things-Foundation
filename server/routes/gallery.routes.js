const router = require('express').Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { galleryUpload } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

/* ============================================================
   GET /api/gallery
   Public — list all gallery images with a derived year.
   ============================================================ */
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, caption, alt_text, image_path, category, display_order, created_at
       FROM gallery_images
       ORDER BY id DESC`
    );

    const images = rows.map(img => {
      const yearInTitle = (img.title || '').match(/\b(20\d{2})\b/);
      const year = yearInTitle
        ? parseInt(yearInTitle[1], 10)
        : new Date(img.created_at).getFullYear();
      // URL-safe path — encodes spaces, dashes, quotes
      const safe_path = encodeURI(img.image_path);
      return { ...img, year, safe_path };
    });

    res.json({ success: true, images });
  } catch (err) { next(err); }
});

/* ============================================================
   POST /api/gallery — Admin uploads a single image
   ============================================================ */
router.post('/', requireAdmin, galleryUpload.single('image'), async (req, res, next) => {
  try {
    const { title, caption, alt_text, category, display_order } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required.' });
    }
    const imagePath = `/uploads/gallery/${req.file.filename}`;
    const [result] = await pool.query(
      'INSERT INTO gallery_images (title, caption, alt_text, image_path, category, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [
        title || null,
        caption || null,
        alt_text || title || null,
        imagePath,
        category || null,
        parseInt(display_order) || 0
      ]
    );
    res.status(201).json({ success: true, id: result.insertId, image_path: imagePath });
  } catch (err) { next(err); }
});

/* ============================================================
   PUT /api/gallery/:id — update metadata
   ============================================================ */
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { title, caption, alt_text, category, display_order } = req.body;
    const [result] = await pool.query(
      'UPDATE gallery_images SET title = ?, caption = ?, alt_text = ?, category = ?, display_order = ? WHERE id = ?',
      [
        title || null,
        caption || null,
        alt_text || title || null,
        category || null,
        parseInt(display_order) || 0,
        req.params.id
      ]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

/* ============================================================
   DELETE /api/gallery/:id — remove image + file
   ============================================================ */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT image_path FROM gallery_images WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    const imagePath = rows[0].image_path;
    if (imagePath) {
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      fs.unlink(fullPath, () => {});
    }

    await pool.query('DELETE FROM gallery_images WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;