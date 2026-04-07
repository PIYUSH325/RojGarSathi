const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const DESTINATION_BY_TYPE = {
  image: path.join(UPLOAD_ROOT, 'images'),
  video: path.join(UPLOAD_ROOT, 'videos'),
  audio: path.join(UPLOAD_ROOT, 'audio'),
  pdf: path.join(UPLOAD_ROOT, 'docs'),
};

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const FILE_NAME_MAX_LENGTH = 120;

const ensureUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

Object.values(DESTINATION_BY_TYPE).forEach(ensureUploadDir);

const detectMessageTypeFromMime = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return null;
};

const sanitizeFileName = (fileName = '') => {
  const ext = path.extname(fileName).toLowerCase();
  const base = path
    .basename(fileName, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, FILE_NAME_MAX_LENGTH) || 'file';

  return `${base}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = detectMessageTypeFromMime(file.mimetype);
    if (!type) {
      return cb(new Error('Unsupported file type'));
    }

    const dest = DESTINATION_BY_TYPE[type];
    ensureUploadDir(dest);
    return cb(null, dest);
  },
  filename: (req, file, cb) => {
    const safeName = sanitizeFileName(file.originalname);
    const ext = path.extname(safeName);
    const base = path.basename(safeName, ext);
    const uniqueName = `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const type = detectMessageTypeFromMime(file.mimetype);
  if (!type) {
    return cb(new Error('Only images, videos, audio, and PDF files are allowed'));
  }

  req.uploadedMediaType = type;
  return cb(null, true);
};

const uploadChatMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = {
  uploadChatMedia,
  detectMessageTypeFromMime,
  sanitizeFileName,
  MAX_FILE_SIZE,
};
