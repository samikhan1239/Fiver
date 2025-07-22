
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Order from"../../../models/Order";
import Gig from "../../../models/Gig";
import Message from "../../../models/Message";
import Review from "../../../models/Review";
import { connectDB } from "../../../lib/mongodb";

export async function GET(request) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get sellerId from query params
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json({ error: "sellerId is required" }, { status: 400 });
    }

    // Verify JWT token
    const token = request.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Token missing" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    if (decoded.id !== sellerId) {
      return NextResponse.json({ error: "Unauthorized: sellerId mismatch" }, { status: 403 });
    }

    // Convert sellerId to ObjectId
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Fetch orders
    const orders = await Order.find({ sellerId: sellerObjectId });
    const totalEarnings = orders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + (order.price || 0), 0);
    const activeOrders = orders.filter((order) =>
      ["in_progress", "pending"].includes(order.status)
    ).length;
    const completedOrders = orders.filter((order) => order.status === "completed").length;

    // Fetch gigs
    const gigs = await Gig.find({ userId: sellerObjectId });
    const totalViews = gigs.reduce((sum, gig) => sum + (gig.views || 0), 0);

    // Fetch reviews for seller's gigs
    const gigIds = gigs.map((gig) => gig._id);
    const reviews = await Review.find({ gigId: { $in: gigIds } });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
        : 0;

    // Fetch unread messages
    const messagesUnread = await Message.countDocuments({
      recipientId: sellerObjectId,
      read: false,
    });

    const stats = {
      totalEarnings,
      activeOrders,
      completedOrders,
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalViews,
      messagesUnread,
    };

    console.log("Stats fetched for sellerId:", sellerId, stats);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Stats API error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
