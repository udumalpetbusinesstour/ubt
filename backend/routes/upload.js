const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/auth');

// Helper: Calls multer middleware and catches ALL errors (including S3 / Cloudinary / file filter)
// as JSON instead of letting them bubble up to Express's default HTML error handler.
const runUpload = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      // e.g. "File too large", "Unexpected field"
      return res.status(400).json({ success: false, message: err.message });
    }
    // Custom fileFilter rejections, S3/Cloudinary API errors, etc.
    return res.status(500).json({ success: false, message: err.message || 'File upload failed' });
  });
};

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, runUpload(upload.single('image')), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    let fileUrl = '';
    if (req.file.location) {
      fileUrl = req.file.location; // S3 storage returns URL in 'location'
    } else if (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))) {
      fileUrl = req.file.path; // Cloudinary storage fallback
    } else if (req.file.filename) {
      fileUrl = `/uploads/${req.file.filename}`; // Local disk fallback
    }

    if (!fileUrl) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve uploaded file URL' });
    }

    return res.status(200).json({ success: true, message: 'Image uploaded successfully', url: fileUrl, fileUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Upload an image publicly (no auth required)
// @route   POST /api/upload/public
// @access  Public
router.post('/public', runUpload(upload.single('image')), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    let fileUrl = '';
    if (req.file.location) {
      fileUrl = req.file.location; // S3 storage returns URL in 'location'
    } else if (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))) {
      fileUrl = req.file.path; // Cloudinary storage fallback
    } else if (req.file.filename) {
      fileUrl = `/uploads/${req.file.filename}`; // Local disk fallback
    }

    if (!fileUrl) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve uploaded file URL' });
    }

    return res.status(200).json({ success: true, message: 'Image uploaded successfully', url: fileUrl, fileUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
