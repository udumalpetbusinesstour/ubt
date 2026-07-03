require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const mongoUri = process.env.MONGO_URI;
const backupDir = path.join(__dirname, 'db_backup');

async function backup() {
  if (!mongoUri) {
    console.error('Error: MONGO_URI is not defined in your .env file.');
    process.exit(1);
  }

  console.log('Connecting to Database to take backup...');
  const conn = await mongoose.createConnection(mongoUri).asPromise();
  console.log('Connected.');

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const collections = await conn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections to backup.`);

  for (const collInfo of collections) {
    const collName = collInfo.name;
    if (collName.startsWith('system.')) continue;

    console.log(`Exporting collection: "${collName}"...`);
    const coll = conn.collection(collName);
    const docs = await coll.find({}).toArray();

    const filePath = path.join(backupDir, `${collName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    console.log(`- Saved ${docs.length} documents to: ${path.basename(filePath)}`);
  }

  await conn.close();
  console.log(`\n🎉 Backup complete! All files saved in the folder: backend/db_backup/`);
  process.exit(0);
}

backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
