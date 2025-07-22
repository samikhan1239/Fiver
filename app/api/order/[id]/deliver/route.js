
import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import Order from "../../../../../models/Order";

export async function POST(req, { params }) {
  try {
    const { id } = params;
    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      console.error("Order not found", { orderId: id });
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      console.error("Order cannot be delivered", { orderId: id, status: order.status });
      return NextResponse.json({ message: "Order cannot be delivered" }, { status: 400 });
    }

    order.status = "completed";
    await order.save();

    console.log("Order delivered:", { orderId: id });
    return NextResponse.json({ message: "Order delivered successfully" }, { status: 200 });
  } catch (error) {
    console.error("Deliver order error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: "Failed to deliver order", error: error.message },
      { status: 500 }
    );
  }
}
