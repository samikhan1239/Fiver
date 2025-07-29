// api/messages/mark-read.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongodb";
import Message from "../../../../models/Message";
import mongoose from "mongoose";

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

    const { gigId, userId } = await request.json();

    if (!gigId || !userId || !mongoose.Types.ObjectId.isValid(gigId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid gigId or userId" }, { status: 400 });
    }

    if (userId !== decoded.id) {
      return NextResponse.json({ message: "Unauthorized: User ID does not match token" }, { status: 401 });
    }

    const updatedMessages = await Message.updateMany(
      {
        gigId: mongoose.Types.ObjectId.createFromHexString(gigId),
        recipientId: mongoose.Types.ObjectId.createFromHexString(userId),
        read: false,
      },
      { $set: { read: true } }
    );

    console.log("POST /api/messages/mark-read response:", { gigId, userId, modifiedCount: updatedMessages.modifiedCount });
    return NextResponse.json({ modifiedCount: updatedMessages.modifiedCount }, { status: 200 });
  } catch (error) {
    console.error("POST /api/messages/mark-read error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Failed to mark messages as read", error: error.message }, { status: 500 });
  }
}