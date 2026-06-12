const mongoose = require('mongoose');

const localUri = 'mongodb://127.0.0.1:27017/udtbusiness';
const atlasUri = process.env.MONGO_URI || 'mongodb+srv://udumalpetbusinesstour:<password>@udumalpetbusinesstour.tggc5t5.mongodb.net/udtbusiness?retryWrites=true&w=majority';

async function migrate() {
  console.log('Connecting to local database: ' + localUri);
  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log('Connected to local database.');

  console.log('Connecting to MongoDB Atlas database...');
  const atlasConn = await mongoose.createConnection(atlasUri).asPromise();
  console.log('Connected to Atlas database.');

  // Get all collection names from local database
  const collections = await localConn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections locally.`);

  for (const collInfo of collections) {
    const collName = collInfo.name;
    // Skip system indexes/collections if any
    if (collName.startsWith('system.')) continue;

    console.log(`\nMigrating collection: "${collName}"...`);
    
    // Fetch all documents from local
    const localColl = localConn.collection(collName);
    const docs = await localColl.find({}).toArray();
    console.log(`- Local document count: ${docs.length}`);
    
    // Clear target Atlas collection
    const atlasColl = atlasConn.collection(collName);
    const deleteRes = await atlasColl.deleteMany({});
    console.log(`- Cleared existing target documents on Atlas: ${deleteRes.deletedCount}`);
    
    if (docs.length > 0) {
      // Insert raw documents directly to Atlas preserving ObjectId references
      const insertRes = await atlasColl.insertMany(docs);
      console.log(`- Successfully inserted ${insertRes.insertedCount} documents to Atlas.`);
    } else {
      console.log(`- Skipped insertion (0 documents).`);
    }
  }

  await localConn.close();
  await atlasConn.close();
  console.log('\n🎉 Database migration to MongoDB Atlas completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
