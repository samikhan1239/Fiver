import { WebSocketServer } from "ws";
import { parse } from "url";
import { connectDB } from "../../../lib/mongodb";
import Message from "../../../models/Message";

let wsServer;

export const GET = async (req) => {
  if (!wsServer) {
    wsServer = new WebSocketServer({ noServer: true });
    wsServer.on("connection", async (ws, request) => {
      const { query } = parse(request.url, true);
      const { gigId, sellerId, userId } = query;

      if (!gigId || !sellerId || !userId) {
        ws.close(1008, "Missing gigId, sellerId, or userId");
        return;
      }

      console.log("WebSocket connection:", { gigId, sellerId, userId });

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data);
          if (!message.gigId || !message.senderId || !message.text) {
            ws.send(JSON.stringify({ error: "Invalid message format" }));
            return;
          }

          // Save message to MongoDB
          await connectDB();
          const savedMessage = await Message.create({
            gigId: message.gigId,
            userId: message.senderId,
            recipientId: message.recipientId || null,
            text: message.text,
            timestamp: new Date(message.timestamp),
          });

          // Populate userId for sender info
          const populatedMessage = await Message.findById(savedMessage._id)
            .populate("userId", "name avatar")
            .lean();

          // Broadcast to relevant clients
          wsServer.clients.forEach((client) => {
            const clientQuery = parse(client.url, true).query;
            if (
              client.readyState === WebSocket.OPEN &&
              clientQuery.gigId === gigId &&
              (clientQuery.userId === userId || clientQuery.userId === sellerId || clientQuery.userId === message.recipientId)
            ) {
              client.send(JSON.stringify(populatedMessage));
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

      ws.url = request.url; // Store URL for filtering clients
    });
  }

  const upgradeHeader = req.headers.get("upgrade");
  if (upgradeHeader !== "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const { socket } = req;
  wsServer.handleUpgrade(req, socket, Buffer.alloc(0), (ws) => {
    wsServer.emit("connection", ws, req);
  });

  return new Response(null, { status: 101 });
};