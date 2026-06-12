const mongoose = require('mongoose');

const atlasUri = 'mongodb+srv://udumalpetbusinesstour:xsjTZAsfHMc1wr6Z@udumalpetbusinesstour.tggc5t5.mongodb.net/udtbusiness?retryWrites=true&w=majority&appName=udumalpetbusinesstour';

async function forceClean() {
  console.log('Connecting to MongoDB Atlas...');
  const conn = await mongoose.connect(atlasUri);
  const db = conn.connection.db;
  console.log('Connected.');

  // 1. Clean Businesses
  console.log('\nCleaning businesses...');
  const bizColl = db.collection('businesses');
  const businesses = await bizColl.find({}).toArray();
  let bizCleaned = 0;

  for (const biz of businesses) {
    let updateDoc = {};
    let modified = false;

    if (biz.logoUrl && biz.logoUrl.includes('localhost:5000')) {
      updateDoc.logoUrl = '';
      modified = true;
    }
    if (biz.coverImageUrl && biz.coverImageUrl.includes('localhost:5000')) {
      updateDoc.coverImageUrl = '';
      modified = true;
    }
    if (biz.galleryUrls && biz.galleryUrls.length) {
      const newUrls = biz.galleryUrls.filter(url => !url.includes('localhost:5000'));
      if (newUrls.length !== biz.galleryUrls.length) {
        updateDoc.galleryUrls = newUrls;
        modified = true;
      }
    }
    if (biz.galleryImages && biz.galleryImages.length) {
      const newImages = biz.galleryImages.filter(url => !url.includes('localhost:5000'));
      if (newImages.length !== biz.galleryImages.length) {
        updateDoc.galleryImages = newImages;
        modified = true;
      }
    }
    if (biz.offers && biz.offers.length) {
      const newOffers = biz.offers.map(offer => {
        if (offer.banner && offer.banner.includes('localhost:5000')) {
          offer.banner = '';
        }
        return offer;
      });
      updateDoc.offers = newOffers;
      modified = true;
    }

    if (modified) {
      await bizColl.updateOne({ _id: biz._id }, { $set: updateDoc });
      bizCleaned++;
      console.log(`- Cleaned business ID: ${biz._id} ("${biz.name || biz.businessName}")`);
    }
  }
  console.log(`✓ Total businesses cleaned: ${bizCleaned}`);

  // 2. Clean Blogs
  console.log('\nCleaning blogs...');
  const blogColl = db.collection('blogs');
  const blogs = await blogColl.find({}).toArray();
  let blogsCleaned = 0;

  for (const blog of blogs) {
    let updateDoc = {};
    let modified = false;

    if (blog.coverImage && blog.coverImage.includes('localhost:5000')) {
      updateDoc.coverImage = '';
      modified = true;
    }
    if (blog.thumbnail && blog.thumbnail.includes('localhost:5000')) {
      updateDoc.thumbnail = '';
      modified = true;
    }

    if (modified) {
      await blogColl.updateOne({ _id: blog._id }, { $set: updateDoc });
      blogsCleaned++;
      console.log(`- Cleaned blog ID: ${blog._id} ("${blog.title}")`);
    }
  }
  console.log(`✓ Total blogs cleaned: ${blogsCleaned}`);

  // 3. Clean Events
  console.log('\nCleaning events...');
  const eventColl = db.collection('events');
  const events = await eventColl.find({}).toArray();
  let eventsCleaned = 0;

  for (const event of events) {
    let updateDoc = {};
    let modified = false;

    if (event.coverImageUrl && event.coverImageUrl.includes('localhost:5000')) {
      updateDoc.coverImageUrl = '';
      modified = true;
    }
    if (event.bannerImage && event.bannerImage.includes('localhost:5000')) {
      updateDoc.bannerImage = '';
      modified = true;
    }

    if (modified) {
      await eventColl.updateOne({ _id: event._id }, { $set: updateDoc });
      eventsCleaned++;
      console.log(`- Cleaned event ID: ${event._id} ("${event.title}")`);
    }
  }
  console.log(`✓ Total events cleaned: ${eventsCleaned}`);

  await conn.disconnect();
  console.log('\n🎉 Raw database localhost cleanup complete!');
  process.exit(0);
}

forceClean().catch(console.error);
