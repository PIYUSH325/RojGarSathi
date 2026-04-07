// Usage: node scripts/showUser.js user@example.com

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const email = process.argv[2];
if (!email) {
  console.error('Please provide an email: node scripts/showUser.js user@example.com');
  process.exit(1);
}

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.log(`No user found with email=${email}`);
  } else {
    // Print key fields (including hashed password)
    console.log('User document:');
    console.log({
      _id: user._id,
      email: user.email,
      role: user.role,
      passwordHash: user.password, // this may be undefined because select:false on schema; using lean() may include it only if selected
      profilePhoto: user.profilePhoto,
      resume: user.resume,
      city: user.city,
      pincode: user.pincode,
      skills: user.skills,
      createdAt: user.createdAt,
    });
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
