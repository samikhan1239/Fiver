// migrate.js
const mongoose = require("mongoose");
const Message = require("./models/Message");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for migration");

    const messages = await Message.find({});
    console.log(`Found ${messages.length} messages to migrate`);

    for (const msg of messages) {
      if (!msg.messageId || !msg.read) {
        msg.messageId = `${msg.userId}:${msg.timestamp.getTime()}`; // Generate unique messageId
        msg.read = msg.read || false; // Set read to false if undefined
        await msg.save();
        console.log(`Migrated message: ${msg._id} with messageId: ${msg.messageId}`);
      }
    }

    console.log("Migration complete");
  } catch (err) {
    console.error("Migration error:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

migrate();