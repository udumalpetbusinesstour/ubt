const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env from backend/ directory
dotenv.config({ path: path.join(__dirname, '.env') });

const Category = require('./models/Category');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness';

const allowedParentCategories = [
  // The 41 categories from CSV
  'Agriculture & Farming',
  'Automobile Services',
  'Baby & Kids Stores',
  'Beauty Salons & Spa',
  'Books & Stationery',
  'Builders & Contractors',
  'Building Materials',
  'Business Services',
  'Clothing & Fashion',
  'Doctors & Healthcare',
  'Electrical & Solar',
  'Electronics & Mobiles',
  'Finance & Insurance',
  'Furniture & Home Decor',
  'Grocery & Food Stores',
  'Home Services',
  'Hotels & Lodges',
  'IT & Digital Services',
  'Internet & Telecom',
  'Jewellery Shops',
  'Legal & Document Services',
  'Manufacturers & Industries',
  'NGOs & Social Services',
  'Packers & Movers',
  'Personal Services',
  'Pet & Veterinary Services',
  'Photography & Video',
  'Printing & Advertising',
  'Real Estate',
  'Religious Services',
  'Rental Services',
  'Repair Services',
  'Restaurants & Food',
  'Schools & Colleges',
  'Security Services',
  'Shops & Retail Stores',
  'Sports & Fitness',
  'Training & Coaching',
  'Travel & Transport',
  'Water & Environmental Services',
  'Wedding & Event Services',

  // Public Sector / Governmental organisations categories (as requested by user)
  'Public Sector',
  'Governmental organisations',
  'Government organisations',
  'Governmental organisation',
  'Government organisation'
];

async function main() {
  console.log('Connecting to MONGO_URI:', mongoUri.split('@')[1] || mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const beforeCount = await Category.countDocuments();
  console.log('Total categories in DB before cleanup:', beforeCount);

  // Delete all categories where parentCategory is not in the allowed list
  const allowedSet = new Set(allowedParentCategories.map(c => c.toLowerCase()));

  const allCatsInDb = await Category.find({});
  let deleteCount = 0;
  
  for (const cat of allCatsInDb) {
    const parent = (cat.parentCategory || '').trim().toLowerCase();
    if (!allowedSet.has(parent)) {
      await Category.deleteOne({ _id: cat._id });
      deleteCount++;
    }
  }

  const afterCount = await Category.countDocuments();
  console.log(`Cleanup complete! Deleted ${deleteCount} legacy categories.`);
  console.log('Total categories in DB after cleanup:', afterCount);

  await mongoose.disconnect();
}

main().catch(console.error);
