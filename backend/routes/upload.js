const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/auth');

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    let fileUrl = '';
    // If Cloudinary is active, req.file.path will be a remote HTTP(S) URL.
    // If local disk storage fallback is active, req.file.path is a local filesystem path.
    if (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))) {
      fileUrl = req.file.path;
    } else if (req.file.filename) {
      // Disk storage fallback: Construct the relative web URL to avoid mixed-content or localhost mismatches
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (!fileUrl) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve uploaded file URL' });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: fileUrl,
      fileUrl: fileUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
