const express = require('express');
const router = express.Router();
const Catalog = require('../models/Catalog');
const Business = require('../models/Business');
const { protect } = require('../middleware/auth');

// @desc    Fetch catalog items for a specific business
// @route   GET /api/catalog/:businessId
// @access  Public
router.get('/:businessId', async (req, res) => {
  try {
    const catalogItems = await Catalog.find({ businessId: req.params.businessId }).sort({ categoryOrder: 1, order: 1, createdAt: -1 });
    res.json({ success: true, count: catalogItems.length, data: catalogItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a catalog item
// @route   POST /api/catalog/:businessId
// @access  Private
router.post('/:businessId', protect, async (req, res) => {
  try {
    const { name, price, offerPrice, isAvailable, description, imageUrl, galleryUrls, category, catalogType, dynamicFields } = req.body;
    const businessId = req.params.businessId;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Item name and price are required' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership or admin role
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this business catalog' });
    }

    const catalogItem = await Catalog.create({
      businessId,
      name,
      price: Number(price),
      offerPrice: offerPrice !== undefined && offerPrice !== null && offerPrice !== '' ? Number(offerPrice) : null,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      description: description || '',
      imageUrl: imageUrl || '',
      galleryUrls: Array.isArray(galleryUrls) ? galleryUrls : [],
      category: category || 'General',
      catalogType: catalogType || 'services',
      dynamicFields: dynamicFields || {}
    });

    res.status(201).json({ success: true, data: catalogItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Edit a catalog item
// @route   PUT /api/catalog/:itemId
// @access  Private
router.put('/:itemId', protect, async (req, res) => {
  try {
    const { name, price, offerPrice, isAvailable, description, imageUrl, galleryUrls, category, catalogType, dynamicFields } = req.body;
    
    const catalogItem = await Catalog.findById(req.params.itemId);
    if (!catalogItem) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' });
    }

    const business = await Business.findById(catalogItem.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership or admin role
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this business catalog' });
    }

    if (name !== undefined) catalogItem.name = name;
    if (price !== undefined) catalogItem.price = Number(price);
    if (offerPrice !== undefined) {
      catalogItem.offerPrice = offerPrice !== null && offerPrice !== '' ? Number(offerPrice) : null;
    }
    if (isAvailable !== undefined) catalogItem.isAvailable = Boolean(isAvailable);
    if (description !== undefined) catalogItem.description = description;
    if (imageUrl !== undefined) catalogItem.imageUrl = imageUrl;
    if (galleryUrls !== undefined) catalogItem.galleryUrls = Array.isArray(galleryUrls) ? galleryUrls : [];
    if (category !== undefined) catalogItem.category = category;
    if (catalogType !== undefined) catalogItem.catalogType = catalogType;
    if (dynamicFields !== undefined) catalogItem.dynamicFields = dynamicFields;

    await catalogItem.save();

    res.json({ success: true, data: catalogItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a catalog item
// @route   DELETE /api/catalog/:itemId
// @access  Private
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const catalogItem = await Catalog.findById(req.params.itemId);
    if (!catalogItem) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' });
    }

    const business = await Business.findById(catalogItem.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership or admin role
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this business catalog' });
    }

    await Catalog.deleteOne({ _id: req.params.itemId });

    res.json({ success: true, message: 'Catalog item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reorder catalog items
// @route   PUT /api/catalog/:businessId/reorder
// @access  Private
router.put('/:businessId/reorder', protect, async (req, res) => {
  try {
    const { orders } = req.body;
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: 'Invalid reorder parameters' });
    }

    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership or admin role
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this business catalog' });
    }

    const bulkOps = orders.map(item => ({
      updateOne: {
        filter: { _id: item.itemId, businessId: req.params.businessId },
        update: { $set: item.update || { order: item.order } }
      }
    }));

    await Catalog.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Catalog items reordered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Fetch catalog item by its slug
// @route   GET /api/catalog/landing/:slug
// @access  Public
router.get('/landing/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    
    // Parse slug to extract name search query
    const cleanName = slug
      .replace(/-for-sale-in-udumalpet$/i, '')
      .replace(/-for-sale-in-udmalpet$/i, '')
      .replace(/-/g, ' ');

    // Find items matching cleanName keywords
    const regexQuery = cleanName.split(/\s+/).filter(Boolean).map(term => `(?=.*${term})`).join('');
    const items = await Catalog.find({ 
      name: { $regex: new RegExp(regexQuery || cleanName, 'i') } 
    }).populate('businessId');

    const slugifyHelper = (text) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
    };

    let exactItem = items.find(item => {
      const itemSlug = slugifyHelper(item.name) + '-for-sale-in-udumalpet';
      const altSlug = slugifyHelper(item.name) + '-for-sale-in-udmalpet';
      return itemSlug === slug || altSlug === slug;
    });

    if (!exactItem && items.length > 0) {
      exactItem = items[0];
    }

    if (!exactItem) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' });
    }

    res.json({ success: true, data: exactItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
