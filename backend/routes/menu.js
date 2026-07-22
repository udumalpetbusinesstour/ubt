const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const Business = require('../models/Business');
const { protect } = require('../middleware/auth');

// @desc    Fetch menu items for a specific business
// @route   GET /api/menu/:businessId
// @access  Public
router.get('/:businessId', async (req, res) => {
  try {
    const menuItems = await Menu.find({ businessId: req.params.businessId }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: menuItems.length, data: menuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a menu item
// @route   POST /api/menu/:businessId
// @access  Private
router.post('/:businessId', protect, async (req, res) => {
  try {
    const { name, price, offerPrice, isVeg, isAvailable, description, imageUrl, category, itemType, brand } = req.body;
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
      return res.status(403).json({ success: false, message: 'Not authorized to manage this business menu' });
    }

    const menuItem = await Menu.create({
      businessId,
      name,
      price: Number(price),
      offerPrice: offerPrice !== undefined && offerPrice !== null && offerPrice !== '' ? Number(offerPrice) : null,
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      description: description || '',
      imageUrl: imageUrl || '',
      category: category || 'General',
      itemType: itemType || 'menu',
      brand: brand || ''
    });

    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Edit a menu item
// @route   PUT /api/menu/:itemId
// @access  Private
router.put('/:itemId', protect, async (req, res) => {
  try {
    const { name, price, offerPrice, isVeg, isAvailable, description, imageUrl, category, itemType, brand } = req.body;
    
    const menuItem = await Menu.findById(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const business = await Business.findById(menuItem.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership or admin role
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this business menu' });
    }

    if (name !== undefined) menuItem.name = name;
    if (price !== undefined) menuItem.price = Number(price);
    if (offerPrice !== undefined) {
      menuItem.offerPrice = offerPrice !== null && offerPrice !== '' ? Number(offerPrice) : null;
    }
    if (isVeg !== undefined) menuItem.isVeg = Boolean(isVeg);
    if (isAvailable !== undefined) menuItem.isAvailable = Boolean(isAvailable);
    if (description !== undefined) menuItem.description = description;
    if (imageUrl !== undefined) menuItem.imageUrl = imageUrl;
    if (category !== undefined) menuItem.category = category;
    if (itemType !== undefined) menuItem.itemType = itemType;
    if (brand !== undefined) menuItem.brand = brand;

    await menuItem.save();

    res.json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a menu item
// @route   DELETE /api/menu/:itemId
// @access  Private
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const business = await Business.findById(menuItem.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership or admin role
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this business menu' });
    }

    await Menu.deleteOne({ _id: req.params.itemId });

    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reorder menu items
// @route   PUT /api/menu/:businessId/reorder
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
      return res.status(403).json({ success: false, message: 'Not authorized to manage this business menu' });
    }

    const bulkOps = orders.map(item => ({
      updateOne: {
        filter: { _id: item.itemId, businessId: req.params.businessId },
        update: { $set: { order: item.order } }
      }
    }));

    await Menu.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Menu items reordered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
