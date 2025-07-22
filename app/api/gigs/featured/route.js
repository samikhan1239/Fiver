import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Gig from "../../../../models/Gig";

export async function GET() {
  try {
    await connectDB();
    const gigs = await Gig.find({ status: "active" })
      .sort({ rating: -1, createdAt: -1 })
      .limit(4)
      .populate("userId", "name avatar")
      .lean();
    console.log("Fetched featured gigs:", { count: gigs.length });
    return NextResponse.json(
      gigs.map((gig) => ({
        id: gig._id,
        title: gig.title,
        seller: gig.userId?.name || "Unknown",
        sellerAvatar: gig.userId?.avatar || "/default-avatar.jpg",
        rating: gig.rating || 0,
        reviews: gig.reviews || 0,
        price: gig.packages?.[0]?.price || 0,
        image: gig.images?.[0] || "/placeholder.jpg",
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch featured gigs error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: "Failed to fetch featured gigs", error: error.message },
      { status: 500 }
    );
  }
}