const mongoose = require('mongoose');

const atlasUri = process.env.MONGO_URI || 'mongodb+srv://udumalpetbusinesstour:<password>@udumalpetbusinesstour.tggc5t5.mongodb.net/udtbusiness?retryWrites=true&w=majority';

// High-quality category-specific stock photos from Unsplash
const stockPhotos = {
  'Shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  'Food & Restaurants': 'https://images.unsplash.com/photo-1517248135467-4c7edccd34c4?w=800&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=80',
  'Health & Medical': 'https://images.unsplash.com/photo-1584515901367-f1c276565434?w=800&q=80',
  'Beauty & Wellness': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'Education': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  'Automotive': 'https://images.unsplash.com/photo-1617854818583-09e7f077a156?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=80'
};

const defaultLogo = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80';

async function populatePlaceholders() {
  console.log('Connecting to MongoDB Atlas database...');
  const conn = await mongoose.connect(atlasUri);
  const db = conn.connection.db;
  console.log('Connected.');

  // 1. Update Businesses
  console.log('\nPopulating empty business cover/logo fields with stock images...');
  const bizColl = db.collection('businesses');
  const businesses = await bizColl.find({}).toArray();
  let bizUpdated = 0;

  for (const biz of businesses) {
    let updateDoc = {};
    let modified = false;

    // Set logo if empty
    if (!biz.logoUrl || biz.logoUrl === '') {
      updateDoc.logoUrl = defaultLogo;
      modified = true;
    }

    // Set cover photo if empty based on category group
    if (!biz.coverImageUrl || biz.coverImageUrl === '') {
      const parent = biz.category || biz.type || '';
      let photoUrl = stockPhotos.default;
      
      // Select appropriate Unsplash photo
      for (const [catName, url] of Object.entries(stockPhotos)) {
        if (parent.toLowerCase().includes(catName.toLowerCase())) {
          photoUrl = url;
          break;
        }
      }
      
      updateDoc.coverImageUrl = photoUrl;
      modified = true;
    }

    if (modified) {
      await bizColl.updateOne({ _id: biz._id }, { $set: updateDoc });
      bizUpdated++;
      console.log(`- Populated images for business: "${biz.name || biz.businessName}"`);
    }
  }
  console.log(`✓ Updated ${bizUpdated} businesses.`);

  // 2. Update Blogs
  console.log('\nPopulating empty blog cover/thumbnail fields with stock images...');
  const blogColl = db.collection('blogs');
  const blogs = await blogColl.find({}).toArray();
  let blogsUpdated = 0;

  for (const blog of blogs) {
    let updateDoc = {};
    let modified = false;

    if (!blog.coverImage || blog.coverImage === '') {
      updateDoc.coverImage = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80';
      modified = true;
    }
    if (!blog.thumbnail || blog.thumbnail === '') {
      updateDoc.thumbnail = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=150&q=80';
      modified = true;
    }

    if (modified) {
      await blogColl.updateOne({ _id: blog._id }, { $set: updateDoc });
      blogsUpdated++;
      console.log(`- Populated images for blog: "${blog.title}"`);
    }
  }
  console.log(`✓ Updated ${blogsUpdated} blogs.`);

  // 3. Update Events
  console.log('\nPopulating empty event cover/banner fields...');
  const eventColl = db.collection('events');
  const events = await eventColl.find({}).toArray();
  let eventsUpdated = 0;

  for (const event of events) {
    let updateDoc = {};
    let modified = false;

    if (!event.coverImageUrl || event.coverImageUrl === '') {
      updateDoc.coverImageUrl = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80';
      modified = true;
    }
    if (!event.bannerImage || event.bannerImage === '') {
      updateDoc.bannerImage = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80';
      modified = true;
    }

    if (modified) {
      await eventColl.updateOne({ _id: event._id }, { $set: updateDoc });
      eventsUpdated++;
      console.log(`- Populated images for event: "${event.title}"`);
    }
  }
  console.log(`✓ Updated ${eventsUpdated} events.`);

  await conn.disconnect();
  console.log('\n🎉 Finished populating database placeholders!');
  process.exit(0);
}

populatePlaceholders().catch(console.error);
