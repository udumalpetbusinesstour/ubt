const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Business = require('./models/Business');

// Create a direct inline definition of Lead schema to avoid requiring controllers
const LeadSchema = new mongoose.Schema({
  businessId: mongoose.Schema.Types.ObjectId,
  name: String,
  createdAt: Date
}, { collection: 'leads' });

const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB.');
    const businesses = await Business.find();
    console.log(`Syncing click counters for ${businesses.length} businesses...`);

    for (const biz of businesses) {
      const callCount = await Lead.countDocuments({ businessId: biz._id, name: 'Customer (Call)' });
      const whatsappCount = await Lead.countDocuments({ businessId: biz._id, name: 'Customer (WhatsApp)' });
      const websiteCount = await Lead.countDocuments({ businessId: biz._id, name: 'Customer (Website)' });
      const instagramCount = await Lead.countDocuments({ businessId: biz._id, name: 'Customer (Instagram)' });
      const facebookCount = await Lead.countDocuments({ businessId: biz._id, name: 'Customer (Facebook)' });
      const directionsCount = await Lead.countDocuments({ businessId: biz._id, name: 'Customer (Map Directions)' });

      const needsUpdate = 
        biz.callClicks !== callCount ||
        biz.whatsappClicks !== whatsappCount ||
        biz.websiteClicks !== websiteCount ||
        biz.instagramClicks !== instagramCount ||
        biz.facebookClicks !== facebookCount ||
        biz.directionsClicks !== directionsCount;

      if (needsUpdate) {
        console.log(`Updating "${biz.name}":`);
        console.log(`  - callClicks: ${biz.callClicks} -> ${callCount}`);
        console.log(`  - whatsappClicks: ${biz.whatsappClicks} -> ${whatsappCount}`);
        console.log(`  - websiteClicks: ${biz.websiteClicks} -> ${websiteCount}`);
        console.log(`  - instagramClicks: ${biz.instagramClicks} -> ${instagramCount}`);
        console.log(`  - facebookClicks: ${biz.facebookClicks} -> ${facebookCount}`);
        console.log(`  - directionsClicks: ${biz.directionsClicks} -> ${directionsCount}`);

        biz.callClicks = callCount;
        biz.whatsappClicks = whatsappCount;
        biz.websiteClicks = websiteCount;
        biz.instagramClicks = instagramCount;
        biz.facebookClicks = facebookCount;
        biz.directionsClicks = directionsCount;

        await biz.save();
      }
    }

    console.log('Finished updating click counters.');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error running sync script:', err);
    process.exit(1);
  });
