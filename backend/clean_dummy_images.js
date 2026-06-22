const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const atlasUri = process.env.MONGO_URI;

if (!atlasUri) {
  console.error('Error: MONGO_URI is not defined in backend .env file.');
  process.exit(1);
}

async function cleanDummyImages() {
  console.log('Connecting to MongoDB database to remove Unsplash placeholders...');
  const conn = await mongoose.connect(atlasUri);
  const db = conn.connection.db;
  console.log('Connected.');

  // 1. Clean Blogs Collection
  console.log('\nCleaning Blogs dummy cover/thumbnail fields...');
  const blogColl = db.collection('blogs');
  const blogs = await blogColl.find({}).toArray();
  let blogsUpdated = 0;

  for (const blog of blogs) {
    let updateDoc = {};
    let modified = false;

    if (blog.coverImage && blog.coverImage.includes('unsplash.com')) {
      updateDoc.coverImage = '';
      modified = true;
    }
    if (blog.thumbnail && blog.thumbnail.includes('unsplash.com')) {
      updateDoc.thumbnail = '';
      modified = true;
    }

    if (modified) {
      await blogColl.updateOne({ _id: blog._id }, { $set: updateDoc });
      blogsUpdated++;
      console.log(`- Cleared Unsplash placeholders for blog: "${blog.title}"`);
    }
  }
  console.log(`✓ Cleaned ${blogsUpdated} blogs.`);

  // 2. Clean Events Collection
  console.log('\nCleaning Events dummy cover/banner fields...');
  const eventColl = db.collection('events');
  const events = await eventColl.find({}).toArray();
  let eventsUpdated = 0;

  for (const event of events) {
    let updateDoc = {};
    let modified = false;

    if (event.coverImageUrl && event.coverImageUrl.includes('unsplash.com')) {
      updateDoc.coverImageUrl = '';
      modified = true;
    }
    if (event.bannerImage && event.bannerImage.includes('unsplash.com')) {
      updateDoc.bannerImage = '';
      modified = true;
    }

    if (modified) {
      await eventColl.updateOne({ _id: event._id }, { $set: updateDoc });
      eventsUpdated++;
      console.log(`- Cleared Unsplash placeholders for event: "${event.title}"`);
    }
  }
  console.log(`✓ Cleaned ${eventsUpdated} events.`);

  await conn.disconnect();
  console.log('\n🎉 Finished cleaning database Unsplash placeholders!');
  process.exit(0);
}

cleanDummyImages().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
