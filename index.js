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

const port = process.env.WS_PORT || 8080;
let wss;

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  console.log("Connecting to MongoDB...");
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("MongoDB connected");
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
      ws.close(1008, "Missing gigId, sellerId, or userId");
      return;
    }

    console.log("WebSocket connection:", { gigId, sellerId, userId });

    // Ensure ws.url is set
    ws.url = req.url || "";

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data);
        if (!message.gigId || !message.senderId || !message.text) {
          ws.send(JSON.stringify({ error: "Invalid message format" }));
          return;
        }

        // Ensure model is available
        if (typeof Message.create !== "function") {
          console.error("Message model issue detected. Reloading...");
          delete require.cache[require.resolve("./models/Message")];
          const Message = require("./models/Message");
          console.log("Reloaded Message model:", Message);
          if (typeof Message.create !== "function") {
            throw new Error("Message model is not properly initialized");
          }
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
        });

        // Populate userId for sender info
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate("userId", "name avatar")
          .lean();

        console.log("Message saved:", populatedMessage);

        // Broadcast to relevant clients
        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            client.url && // Check if client.url exists
            client.url.includes(`gigId=${gigId}`) &&
            (client.url.includes(`userId=${sellerId}`) || client.url.includes(`userId=${userId}`))
          ) {
            client.send(JSON.stringify(populatedMessage));
          } else {
            console.log("Skipping client:", {
              readyState: client.readyState,
              hasUrl: !!client.url,
              url: client.url || "undefined",
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
      MONGODB_URI: process.env.MONGODB_URI,
      WS_PORT: process.env.WS_PORT,
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
  wss.close(() => {
    mongoose.connection.close(() => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});