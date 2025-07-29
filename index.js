// WebSocket Server (index.js)
require("dotenv").config({ path: "./.env.local" });

const { WebSocketServer } = require("ws");
const mongoose = require("mongoose");
const { parse } = require("url");
const http = require("http");

// Clear module cache to ensure fresh model load
delete require.cache[require.resolve("./models/Message")];
delete require.cache[require.resolve("./models/User")];

// Import models
const Message = require("./models/Message");
const User = require("./models/User");

// Debug model initialization
console.log("Message model:", Message);
console.log("Message.create is function:", typeof Message.create === "function");

// Use PORT for Render compatibility, default to 3001 for local
const port = process.env.PORT || 3001;
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

// Create HTTP server for WebSocket on Render
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", mongoConnected: mongoose.connection.readyState === 1 }));
  } else {
    res.writeHead(200);
    res.end("WebSocket server running...");
  }
});

// Initialize WebSocket server
function startWebSocketServer() {
  if (wss) {
    console.log("WebSocket server already running");
    return wss;
  }

  wss = new WebSocketServer({ server });
  console.log(`WebSocket server running on ws://localhost:${port}`);

  const activeConnections = new Map(); // Map<userId, Set<WebSocket>>

  wss.on("connection", async (ws, req) => {
    const { query } = parse(req.url, true);
    const { gigId, sellerId, userId } = query;

    // Validate userId (required for all connections)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      ws.send(JSON.stringify({ error: "Missing or invalid userId" }));
      ws.close(1008, "Missing or invalid userId");
      return;
    }

    // For chat connections, validate gigId and sellerId
    if (gigId || sellerId) {
      if (!gigId || !sellerId || !mongoose.Types.ObjectId.isValid(gigId) || !mongoose.Types.ObjectId.isValid(sellerId)) {
        ws.send(JSON.stringify({ error: "Invalid gigId or sellerId" }));
        ws.close(1008, "Invalid gigId or sellerId");
        return;
      }
    }

    console.log("WebSocket connection:", { gigId, sellerId, userId });

    // Store query parameters
    ws.query = { gigId, sellerId, userId };

    // Manage active connections
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    const userConnections = activeConnections.get(userId);
    userConnections.add(ws);

    // Close older chat connections for the same userId and gigId
    if (gigId && userConnections.size > 1) {
      userConnections.forEach((client) => {
        if (client !== ws && client.query.gigId === gigId) {
          client.close(1008, "Duplicate chat connection");
          userConnections.delete(client);
          console.log("Closed duplicate chat connection for userId:", userId, "gigId:", gigId);
        }
      });
    }

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data);
        console.log("Received WebSocket message:", message);

        // Validate message format
        if (!message.gigId || !message.senderId || !message.text) {
          console.log("Invalid message format:", message);
          ws.send(JSON.stringify({ error: "Invalid message format: Missing gigId, senderId, or text" }));
          return;
        }

        // Validate message ObjectIds
        if (
          !mongoose.Types.ObjectId.isValid(message.gigId) ||
          !mongoose.Types.ObjectId.isValid(message.senderId) ||
          (message.recipientId && !mongoose.Types.ObjectId.isValid(message.recipientId))
        ) {
          console.log("Invalid message IDs:", message);
          ws.send(JSON.stringify({ error: "Invalid message IDs" }));
          return;
        }

        // Create unique messageId
        const messageId = message.messageId || `${message.senderId}:${message.timestamp}:${Math.random().toString(36).slice(2, 8)}`;
        const existingMessage = await Message.findOne({ messageId });
        if (existingMessage) {
          console.log("Duplicate message ignored:", { messageId, _id: existingMessage._id });
          return;
        }

        await connectDB();

        const savedMessage = await Message.create({
          gigId: mongoose.Types.ObjectId.createFromHexString(message.gigId),
          userId: mongoose.Types.ObjectId.createFromHexString(message.senderId),
          recipientId: message.recipientId
            ? mongoose.Types.ObjectId.createFromHexString(message.recipientId)
            : null,
          text: message.text,
          timestamp: new Date(message.timestamp || Date.now()),
          read: false,
          messageId,
        });

        const populatedMessage = await Message.findById(savedMessage._id)
          .populate("userId", "name avatar")
          .lean();

        if (!populatedMessage) {
          console.error("Failed to populate message:", savedMessage._id);
          ws.send(JSON.stringify({ error: "Failed to retrieve message details" }));
          return;
        }

        console.log("Message saved:", populatedMessage);

        // Broadcast to chat clients (same gigId)
        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            client.query &&
            client.query.gigId === message.gigId &&
            (client.query.userId === message.senderId || client.query.userId === (message.recipientId || message.senderId))
          ) {
            client.send(JSON.stringify(populatedMessage));
            console.log("Sent message to chat client:", client.query.userId);
          }
        });

        // Broadcast to notification clients (recipient and sender)
        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            client.query &&
            !client.query.gigId && // Notification-only connections
            (client.query.userId === message.senderId || client.query.userId === (message.recipientId || message.senderId))
          ) {
            client.send(JSON.stringify(populatedMessage));
            console.log("Sent message to notification client:", client.query.userId);
          }
        });
      } catch (err) {
        if (err.code === 11000) {
          console.log("Duplicate messageId ignored:", messageId);
          return;
        }
        console.error("Error processing message:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        ws.send(JSON.stringify({ error: "Server error" }));
      }
    });

    ws.on("close", () => {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        activeConnections.delete(userId);
      }
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
      PORT: process.env.PORT || 3001,
    });
    await connectDB();
    startWebSocketServer();
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port} (local) or Render-assigned port`);
    });
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

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
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