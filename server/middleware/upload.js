const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function makeStorage(subdir) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads', subdir)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
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