require('dotenv').config();
const mongoose = require('mongoose');

const listDatabases = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined');
      process.exit(1);
    }
    console.log('Connecting to MongoDB cluster to list databases...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminDb = mongoose.connection.db.admin();
    const dbsList = await adminDb.listDatabases();
    
    console.log('\n--- DATABASES FOUND IN CLUSTER ---');
    for (let dbInfo of dbsList.databases) {
      console.log(`- Database: ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      // List collections in this database
      const dbConnection = mongoose.connection.useDb(dbInfo.name);
      const collections = await dbConnection.db.listCollections().toArray();
      collections.forEach(col => {
        console.log(`  └─ Collection: ${col.name}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing databases:', error);
    process.exit(1);
  }
};

listDatabases();
