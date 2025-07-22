import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../lib/mongodb";
import Message from "../../../models/Message";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const gigId = searchParams.get("gigId");
    const sellerId = searchParams.get("sellerId");
    const userId = searchParams.get("userId");

    if (!gigId || !sellerId || !userId) {
      return NextResponse.json({ message: "Missing gigId, sellerId, or userId" }, { status: 400 });
    }

    const messages = await Message.find({
      gigId,
      $or: [
        { userId: userId, recipientId: sellerId },
        { userId: sellerId, recipientId: userId },
        { userId: userId, recipientId: null }, // Broadcast messages
        { userId: sellerId, recipientId: null },
      ],
    })
      .populate("userId", "name avatar")
      .sort({ timestamp: 1 }) // Ensure oldest to newest
      .lean();

    console.log("GET /api/messages response:", messages);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("GET /api/messages error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Failed to load messages", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    const { gigId, senderId, recipientId, text, timestamp } = await request.json();

    if (!gigId || !senderId || !text) {
      return NextResponse.json({ message: "Missing required fields: gigId, senderId, or text" }, { status: 400 });
    }

    if (senderId !== decoded.id) {
      return NextResponse.json({ message: "Unauthorized: Sender ID does not match token" }, { status: 401 });
    }

    const message = await Message.create({
      gigId,
      userId: senderId,
      recipientId: recipientId || null,
      text,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("userId", "name avatar")
      .lean();

    console.log("POST /api/messages response:", populatedMessage);
    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Failed to save message", error: error.message }, { status: 500 });
  }
}