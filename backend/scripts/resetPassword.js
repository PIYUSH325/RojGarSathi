// Usage: node scripts/resetPassword.js user@example.com newPassword [role]

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const email = process.argv[2];
const newPassword = process.argv[3];
const role = process.argv[4] || null;

if (!email || !newPassword) {
  console.error('Usage: node scripts/resetPassword.js user@example.com newPassword [role]');
  process.exit(1);
}

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const query = role ? { email, role } : { email };
  const user = await User.findOne(query).select('+password');
  if (!user) {
    console.log(`No user found with ${role ? `email=${email} role=${role}` : `email=${email}`}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.password = newPassword;
  await user.save();
  console.log(`Password for ${user.email} (role=${user.role}) was reset successfully.`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
