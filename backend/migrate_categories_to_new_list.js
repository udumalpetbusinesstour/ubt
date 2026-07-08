const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const Business = require('./models/Business');
const Category = require('./models/Category');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness';

const categoryMap = {
  'website designing': { parentCategory: 'IT & Digital Services', categoryName: 'Web Design' },
  'grocery stores': { parentCategory: 'Grocery & Food Stores', categoryName: 'Grocery Shops' },
  'bakeries': { parentCategory: 'Restaurants & Food', categoryName: 'Bakeries' },
  'temples': { parentCategory: 'Religious Services', categoryName: 'Temples' },
  'restaurants': { parentCategory: 'Restaurants & Food', categoryName: 'Restaurants' },
  'schools': { parentCategory: 'Schools & Colleges', categoryName: 'Schools' },
  'salons & barbers': { parentCategory: 'Beauty Salons & Spa', categoryName: 'Beauty Parlours' },
  'electricians': { parentCategory: 'Home Services', categoryName: 'Electrician' },
  'poultry farms': { parentCategory: 'Agriculture & Farming', categoryName: 'Poultry Farms' },
  'hearing center': { parentCategory: 'Doctors & Healthcare', categoryName: 'Hearing Aid Center' },
  'driving schools': { parentCategory: 'Automobile Services', categoryName: 'Driving Schools' },
  'bus operators': { parentCategory: 'Travel & Transport', categoryName: 'Bus Ticket Booking' },
  'gift shops': { parentCategory: 'Books & Stationery', categoryName: 'Gifts Shops' }
};

async function migrate() {
  console.log('Connecting to database:', mongoUri);
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Run categories seeding routine from CSV
    console.log('Step 1: Running Category Seeding Routine from CSV...');
    const { seedDefaultCategories } = require('./models/Category');
    await seedDefaultCategories();

    // 2. Ensure mapped categories that are not in CSV are inserted in Category collection
    console.log('Step 2: Ensuring special mapped categories exist in Category collection...');
    for (const key in categoryMap) {
      const mapping = categoryMap[key];
      let cat = await Category.findOne({ categoryName: mapping.categoryName });
      if (!cat) {
        const slug = mapping.categoryName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        cat = await Category.create({
          categoryName: mapping.categoryName,
          parentCategory: mapping.parentCategory,
          icon: 'Store',
          description: `${mapping.categoryName} category`,
          slug,
          views: 0
        });
        console.log(`Created missing category: "${mapping.categoryName}" under "${mapping.parentCategory}"`);
      }
    }

    // 3. Migrate businesses
    console.log('Step 3: Migrating businesses...');
    const businesses = await Business.find({});
    console.log(`Found ${businesses.length} businesses to check.`);

    let migratedCount = 0;
    for (const business of businesses) {
      const oldSubCategory = (business.category || '').toLowerCase().trim();
      const mapping = categoryMap[oldSubCategory];

      if (mapping) {
        const targetCatDoc = await Category.findOne({ categoryName: mapping.categoryName });
        if (targetCatDoc) {
          business.categories = [{
            categoryId: targetCatDoc._id,
            category: targetCatDoc.parentCategory,
            type: targetCatDoc.categoryName,
            categoryStatus: 'Normal'
          }];
          
          await business.save({ validateBeforeSave: false });
          console.log(`Migrated business "${business.name}" from category "${business.category}" to new schema (Main: "${targetCatDoc.parentCategory}", Sub: "${targetCatDoc.categoryName}")`);
          migratedCount++;
        } else {
          console.warn(`Could not find target Category document for "${mapping.categoryName}"`);
        }
      } else {
        // Business has no mapping, see if its category is empty
        if (!business.category) {
          console.log(`Business "${business.name}" has no category set.`);
        } else {
          // If the category matches a Category document directly (case insensitively), map it!
          const exactCat = await Category.findOne({ categoryName: { $regex: new RegExp(`^${business.category.trim()}$`, 'i') } });
          if (exactCat) {
            business.categories = [{
              categoryId: exactCat._id,
              category: exactCat.parentCategory,
              type: exactCat.categoryName,
              categoryStatus: 'Normal'
            }];
            await business.save({ validateBeforeSave: false });
            console.log(`Direct matched business "${business.name}" to category "${exactCat.categoryName}"`);
            migratedCount++;
          } else {
            console.warn(`No mapping or direct category found for business "${business.name}" (category: "${business.category}")`);
          }
        }
      }
    }

    console.log(`✓ Migration completed. Migrated/updated ${migratedCount} out of ${businesses.length} businesses.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();
