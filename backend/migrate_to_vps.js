require('dotenv').config();
const mongoose = require('mongoose');

const sourceUri = process.env.MONGO_URI;
const targetUri = process.env.NEW_MONGO_URI;

async function migrate() {
  if (!sourceUri) {
    console.error('Error: MONGO_URI (source database) is not defined in your .env file.');
    process.exit(1);
  }

  if (!targetUri || targetUri.includes('YOUR_NEW_VPS_MONGODB_URL_HERE')) {
    console.error('Error: NEW_MONGO_URI (destination database) is not defined or is still the placeholder in your .env file.');
    console.error('Please update NEW_MONGO_URI in your backend/.env file with the actual URL from your DevOps engineer.');
    process.exit(1);
  }

  console.log('Connecting to Source Database (Atlas)...');
  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  console.log('Connected to Source Database.');

  console.log('Connecting to Target Database (VPS)...');
  const targetConn = await mongoose.createConnection(targetUri).asPromise();
  console.log('Connected to Target Database.');

  // Get all collection names from source database
  const collections = await sourceConn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections on source database.`);

  for (const collInfo of collections) {
    const collName = collInfo.name;
    // Skip system collections/indexes
    if (collName.startsWith('system.')) continue;

    console.log(`\nMigrating collection: "${collName}"...`);
    
    // Fetch all documents from source
    const sourceColl = sourceConn.collection(collName);
    const docs = await sourceColl.find({}).toArray();
    console.log(`- Source document count: ${docs.length}`);
    
    // Clear target collection first
    const targetColl = targetConn.collection(collName);
    const deleteRes = await targetColl.deleteMany({});
    console.log(`- Cleared existing target documents: ${deleteRes.deletedCount}`);
    
    if (docs.length > 0) {
      // Insert raw documents directly to target preserving ObjectId references
      const insertRes = await targetColl.insertMany(docs);
      console.log(`- Successfully inserted ${insertRes.insertedCount} documents to Target.`);
    } else {
      console.log(`- Skipped insertion (0 documents).`);
    }
  }

  await sourceConn.close();
  await targetConn.close();
  console.log('\n🎉 Database migration from Atlas to VPS completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
