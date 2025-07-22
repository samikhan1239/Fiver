// app/api/gigs/[id]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Gig from "../../../../models/Gig";

export async function GET(request, { params }) {
  try {
    await connectDB();
    console.log("Fetching gig with ID:", params.id);
    const gig = await Gig.findById(params.id).populate("userId", "name avatar level rating responseTime location").lean();
    if (!gig) {
      console.error("Gig not found:", { id: params.id });
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }
    console.log("Fetched gig:", { id: gig._id });
    return NextResponse.json(gig, { status: 200 });
  } catch (error) {
    console.error("Get gig error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Failed to load gig", error: error.message }, { status: 500 });
  }
}