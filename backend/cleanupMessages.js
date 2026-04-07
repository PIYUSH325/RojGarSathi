require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupMessages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('✅ Connected to MongoDB');

    const messagesCol = db.collection('messages');

    // Find messages without required fields
    const invalidMessages = await messagesCol.find({
      $or: [
        { conversationId: { $exists: false } },
        { message: { $exists: false } },
        { senderId: { $exists: false } }
      ]
    }).toArray();

    console.log(`\n🗑️  Found ${invalidMessages.length} invalid messages`);

    if (invalidMessages.length > 0) {
      // Delete invalid messages
      const result = await messagesCol.deleteMany({
        $or: [
          { conversationId: { $exists: false } },
          { message: { $exists: false } },
          { senderId: { $exists: false } }
        ]
      });
      
      console.log(`✅ Deleted ${result.deletedCount} invalid messages`);
    }

    // Show status
    const totalMessages = await messagesCol.countDocuments({});
    const validMessages = await messagesCol.find({
      conversationId: { $exists: true, $ne: null },
      message: { $exists: true, $ne: null }
    }).toArray();

    console.log(`\n📊 Database stats:`);
    console.log(`   Total messages: ${totalMessages}`);
    console.log(`   Valid messages: ${validMessages.length}`);

    if (validMessages.length > 0) {
      console.log(`\n✅ Sample valid message:`);
      const msg = validMessages[0];
      console.log(`   conversationId: ${msg.conversationId}`);
      console.log(`   message: ${msg.message.substring(0, 60)}...`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Cleanup complete');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

cleanupMessages();
