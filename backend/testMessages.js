require('dotenv').config();
const mongoose = require('mongoose');

async function testMessages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('✅ Connected to MongoDB');

    // Get collections
    const conversationsCol = db.collection('conversations');
    const messagesCol = db.collection('messages');

    // Find conversations
    const conversations = await conversationsCol.find({}).limit(5).toArray();
    console.log(`\n📋 Found ${conversations.length} conversations`);

    for (const conv of conversations) {
      console.log(`\n📌 Conversation ID: ${conv.conversationId}`);
      console.log(`   MongoDB _id: ${conv._id}`);
      
      // Find messages with this conversationId
      const messages = await messagesCol.find({
        conversationId: conv.conversationId
      }).toArray();
      
      console.log(`   ✅ Messages with conversationId match: ${messages.length}`);

      // Also try with _id.toString()
      const messagesByIdStr = await messagesCol.find({
        conversationId: conv._id.toString()
      }).toArray();
      
      console.log(`   Messages with _id.toString() match: ${messagesByIdStr.length}`);
    }

    // Find all messages
    const allMessages = await messagesCol.find({}).limit(5).toArray();
    console.log(`\n📨 Sample messages in DB (showing all fields):`);
    allMessages.forEach((msg, idx) => {
      console.log(`  Message ${idx+1}:`);
      console.log(`    _id: ${msg._id}`);
      console.log(`    conversationId: ${msg.conversationId}`);
      console.log(`    message: ${msg.message ? msg.message.substring(0, 50) : 'MISSING'}`);
      console.log(`    senderId: ${msg.senderId}`);
      console.log(`    isDeleted: ${msg.isDeleted}`);
    });

    // Check total message count
    const totalMessages = await messagesCol.countDocuments({});
    console.log(`\n📊 Total messages in database: ${totalMessages}`);

    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testMessages();
