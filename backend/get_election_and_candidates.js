require('dotenv').config();
const mongoose = require('mongoose');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const election = await Election.findOne({ title: 'office ' });
    if (!election) {
      console.log('Election "office " not found.');
      process.exit(1);
    }
    console.log(`Election ID: ${election._id}`);
    
    const candidates = await Candidate.find({ election: election._id });
    console.log('Candidates:');
    candidates.forEach(c => {
      console.log(`- ID: ${c._id}, Name: ${c.name}, Position: ${c.position}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
