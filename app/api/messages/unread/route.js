// api/messages/unread.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongodb";
import Message from "../../../../models/Message";
import mongoose from "mongoose";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
    }

    if (userId !== decoded.id) {
      return NextResponse.json({ message: "Unauthorized: User ID does not match token" }, { status: 401 });
    }

    const unreadCount = await Message.countDocuments({
      recipientId: mongoose.Types.ObjectId.createFromHexString(userId),
      read: false,
    });

    console.log("GET /api/messages/unread response:", { userId, unreadCount });
    return NextResponse.json({ unreadCount }, { status: 200 });
  } catch (error) {
    console.error("GET /api/messages/unread error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Failed to fetch unread count", error: error.message }, { status: 500 });
  }
}