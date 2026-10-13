const router = require('express').Router();
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { donationUpload } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

/* ============================================================
   Multer field configuration
   Accepts:
   - proof      (proof of payment — private)
   - item_image (photo of donated items — public)
   ============================================================ */
const uploads = donationUpload.fields([
  { name: 'proof', maxCount: 1 },
  { name: 'item_image', maxCount: 1 }
]);

/* ============================================================
   POST /api/donations
   Public submission OR admin manual entry
   Admin entry is triggered by ?admin=true
   ============================================================ */
router.post('/', uploads, async (req, res, next) => {
  try {
    const isAdminEntry = req.query.admin === 'true';

    /* ---------- ADMIN AUTH CHECK ---------- */
    if (isAdminEntry) {
      const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
      }
      if (decoded.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Administrator access required.' });
      }
    }

    /* ---------- EXTRACT FIELDS ---------- */
    const {
      donor_name,
      donor_email,
      donor_phone,
      city,
      donation_type,
      amount,
      quantity_description,
      message,
      anonymous,
      status
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!donation_type || !['money', 'food', 'clothing', 'sanitary'].includes(donation_type)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid donation type.'
      });
    }

    if (donation_type === 'money') {
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid amount.'
        });
      }
    } else {
      if (!quantity_description || !quantity_description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please describe the items donated.'
        });
      }
    }

    // Public submissions must provide donor details
    if (!isAdminEntry) {
      if (!donor_name || !donor_name.trim()) {
        return res.status(400).json({ success: false, message: 'Your name is required.' });
      }
      if (!donor_email || !donor_email.includes('@')) {
        return res.status(400).json({ success: false, message: 'A valid email is required.' });
      }
    }

    /* ---------- FILE PATHS ---------- */
    const proofPath = req.files?.proof
      ? `/uploads/proofs/${req.files.proof[0].filename}`
      : null;
    const itemImagePath = req.files?.item_image
      ? `/uploads/donations/${req.files.item_image[0].filename}`
      : null;

    /* ---------- STATUS ---------- */
    // Admin can set any status; public submissions default to pending
    const validStatuses = [
      'pending_verification',
      'verified',
      'rejected',
      'received',
      'collection_arranged',
      'completed'
    ];
    let finalStatus = 'pending_verification';
    if (isAdminEntry && status && validStatuses.includes(status)) {
      finalStatus = status;
    }

    /* ---------- ANONYMITY ---------- */
    const isAnonymous = anonymous === 'true' || anonymous === true;
    const finalDonorName = isAnonymous || !donor_name
      ? 'Anonymous'
      : donor_name.trim();

    /* ---------- INSERT ---------- */
    const [result] = await pool.query(
      `INSERT INTO donations
        (donor_name, donor_email, donor_phone, city, donation_type,
         amount, quantity_description, message, anonymous,
         proof_path, item_image_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalDonorName,
        donor_email ? donor_email.trim() : null,
        donor_phone ? donor_phone.trim() : null,
        city ? city.trim() : null,
        donation_type,
        donation_type === 'money' ? parseFloat(amount) : null,
        donation_type !== 'money' ? quantity_description.trim() : null,
        message ? message.trim() : null,
        isAnonymous ? 1 : 0,
        proofPath,
        itemImagePath,
        finalStatus
      ]
    );

    /* ---------- RESPONSE ---------- */
    res.status(201).json({
      success: true,
      message: isAdminEntry
        ? 'Donation recorded successfully.'
        : (donation_type === 'money'
            ? 'Thank you. Your donation has been recorded and is pending verification.'
            : 'Thank you. Your item donation has been recorded. We will be in touch.'),
      id: result.insertId
    });
  } catch (err) {
    next(err);
  }
});

/* ============================================================
   GET /api/donations
   Admin — list all donations
   ============================================================ */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, donor_name, donor_email, donor_phone, city,
              donation_type, amount, quantity_description, message,
              anonymous, proof_path, item_image_path, status,
              admin_notes, created_at, updated_at
       FROM donations
       ORDER BY created_at DESC`
    );
    res.json({ success: true, donations: rows });
  } catch (err) {
    next(err);
  }
});

/* ============================================================
   GET /api/donations/stats
   Admin — quick totals for the dashboard
   ============================================================ */
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [[total]] = await pool.query('SELECT COUNT(*) AS c FROM donations');
    const [[money]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE donation_type = 'money' AND status IN ('verified','completed')"
    );
    const [[pending]] = await pool.query(
      "SELECT COUNT(*) AS c FROM donations WHERE status = 'pending_verification'"
    );
    res.json({
      success: true,
      stats: {
        total: total.c,
        verifiedMoney: parseFloat(money.total),
        pending: pending.c
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ============================================================
   PUT /api/donations/:id/status
   Admin — update donation status (and optional notes)
   ============================================================ */
router.put('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status, admin_notes } = req.body;
    const valid = [
      'pending_verification',
      'verified',
      'rejected',
      'received',
      'collection_arranged',
      'completed'
    ];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    await pool.query(
      'UPDATE donations SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ============================================================
   GET /api/donations/:id/proof
   Admin — download the proof of payment (protected)
   ============================================================ */
router.get('/:id/proof', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT proof_path FROM donations WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length || !rows[0].proof_path) {
      return res.status(404).json({ success: false, message: 'Proof not found.' });
    }
    const filePath = path.join(__dirname, '..', '..', rows[0].proof_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File no longer exists.' });
    }
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

/* ============================================================
   DELETE /api/donations/:id
   Admin — remove a donation record (and any associated files)
   ============================================================ */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT proof_path, item_image_path FROM donations WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Best-effort cleanup of uploaded files
    [rows[0].proof_path, rows[0].item_image_path].forEach(p => {
      if (!p) return;
      const fullPath = path.join(__dirname, '..', '..', p);
      fs.unlink(fullPath, () => {});
    });

    await pool.query('DELETE FROM donations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;