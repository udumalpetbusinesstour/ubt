const mongoose = require('mongoose');

const CatalogSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  offerPrice: {
    type: Number,
    min: 0,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  galleryUrls: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  catalogType: {
    type: String,
    required: true,
    default: 'services' // services, packages, properties, rooms, courses, memberships, vehicles, equipment, inventory, pricelist, custom
  },
  dynamicFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  order: {
    type: Number,
    default: 0
  },
  categoryOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexing for performance and ordering
CatalogSchema.index({ businessId: 1, categoryOrder: 1, order: 1 });

module.exports = mongoose.model('Catalog', CatalogSchema);
