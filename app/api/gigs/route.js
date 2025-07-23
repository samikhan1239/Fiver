import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "../../../lib/mongodb";
import Gig from "../../../models/Gig";
import User from "../../../models/User";

export async function GET() {
  try {
    await connectDB();
    console.log("Registered models:", Object.keys(mongoose.models)); // Debug model registration
    console.log("Fetching gigs from database...");
    const gigs = await Gig.find({})
      .populate("userId", "name email avatar", { strictPopulate: false }) // Add strictPopulate: false
      .lean();
    console.log(`Found ${gigs.length} gigs`);

    // Transform gigs to match frontend expectations
    const transformedGigs = gigs.map((gig) => {
      const basicPackage = Array.isArray(gig.packages)
        ? gig.packages.find((pkg) => pkg.name.toLowerCase() === "basic") || {}
        : {};

      return {
        id: gig._id.toString(),
        title: gig.title,
        image: gig.images?.[0] || "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=300",
        seller: gig.userId?.name || "Unknown",
        sellerAvatar: gig.userId?.avatar || "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop",
        rating: gig.rating || 4.9,
        reviews: gig.reviews || 2847,
        packages: {
          basic: {
            price: basicPackage.price || "N/A",
            delivery: basicPackage.delivery || "N/A",
          },
        },
      };
    });

    return NextResponse.json(transformedGigs, { status: 200 });
  } catch (error) {
    console.error("Get gigs error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: "Failed to load gigs", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      console.error("Gig creation error: No token provided");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Gig creation error: Invalid token", err);
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    await connectDB();
    console.log("Registered models:", Object.keys(mongoose.models)); // Debug model registration
    const body = await request.json();
    console.log("Received gig data:", body);

    const {
      title,
      category,
      subcategory,
      description,
      tags,
      images,
      packages,
      requirements,
      faqs,
      userId,
    } = body;

    if (!title || !category || !subcategory || !description || !packages || !userId) {
      console.error("Gig creation error: Missing required fields", {
        title,
        category,
        subcategory,
        description,
        packages,
        userId,
      });
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!Array.isArray(packages)) {
      console.error("Gig creation error: Packages must be an array", { packages });
      return NextResponse.json({ message: "Packages must be an array" }, { status: 400 });
    }
    for (const pkg of packages) {
      if (!pkg.name || !pkg.price || isNaN(pkg.price) || Number(pkg.price) < 5) {
        console.error("Gig creation error: Invalid price in package", { package: pkg });
        return NextResponse.json(
          { message: `Price for ${pkg.name} package must be at least ₹5` },
          { status: 400 }
        );
      }
      if (!pkg.features || !Array.isArray(pkg.features) || pkg.features.some((f) => !f)) {
        console.error("Gig creation error: Invalid features in package", { package: pkg });
        return NextResponse.json(
          { message: `All features in ${pkg.name} package must be filled` },
          { status: 400 }
        );
      }
    }

    if (userId !== decoded.id) {
      console.error("Gig creation error: Unauthorized user", { userId, decodedId: decoded.id });
      return NextResponse.json({ message: "Unauthorized user" }, { status: 401 });
    }

    if (body.price) {
      console.warn("Unexpected top-level price field detected", { price: body.price });
      delete body.price;
    }

    const gig = await Gig.create({
      title,
      category,
      subcategory,
      description,
      tags: tags || [],
      images: images || [],
      packages,
      requirements: requirements || "",
      faqs: faqs || [],
      userId,
    });

    console.log("Gig created successfully:", { gigId: gig._id });
    return NextResponse.json({ message: "Gig created successfully", gig }, { status: 201 });
  } catch (error) {
    console.error("Create gig error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      errors: error.errors,
    });
    return NextResponse.json(
      { message: error.message || "Server Error" },
      { status: 500 }
    );
  }
}