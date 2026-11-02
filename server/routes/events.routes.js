const router = require('express').Router();
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { galleryUpload } = require('../middleware/upload');

/* ============================================================
   GET /api/events — public list
   Supports:
     /api/events                        → all published non-archived
     /api/events?status=upcoming        → exact match
     /api/events?status=upcoming,active → IN (…) match
   ============================================================ */
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    let sql = `SELECT e.*,
                      (SELECT COUNT(*) FROM event_registrations er
                       WHERE er.event_id = e.id AND er.status = 'registered') AS registered_count
               FROM events e
               WHERE e.published = 1`;
    const params = [];

    if (status) {
      const list = String(status)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (list.length === 1) {
        sql += ' AND e.status = ?';
        params.push(list[0]);
      } else if (list.length > 1) {
        sql += ' AND e.status IN (' + list.map(() => '?').join(',') + ')';
        params.push.apply(params, list);
      }
    } else {
      // Public default: hide archived events
      sql += " AND e.status <> 'archived'";
    }

    sql += ' ORDER BY (e.event_date IS NULL) ASC, e.event_date ASC, e.id DESC';
    const [rows] = await pool.query(sql, params);

    const events = rows.map(e => {
      const registered = parseInt(e.registered_count, 10) || 0;
      const capacity = e.capacity === null ? null : parseInt(e.capacity, 10);
      const available = capacity === null ? null : Math.max(0, capacity - registered);
      const isFull = capacity !== null && registered >= capacity;
      return {
        ...e,
        registered_count: registered,
        capacity,
        available,
        is_full: isFull,
        is_open: e.registration_open === 1 && !isFull
      };
    });

    res.json({ success: true, events });
  } catch (err) { next(err); }
});

/* ============================================================
   GET /api/events/all — admin list (all events, published or not)
   ============================================================ */
router.get('/all', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM event_registrations er
               WHERE er.event_id = e.id AND er.status = 'registered') AS registered_count
       FROM events e
       ORDER BY e.id DESC`
    );
    const events = rows.map(e => {
      const registered = parseInt(e.registered_count, 10) || 0;
      const capacity = e.capacity === null ? null : parseInt(e.capacity, 10);
      return {
        ...e,
        registered_count: registered,
        capacity,
        available: capacity === null ? null : Math.max(0, capacity - registered),
        is_full: capacity !== null && registered >= capacity
      };
    });
    res.json({ success: true, events });
  } catch (err) { next(err); }
});

/* ============================================================
   GET /api/events/:id/registrations — admin list of volunteers
   ============================================================ */
router.get('/:id/registrations', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT er.id, er.user_id, er.status, er.registered_at, er.cancelled_at,
              u.full_name, u.email, u.city
       FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       WHERE er.event_id = ? AND er.status = 'registered'
       ORDER BY er.registered_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, registrations: rows });
  } catch (err) { next(err); }
});

/* ============================================================
   GET /api/events/:id/capacity — public, for the volunteer UI
   ============================================================ */
router.get('/:id/capacity', requireAuth, async (req, res, next) => {
  try {
    const [[event]] = await pool.query(
      `SELECT e.id, e.capacity, e.registration_open,
              (SELECT COUNT(*) FROM event_registrations er
               WHERE er.event_id = e.id AND er.status = 'registered') AS registered_count
       FROM events e WHERE e.id = ?`,
      [req.params.id]
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const registered = parseInt(event.registered_count, 10) || 0;
    const capacity = event.capacity === null ? null : parseInt(event.capacity, 10);
    const isFull = capacity !== null && registered >= capacity;

    // Is the current volunteer already registered?
    const [[mine]] = await pool.query(
      `SELECT id, status FROM event_registrations
       WHERE event_id = ? AND user_id = ? AND status = 'registered'`,
      [req.params.id, req.user.id]
    );

    res.json({
      success: true,
      capacity: {
        capacity,
        registered,
        available: capacity === null ? null : Math.max(0, capacity - registered),
        is_full: isFull,
        is_open: event.registration_open === 1,
        you_are_registered: !!mine
      }
    });
  } catch (err) { next(err); }
});

/* ============================================================
   POST /api/events/:id/register — volunteer, transaction-safe
   ============================================================ */
router.post('/:id/register', requireAuth, async (req, res, next) => {
  if (req.user.role !== 'volunteer') {
    return res.status(403).json({ success: false, message: 'Volunteer access is required to register.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the event row so two concurrent registrations cannot both pass the capacity check
    const [[event]] = await conn.query(
      'SELECT id, status, published, capacity, registration_open FROM events WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!event) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    // Registrations are only accepted for published events that admins have
    // explicitly marked active. Upcoming events remain visible to volunteers.
    if (event.status !== 'active' || event.published !== 1) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Registration is available for active events only.' });
    }
    if (event.registration_open !== 1) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Registration is closed for this event.' });
    }

    // A repeated registration should remain successful even if the event has
    // since filled; it does not consume another place.
    const [[existing]] = await conn.query(
      "SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ? AND status = 'registered'",
      [req.params.id, req.user.id]
    );
    if (existing) {
      await conn.commit();
      return res.json({ success: true, message: 'You are already registered for this event.' });
    }

    // Check current count (inside the event-row lock)
    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM event_registrations WHERE event_id = ? AND status = 'registered'",
      [req.params.id]
    );
    const registered = parseInt(count, 10) || 0;
    const capacity = event.capacity === null ? null : parseInt(event.capacity, 10);

    if (capacity !== null && registered >= capacity) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'This event is full.' });
    }

    // Insert (or reactivate a previously cancelled registration)
    try {
      await conn.query(
        `INSERT INTO event_registrations (event_id, user_id, status)
         VALUES (?, ?, 'registered')
         ON DUPLICATE KEY UPDATE status = 'registered', cancelled_at = NULL, registered_at = NOW()`,
        [req.params.id, req.user.id]
      );
    } catch (insertErr) {
      await conn.rollback();
      return next(insertErr);
    }

    await conn.commit();
    res.json({ success: true, message: 'You are registered for this event.' });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    next(err);
  } finally {
    conn.release();
  }
});

/* ============================================================
   DELETE /api/events/:id/register — volunteer cancels
   ============================================================ */
router.delete('/:id/register', requireAuth, async (req, res, next) => {
  if (req.user.role !== 'volunteer') {
    return res.status(403).json({ success: false, message: 'Volunteer access is required to cancel a registration.' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE event_registrations
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE event_id = ? AND user_id = ? AND status = 'registered'`,
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'You are not registered for this event.' });
    }
    res.json({ success: true, message: 'Registration cancelled.' });
  } catch (err) { next(err); }
});

