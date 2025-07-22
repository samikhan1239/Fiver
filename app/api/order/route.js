// File: app/api/order/route.js
import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/Order";

// Force dynamic rendering to prevent static generation
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      console.error("Missing userId");
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    await connectDB();

    const orders = await Order.find({
      $or: [{ sellerId: userId }, { buyerId: userId }],
    })
      .populate("sellerId", "name")
      .lean();

    console.log("Orders fetched:", { userId, count: orders.length });
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Fetch orders error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: "Failed to fetch orders", error: error.message },
      { status: 500 }
    );
  }
}