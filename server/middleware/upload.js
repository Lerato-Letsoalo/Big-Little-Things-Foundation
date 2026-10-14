const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/* Base uploads directory (project root / uploads) */
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

/* Ensure all required subfolders exist on startup.
   On Render, empty folders aren't tracked by Git, so we create them
   the first time the app boots. */
const REQUIRED_SUBFOLDERS = ['team', 'gallery', 'donations', 'proofs'];

REQUIRED_SUBFOLDERS.forEach(sub => {
  const dir = path.join(UPLOADS_ROOT, sub);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[upload] created folder: ${dir}`);
    }
  } catch (err) {
    console.error(`[upload] could not create ${dir}:`, err.message);
  }
});

/* Multer storage engine that re-checks the folder exists
   before every file save, so it survives a redeploy that wipes it. */
function makeStorage(subdir) {
  const destination = path.join(UPLOADS_ROOT, subdir);
  return multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        if (!fs.existsSync(destination)) {
          fs.mkdirSync(destination, { recursive: true });
        }
        cb(null, destination);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      const safe = crypto.randomBytes(16).toString('hex') + ext;
      cb(null, safe);
    }
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type.'));
  }
  cb(null, true);
}

module.exports = {
  teamUpload: multer({ storage: makeStorage('team'), limits: { fileSize: MAX_SIZE }, fileFilter }),
  galleryUpload: multer({ storage: makeStorage('gallery'), limits: { fileSize: MAX_SIZE }, fileFilter }),
  donationUpload: multer({ storage: makeStorage('donations'), limits: { fileSize: MAX_SIZE }, fileFilter }),
  proofUpload: multer({ storage: makeStorage('proofs'), limits: { fileSize: MAX_SIZE }, fileFilter })
};