/* ============================================================
   POST /api/events — admin create
   ============================================================ */
router.post('/', requireAdmin, galleryUpload.single('image'), async (req, res, next) => {
  try {
    const { title, description, category, status, event_date, published, capacity, registration_open } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required.' });

    const imagePath = req.file ? `/uploads/gallery/${req.file.filename}` : null;
    const cap = capacity === '' || capacity === undefined || capacity === null ? null : parseInt(capacity, 10);
    if (cap !== null && (isNaN(cap) || cap < 0)) {
      return res.status(400).json({ success: false, message: 'Capacity must be a positive number or blank.' });
    }

    const [result] = await pool.query(
      `INSERT INTO events (title, description, category, status, event_date, image_path, published, capacity, registration_open)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        category || null,
        status || 'upcoming',
        event_date || null,
        imagePath,
        published === 'false' ? 0 : 1,
        cap,
        registration_open === 'false' ? 0 : 1
      ]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
});

/* ============================================================
   PUT /api/events/:id — admin update
   ============================================================ */
router.put('/:id', requireAdmin, galleryUpload.single('image'), async (req, res, next) => {
  try {
    const { title, description, category, status, event_date, published, capacity, registration_open } = req.body;
    const [rows] = await pool.query('SELECT image_path FROM events WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Event not found.' });

    let imagePath = rows[0].image_path;
    if (req.file) imagePath = `/uploads/gallery/${req.file.filename}`;

    const cap = capacity === '' || capacity === undefined || capacity === null ? null : parseInt(capacity, 10);
    if (cap !== null && (isNaN(cap) || cap < 0)) {
      return res.status(400).json({ success: false, message: 'Capacity must be a positive number or blank.' });
    }

    // If capacity is being reduced below current registrations, warn but don't delete
    if (cap !== null) {
      const [[{ count }]] = await pool.query(
        "SELECT COUNT(*) AS count FROM event_registrations WHERE event_id = ? AND status = 'registered'",
        [req.params.id]
      );
      if (parseInt(count, 10) > cap) {
        return res.status(409).json({
          success: false,
          message: `Cannot reduce capacity to ${cap} — ${count} volunteers are already registered. Cancel some registrations first, or keep the current capacity.`
        });
      }
    }

    await pool.query(
      `UPDATE events
       SET title = ?, description = ?, category = ?, status = ?, event_date = ?,
           image_path = ?, published = ?, capacity = ?, registration_open = ?
       WHERE id = ?`,
      [
        title,
        description || null,
        category || null,
        status,
        event_date || null,
        imagePath,
        published === 'false' ? 0 : 1,
        cap,
        registration_open === 'false' ? 0 : 1,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

/* ============================================================
   DELETE /api/events/:id — admin delete
   ============================================================ */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;