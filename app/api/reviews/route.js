// app/api/reviews/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../lib/mongodb";
import Review from "../../../models/Review";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const gigId = searchParams.get("gigId");
    if (!gigId) {
      console.error("Get reviews error: Missing gigId");
      return NextResponse.json({ message: "Missing gigId" }, { status: 400 });
    }
    console.log("Fetching reviews for gig:", { gigId });
    const reviews = await Review.find({ gigId }).populate("userId", "name avatar").lean();
    console.log(`Found ${reviews.length} reviews`);
    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    console.error("Get reviews error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Failed to load reviews", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      console.error("Review creation error: No token provided");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Review creation error: Invalid token", err);
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    await connectDB();
    const { gigId, userId, rating, comment } = await request.json();
    console.log("Received review data:", { gigId, userId, rating, comment });

    if (!gigId || !userId || !rating || !comment) {
      console.error("Review creation error: Missing required fields", { gigId, userId, rating, comment });
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      console.error("Review creation error: Invalid rating", { rating });
      return NextResponse.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
    }
    if (userId !== decoded.id) {
      console.error("Review creation error: Unauthorized user", { userId, decodedId: decoded.id });
      return NextResponse.json({ message: "Unauthorized user" }, { status: 401 });
    }

    const review = await Review.create({
      gigId,
      userId,
      rating,
      comment,
    });

    console.log("Review created successfully:", { reviewId: review._id });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Create review error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      errors: error.errors,
    });
    return NextResponse.json({ message: error.message || "Server Error" }, { status: 500 });
  }
}