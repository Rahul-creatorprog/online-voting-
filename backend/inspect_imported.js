require('dotenv').config();
const mongoose = require('mongoose');

const inspectImported = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.useDb('studentdata');
    const collection = db.collection('details');
    
    const count = await collection.countDocuments();
    console.log(`\nFound ${count} documents in studentdata.details.`);
    
    if (count > 0) {
      const samples = await collection.find({}).limit(5).toArray();
      console.log('Sample documents:');
      console.log(JSON.stringify(samples, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

inspectImported();
