const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
  parentCategory: {
    type: String,
    trim: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  },
  icon: {
    type: String, // lucide icon name or image link
    default: 'Store',
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  },
  description: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true
});

CategorySchema.pre('save', async function() {
  if (this.isModified('categoryName') || !this.slug) {
    let generatedSlug = this.categoryName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!generatedSlug) {
      generatedSlug = 'cat-' + Math.random().toString(36).substring(2, 8);
    }
    this.slug = generatedSlug;
  }
});

const Category = mongoose.model('Category', CategorySchema);

const seedDefaultCategories = async () => {
  try {
    console.log('Syncing and seeding local category classification...');
    
    // Auto-repair any legacy categories with null or missing slugs to avoid unique index crashes
    const legacyCategories = await Category.find({ $or: [{ slug: null }, { slug: { $exists: false } }] });
    for (const cat of legacyCategories) {
      if (cat.categoryName) {
        cat.slug = cat.categoryName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_]+/g, '-')
          .replace(/^-+|-+$/g, '');
        await cat.save();
      }
    }

    const fs = require('fs');
    const path = require('path');
    const csvPath = path.join(__dirname, '../constants/categories.csv');

    const toTitleCase = (str) => {
      if (!str) return '';
      return str.trim()
        .replace(/\b\w/g, char => char.toUpperCase())
        .replace(/\bGps\b/gi, 'GPS')
        .replace(/\bAc\b/gi, 'AC')
        .replace(/\bDc\b/gi, 'DC')
        .replace(/\bEv\b/gi, 'EV')
        .replace(/\bNgo\b/gi, 'NGO')
        .replace(/\bNgos\b/gi, 'NGOs')
        .replace(/\bLlp\b/gi, 'LLP');
    };

    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    let list = [];

    const iconMap = {
      'Agriculture & Farming': 'Leaf',
      'Automobile Services': 'Car',
      'Baby & Kids Stores': 'ShoppingBag',
      'Beauty Salons & Spa': 'Sparkles',
      'Books & Stationery': 'BookOpen',
      'Builders & Contractors': 'Building',
      'Building Materials': 'Building',
      'Business Services': 'Briefcase',
      'Clothing & Fashion': 'ShoppingBag',
      'Doctors & Healthcare': 'Activity',
      'Electrical & Solar': 'Zap',
      'Electronics & Mobiles': 'Smartphone',
      'Finance & Insurance': 'Coins',
      'Furniture & Home Decor': 'Home',
      'Grocery & Food Stores': 'ShoppingBag',
      'Home Services': 'Wrench',
      'Hotels & Lodges': 'Hotel',
      'Internet & Telecom': 'Globe',
      'IT & Digital Services': 'Laptop',
      'Jewellery Shops': 'Gem',
      'Legal & Document Services': 'Scale',
      'Manufacturers & Industries': 'Factory',
      'NGOs & Social Services': 'Heart',
      'Packers & Movers': 'Truck',
      'Personal Services': 'Smile',
      'Pet & Veterinary Services': 'PawPrint',
      'Photography & Video': 'Camera',
      'Printing & Advertising': 'Printer',
      'Real Estate': 'Building',
      'Religious Services': 'Sun',
      'Rental Services': 'Key',
      'Repair Services': 'Wrench',
      'Restaurants & Food': 'Utensils',
      'Schools & Colleges': 'GraduationCap',
      'Security Services': 'Shield',
      'Shops & Retail Stores': 'Store',
      'Sports & Fitness': 'Dumbbell',
      'Training & Coaching': 'GraduationCap',
      'Travel & Transport': 'Plane',
      'Water & Environmental Services': 'Droplet',
      'Wedding & Event Services': 'Camera'
    };

    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.split(/\r?\n/);
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const parts = parseCSVLine(line);
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const parent = toTitleCase(parts[0]);
          const sub = toTitleCase(parts[1]);
          const icon = iconMap[parent] || 'Store';
          list.push({
            categoryName: sub,
            parentCategory: parent,
            icon: icon,
            description: `${sub} under ${parent} classification`
          });
        }
      }
      console.log(`Loaded ${list.length} categories from categories.csv`);
    }

    if (list.length === 0) {
      console.warn('categories.csv was empty or missing. Falling back to default list.');
      list = [
        { categoryName: 'Grocery Stores', parentCategory: 'Shopping', icon: 'ShoppingBag', description: 'Local grocery and department stores' },
        { categoryName: 'Supermarkets', parentCategory: 'Shopping', icon: 'ShoppingBag', description: 'Supermarkets and larger grocery stores' },
        { categoryName: 'Restaurants', parentCategory: 'Food & Restaurants', icon: 'Utensils', description: 'Dine-in hotels, vegetarian, and non-veg restaurants' },
        { categoryName: 'Schools', parentCategory: 'Education', icon: 'GraduationCap', description: 'Matriculation, CBSE, and government schools' }
      ];
    }

    const operations = list.map(item => {
      const slug = item.categoryName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return {
        updateOne: {
          filter: { categoryName: item.categoryName },
          update: {
            $set: {
              parentCategory: item.parentCategory,
              icon: item.icon,
              description: item.description,
              slug
            },
            $setOnInsert: { views: 0 }
          },
          upsert: true
        }
      };
    });

    if (operations.length > 0) {
      const result = await Category.bulkWrite(operations);
      console.log(`✓ Synchronized ${operations.length} categories successfully. Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
    }
  } catch (error) {
    console.error('Error seeding categories list:', error.message);
  }
};

module.exports = Category;
module.exports.seedDefaultCategories = seedDefaultCategories;
