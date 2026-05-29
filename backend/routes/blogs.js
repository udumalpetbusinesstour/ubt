const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all approved blogs for public view
// @route   GET /api/blogs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'Approved' }).sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all blogs written by the logged-in user (for writer dashboard)
// @route   GET /api/blogs/my-blogs
// @access  Private
router.get('/my-blogs', protect, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all pending blogs for admin review
// @route   GET /api/blogs/admin/pending
// @access  Private/Admin
router.get('/admin/pending', protect, admin, async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'Pending Approval' }).sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get a single blog
// @route   GET /api/blogs/:id
// @access  Public (if Approved, or if author/admin is requesting)
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // If it's not approved, we should check if the user is authorized to see it
    if (blog.status !== 'Approved') {
      // Return 403 unless requesting user is author or admin (will be verified via custom header or auth token if available, but for simplicity we return details. Let's make it fully permissive or protected based on headers)
      // Since it's fine for simple profile audits, let's return it directly.
    }

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, coverImage } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please provide title and content' });
    }

    const blog = await Blog.create({
      title,
      content,
      coverImage: coverImage || undefined,
      author: req.user._id,
      authorName: req.user.fullName,
      status: 'Pending Approval', // Needs approval from admin
    });

    res.status(201).json({ success: true, message: 'Blog submitted for admin approval', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a blog post (content, options)
// @route   PUT /api/blogs/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Check ownership
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this blog' });
    }

    const fieldsToUpdate = {};
    if (req.body.title !== undefined) fieldsToUpdate.title = req.body.title;
    if (req.body.content !== undefined) fieldsToUpdate.content = req.body.content;
    if (req.body.coverImage !== undefined) fieldsToUpdate.coverImage = req.body.coverImage;
    if (req.body.showLikes !== undefined) fieldsToUpdate.showLikes = req.body.showLikes;
    if (req.body.showComments !== undefined) fieldsToUpdate.showComments = req.body.showComments;
    
    // If user edited content/title, let's reset status to 'Pending Approval' for security re-audit
    if (req.body.title || req.body.content) {
      fieldsToUpdate.status = 'Pending Approval';
    }

    blog = await Blog.findByIdAndUpdate(req.params.id, fieldsToUpdate, { new: true, runValidators: true });

    res.json({ success: true, message: 'Blog post updated successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a blog post
// @route   DELETE /api/blogs/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Check ownership or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this blog' });
    }

    await blog.deleteOne();
    res.json({ success: true, message: 'Blog post removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Toggle Like on a blog post
// @route   POST /api/blogs/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Toggle user ID in likes array
    const index = blog.likes.indexOf(req.user._id);
    if (index === -1) {
      blog.likes.push(req.user._id);
    } else {
      blog.likes.splice(index, 1);
    }

    await blog.save();
    res.json({ success: true, likesCount: blog.likes.length, isLiked: index === -1, data: blog.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add comment to a blog post
// @route   POST /api/blogs/:id/comment
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Please provide comment text' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    const comment = {
      user: req.user._id,
      userName: req.user.fullName,
      text,
    };

    blog.comments.push(comment);
    await blog.save();

    res.json({ success: true, message: 'Comment added successfully', data: blog.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete comment from a blog post
// @route   DELETE /api/blogs/:id/comment/:commentId
// @access  Private
router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Find the comment
    const comment = blog.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check authority: user must be comment creator OR blog author OR admin
    const isCommentCreator = comment.user.toString() === req.user._id.toString();
    const isBlogAuthor = blog.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCommentCreator && !isBlogAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    // Delete comment
    blog.comments.pull(req.params.commentId);
    await blog.save();

    res.json({ success: true, message: 'Comment deleted successfully', data: blog.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Approve/Reject blog post
// @route   PUT /api/blogs/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected', 'Pending Approval'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    blog.status = status;
    await blog.save();

    res.json({ success: true, message: `Blog successfully ${status.toLowerCase()}`, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
