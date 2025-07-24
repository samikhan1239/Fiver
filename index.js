require("dotenv").config({ path: "./.env.local" });
const { WebSocketServer } = require("ws");
const mongoose = require("mongoose");
const { parse } = require("url");

// Clear module cache to ensure fresh model load
delete require.cache[require.resolve("./models/Message")];
delete require.cache[require.resolve("./models/User")];

// Import models
const Message = require("./models/Message");
const User = require("./models/User");

// Debug model initialization
console.log("Message model:", Message);
console.log("Message.create is function:", typeof Message.create === "function");

const port = process.env.WS_PORT || 3001; // Updated to 3001
let wss;

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  console.log("Connecting to MongoDB...");
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    throw err;
  }
}

// Initialize WebSocket server
function startWebSocketServer() {
  if (wss) return wss;

  wss = new WebSocketServer({ port });
  console.log(`WebSocket server running on ws://localhost:${port}`);

  wss.on("connection", async (ws, req) => {
    const { query } = parse(req.url, true);
    const { gigId, sellerId, userId } = query;

    if (!gigId || !sellerId || !userId) {
      ws.send(JSON.stringify({ error: "Missing gigId, sellerId, or userId" }));
      ws.close(1008, "Missing gigId, sellerId, or userId");
      return;
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(gigId) ||
      !mongoose.Types.ObjectId.isValid(sellerId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      ws.send(JSON.stringify({ error: "Invalid gigId, sellerId, or userId" }));
      ws.close(1008, "Invalid gigId, sellerId, or userId");
      return;
    }

    console.log("WebSocket connection:", { gigId, sellerId, userId });

    // Store query parameters directly on ws
    ws.query = { gigId, sellerId, userId };

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data);
        if (!message.gigId || !message.senderId || !message.text) {
          ws.send(JSON.stringify({ error: "Invalid message format" }));
          return;
        }

        // Validate message ObjectIds
        if (
          !mongoose.Types.ObjectId.isValid(message.gigId) ||
          !mongoose.Types.ObjectId.isValid(message.senderId) ||
          (message.recipientId && !mongoose.Types.ObjectId.isValid(message.recipientId))
        ) {
          ws.send(JSON.stringify({ error: "Invalid message IDs" }));
          return;
        }

        // Save message to MongoDB
        await connectDB();
        const savedMessage = await Message.create({
          gigId: mongoose.Types.ObjectId.createFromHexString(message.gigId),
          userId: mongoose.Types.ObjectId.createFromHexString(message.senderId),
          recipientId: message.recipientId
            ? mongoose.Types.ObjectId.createFromHexString(message.recipientId)
            : null,
          text: message.text,
          timestamp: new Date(message.timestamp),
          read: false,
        });

        // Populate userId for sender info
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate("userId", "name avatar")
          .lean();

        if (!populatedMessage) {
          console.error("Failed to populate message:", savedMessage._id);
          ws.send(JSON.stringify({ error: "Failed to retrieve message details" }));
          return;
        }

        console.log("Message saved:", populatedMessage);

        // Broadcast to relevant clients
        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            client.query &&
            client.query.gigId === gigId &&
            (client.query.userId === sellerId || client.query.userId === userId)
          ) {
            client.send(JSON.stringify(populatedMessage));
          } else {
            console.log("Skipping client:", {
              readyState: client.readyState,
              query: client.query,
              matchesGig: client.query?.gigId === gigId,
              matchesUser: client.query?.userId === sellerId || client.query?.userId === userId,
            });
          }
        });
      } catch (err) {
        console.error("WebSocket message error:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        ws.send(JSON.stringify({ error: "Failed to process message" }));
      }
    });

    ws.on("close", () => {
      console.log("WebSocket disconnected:", { gigId, sellerId, userId });
    });
  });

  return wss;
}

// Start server and connect to MongoDB
async function start() {
  try {
    console.log("Environment variables:", {
      MONGODB_URI: process.env.MONGODB_URI ? "[REDACTED]" : "undefined",
      WS_PORT: process.env.WS_PORT || 3001,
    });
    await connectDB();
    startWebSocketServer();
  } catch (err) {
    console.error("Failed to start WebSocket server:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    process.exit(1);
  }
}

start();

process.on("SIGTERM", () => {
  console.log("Shutting down WebSocket server...");
  if (wss) {
    wss.close(() => {
      mongoose.connection.close(() => {
        console.log("MongoDB connection closed");
        process.exit(0);
      });
    });
  } else {
    mongoose.connection.close(() => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  }
});