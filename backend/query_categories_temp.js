const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Business = require('./models/Business');
const Category = require('./models/Category');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness';

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const totalBusinesses = await Business.countDocuments();
  console.log('Total businesses in DB:', totalBusinesses);

  const distinctTypes = await Business.distinct('type');
  console.log('Distinct business subcategories (type) in DB:', distinctTypes.length);

  const distinctCategories = await Business.distinct('category');
  console.log('Distinct business parent categories (category) in DB:', distinctCategories.length);

  console.log('\nSample businesses category mapping:');
  const sample = await Business.find({}, 'name category type').limit(20);
  console.log(sample);

  // Group by category and type
  const groupings = await Business.aggregate([
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  console.log('\nGrouping of businesses by Category/Type:');
  console.log(groupings);

  await mongoose.disconnect();
}

main().catch(console.error);
