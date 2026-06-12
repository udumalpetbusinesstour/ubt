const mongoose = require('mongoose');

const atlasUri = process.env.MONGO_URI || 'mongodb+srv://udumalpetbusinesstour:<password>@udumalpetbusinesstour.tggc5t5.mongodb.net/udtbusiness?retryWrites=true&w=majority';

async function findLocalhostRefs() {
  console.log('Connecting to MongoDB Atlas...');
  const conn = await mongoose.connect(atlasUri);
  console.log('Connected.');

  const collections = await conn.connection.db.listCollections().toArray();
  
  for (const collInfo of collections) {
    const collName = collInfo.name;
    const coll = conn.connection.db.collection(collName);
    
    // Find any document that has a field containing "localhost:5000"
    // We can do a text search or scan documents
    const docs = await coll.find({}).toArray();
    let count = 0;

    for (const doc of docs) {
      const docStr = JSON.stringify(doc);
      if (docStr.includes('localhost:5000')) {
        count++;
        // Print matching fields
        console.log(`\nMatch in collection "${collName}", Document ID: ${doc._id}`);
        // Scan keys
        for (const [key, val] of Object.entries(doc)) {
          const valStr = JSON.stringify(val);
          if (valStr.includes('localhost:5000')) {
            console.log(`  - Key "${key}": ${valStr}`);
          }
        }
      }
    }
  }

  await conn.disconnect();
  console.log('\nSearch complete!');
  process.exit(0);
}

findLocalhostRefs().catch(console.error);
