
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongodb";
import Message from "../../../../models/Message";
import User from "../../../../models/User";
import Gig from "../../../../models/Gig";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      console.error("Get conversations error: Missing userId");
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      console.error("Get conversations error: No token provided");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Get conversations error: Invalid token", err);
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    if (decoded.id !== userId) {
      console.error("Get conversations error: Unauthorized user", { userId, decodedId: decoded.id });
      return NextResponse.json({ message: "Unauthorized user" }, { status: 401 });
    }

    // Fetch messages where user is sender or recipient
    const messages = await Message.find({
      $or: [{ userId }, { recipientId: userId }],
    })
      .populate("userId", "name avatar")
      .populate("recipientId", "name avatar")
      .populate("gigId", "title")
      .lean();

    // Group messages by gigId and other user (buyer or seller)
    const conversations = {};
    for (const msg of messages) {
      const otherUserId = msg.userId.toString() === userId ? msg.recipientId?.toString() : msg.userId.toString();
      const key = `${msg.gigId._id}-${otherUserId || "broadcast"}`;
      if (!conversations[key]) {
        conversations[key] = {
          gigId: msg.gigId._id,
          gigTitle: msg.gigId.title,
          otherUser: msg.userId.toString() === userId ? msg.recipientId : msg.userId,
          messages: [],
          unreadCount: 0,
        };
      }
      conversations[key].messages.push(msg);
      if (!msg.read && msg.recipientId?.toString() === userId) {
        conversations[key].unreadCount += 1;
      }
    }

    // Convert to array and sort by latest message
    const conversationList = Object.values(conversations).map((conv) => ({
      gigId: conv.gigId,
      gigTitle: conv.gigTitle,
      otherUserId: conv.otherUser?._id || null,
      otherUserName: conv.otherUser?.name || "Broadcast",
      otherUserAvatar: conv.otherUser?.avatar || "/default-avatar.jpg",
      latestMessage: conv.messages.sort((a, b) => b.timestamp - a.timestamp)[0],
      unreadCount: conv.unreadCount,
    }));

    console.log(`Found ${conversationList.length} conversations for userId: ${userId}`);
    return NextResponse.json(conversationList.sort((a, b) => b.latestMessage.timestamp - a.latestMessage.timestamp), {
      status: 200,
    });
  } catch (error) {
    console.error("Get conversations error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Failed to load conversations", error: error.message }, { status: 500 });
  }
}
