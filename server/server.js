require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet({
  contentSecurityPolicy: false, // allow inline scripts used by frontend
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting on auth routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Public uploads (team, gallery, donations images)
app.use('/uploads/team', express.static(path.join(__dirname, '..', 'uploads', 'team')));
app.use('/uploads/gallery', express.static(path.join(__dirname, '..', 'uploads', 'gallery')));
app.use('/uploads/donations', express.static(path.join(__dirname, '..', 'uploads', 'donations')));
// NOTE: /uploads/proofs is intentionally NOT served statically.

// API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/team', require('./routes/team.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/donations', require('./routes/donations.routes'));
app.use('/api/testimonials', require('./routes/testimonials.routes'));
app.use('/api/gallery', require('./routes/gallery.routes'));
app.use('/api/volunteers', require('./routes/volunteers.routes'));
app.use('/api/certificates', require('./routes/certificates.routes'));
app.use('/api/contact', require('./routes/contact.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

// Central error handler
app.use(require('./middleware/errorHandler'));

app.listen(PORT, () => console.log(`BLTF running at http://localhost:${PORT}`));