const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Ensure upload directories exist
const subdirs = ['articles', 'projects', 'avatars'];
subdirs.forEach(dir => {
  const fullPath = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = 'articles';
    if (req.baseUrl.includes('projects')) subdir = 'projects';
    if (req.baseUrl.includes('auth') && file.fieldname === 'avatar') subdir = 'avatars';
    cb(null, path.join(UPLOAD_DIR, subdir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  },
});

// File filter — only images
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
});

// Convenience methods
const uploadSingle = (fieldname) => upload.single(fieldname);
const uploadNone = upload.none();

module.exports = { upload, uploadSingle, uploadNone };