
import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    if (!id) {
      console.error("Missing order ID", { id });
      return NextResponse.json({ message: "Missing order ID" }, { status: 400 });
    }

    // Verify JWT token
    const token = req.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) {
      console.error("No token provided");
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Invalid token", { message: err.message });
      return NextResponse.json({ message: "Unauthorized: Invalid token" }, { status: 401 });
    }

    await connectDB();

    // Fetch order and populate seller details
    const order = await Order.findById(id)
      .populate("sellerId", "name")
      .lean();
    if (!order) {
      console.error("Order not found", { orderId: id });
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Check if user is buyer or seller
    if (order.buyerId.toString() !== user.id && order.sellerId.toString() !== user.id) {
      console.error("Unauthorized access to order", { orderId: id, userId: user.id });
      return NextResponse.json({ message: "Unauthorized: You do not have access to this order" }, { status: 403 });
    }

    console.log("Order fetched:", { orderId: id, userId: user.id });
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Fetch order error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: "Failed to fetch order", error: error.message },
      { status: 500 }
    );
  }
}
