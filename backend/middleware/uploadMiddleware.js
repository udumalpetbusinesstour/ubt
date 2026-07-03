const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure S3 client if credentials are present
let s3Client = null;
let s3Storage = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'YOUR_AWS_ACCESS_KEY_ID') {
  s3Client = new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION || 'ap-south-1',
  });

  s3Storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'uploads/' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// Configure Cloudinary Credentials (Ready for production env injection)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'udumalpet-business-tour',
  api_key: process.env.CLOUDINARY_API_KEY || 'cloudinary_key_123456789',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'cloudinary_secret_987654321',
});

// 1. Cloudinary Premium Storage Engine
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ubt_gallery',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif', 'svg', 'heic', 'heif', 'bmp', 'tiff'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});

// 2. Local fallback storage engine (for sandboxed environments)
const localDiskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Select storage dynamically: Prioritize AWS S3, then Cloudinary, then local disk
const selectStorageEngine = () => {
  if (s3Storage) {
    console.log('[Multer Engine] AWS S3 Storage Active');
    return s3Storage;
  } else if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'cloudinary_key_123456789') {
    console.log('[Multer Engine] Cloudinary Storage Active');
    return cloudinaryStorage;
  } else {
    console.log('[Multer Engine] Local Disk Storage Fallback Active');
    return localDiskStorage;
  }
};

// Filter file types
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  
  // Also check extension name as fallback
  const filetypes = /jpeg|jpg|png|webp|gif|svg|heic|heif|bmp|tiff/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    return cb(null, true);
  }

  cb(new Error('Only image files (jpeg, jpg, png, webp, svg, gif, heic, bmp) are permitted!'));
};

const upload = multer({
  storage: selectStorageEngine(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB per upload
  fileFilter: fileFilter
});

module.exports = upload;
