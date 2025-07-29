// api/messages/index.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../lib/mongodb";
import Message from "../../../models/Message";
import User from "../../../models/User";
import mongoose from "mongoose";

// Explicitly register User model
mongoose.model("User");

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

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(gigId) ||
      !mongoose.Types.ObjectId.isValid(sellerId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return NextResponse.json({ message: "Invalid gigId, sellerId, or userId" }, { status: 400 });
    }

    const messages = await Message.find({
      gigId: mongoose.Types.ObjectId.createFromHexString(gigId),
      $or: [
        { userId: mongoose.Types.ObjectId.createFromHexString(userId), recipientId: mongoose.Types.ObjectId.createFromHexString(sellerId) },
        { userId: mongoose.Types.ObjectId.createFromHexString(sellerId), recipientId: mongoose.Types.ObjectId.createFromHexString(userId) },
        { userId: mongoose.Types.ObjectId.createFromHexString(userId), recipientId: null },
        { userId: mongoose.Types.ObjectId.createFromHexString(sellerId), recipientId: null },
      ],
    })
      .populate("userId", "name avatar")
      .sort({ timestamp: 1 })
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

    const payload = await request.json();
    console.log("POST /api/messages payload:", payload);
    const { gigId, senderId, recipientId, text, timestamp } = payload;

    if (!gigId || !senderId || !text) {
      console.log("❌ Missing required fields:", { gigId, senderId, text, timestamp });
      return NextResponse.json({ message: "Missing required fields: gigId, senderId, or text" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(gigId) || !mongoose.Types.ObjectId.isValid(senderId) || (recipientId && !mongoose.Types.ObjectId.isValid(recipientId))) {
      return NextResponse.json({ message: "Invalid gigId, senderId, or recipientId" }, { status: 400 });
    }

    if (senderId !== decoded.id) {
      return NextResponse.json({ message: "Unauthorized: Sender ID does not match token" }, { status: 401 });
    }

    // Create unique messageId
    const messageId = `${senderId}:${timestamp || Date.now()}`;
    const existingMessage = await Message.findOne({ messageId });
    if (existingMessage) {
      console.log("Duplicate message ignored:", messageId);
      return NextResponse.json({ message: "Message already exists" }, { status: 409 });
    }

    try {
      const message = await Message.create({
        gigId: mongoose.Types.ObjectId.createFromHexString(gigId),
        userId: mongoose.Types.ObjectId.createFromHexString(senderId),
        recipientId: recipientId ? mongoose.Types.ObjectId.createFromHexString(recipientId) : null,
        text,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        read: false,
        messageId,
      });

      const populatedMessage = await Message.findById(message._id)
        .populate("userId", "name avatar")
        .lean();

      console.log("POST /api/messages response:", populatedMessage);
      return NextResponse.json(populatedMessage, { status: 201 });
    } catch (error) {
      if (error.code === 11000) {
        console.log("Duplicate messageId ignored:", messageId);
        return NextResponse.json({ message: "Message already exists" }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error("POST /api/messages error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Failed to save message", error: error.message }, { status: 500 });
  }
}