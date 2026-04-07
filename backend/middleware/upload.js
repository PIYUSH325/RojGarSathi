const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

ensureUploadDir('uploads');
ensureUploadDir('uploads/documents');
ensureUploadDir('uploads/photos');
ensureUploadDir('uploads/resumes');

// Configure multer storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'resume') {
            uploadPath += 'resumes/';
        } else if (file.fieldname === 'photo') {
            uploadPath += 'photos/';
        } else {
            uploadPath += 'documents/';
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filters
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'photo') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile photo!'), false);
        }
    } else if (file.fieldname === 'resume') {
        if (file.mimetype === 'application/pdf' || file.mimetype.includes('msword') || file.mimetype.includes('officedocument')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, or DOCX files are allowed for resume!'), false);
        }
    } else {
        // Allow all file types for chat documents: images, videos, audio, documents, archives
        const allowedMimeTypes = [
            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/svg+xml',
            // Videos
            'video/mp4',
            'video/mpeg',
            'video/webm',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska',
            // Audio
            'audio/mpeg',
            'audio/wav',
            'audio/webm',
            'audio/ogg',
            'audio/flac',
            'audio/aac',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
            // Archives
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/gzip',
            'application/x-tar',
        ];
        
        // Allow files if mimetype matches or if extension is supported
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        const supportedExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'csv', 'txt'];
        
        if (allowedMimeTypes.includes(file.mimetype) || supportedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(null, true); // Allow with warning - let frontend handle validation too
        }
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for videos and large files
    }
});

// Export single file upload middleware
const uploadSingle = (fieldName) => {
    return upload.single(fieldName);
};

// Export multiple file upload if needed
const uploadMultiple = upload.array('documents', 5);

module.exports = { uploadSingle, uploadMultiple };
