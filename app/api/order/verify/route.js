
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { connectDB } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import Gig from "../../../../models/Gig";
import User from "../../../../models/User";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, gigId, selectedPackage } = await req.json();

    // Verify payment signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      console.error("Invalid payment signature", { razorpayOrderId, razorpayPaymentId });
      return NextResponse.json({ message: "Invalid payment signature" }, { status: 400 });
    }

    await connectDB();

    // Fetch gig details
    const gig = await Gig.findById(gigId).lean();
    if (!gig) {
      console.error("Gig not found", { gigId });
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    // Fetch buyer details
    const user = await User.findById(userId).lean();
    if (!user) {
      console.error("User not found", { userId });
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get selected package
    const pkg = gig.packages.find((p) => p.name.toLowerCase() === selectedPackage?.toLowerCase());
    if (!pkg) {
      console.error("Selected package not found", { selectedPackage, gigId });
      return NextResponse.json({ message: "Selected package not found" }, { status: 400 });
    }

    // Calculate deadline (current date + delivery days)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + pkg.delivery);

    // Create order
    const order = await Order.create({
      buyerId: userId,
      sellerId: gig.userId,
      gigId,
      title: gig.title,
      price: pkg.price,
      status: "pending",
      buyer: {
        name: user.name || "Unknown",
        avatar: user.avatar || "/default-avatar.png",
      },
      deadline: deadline.toISOString(),
      razorpayOrderId,
      razorpayPaymentId,
    });

    console.log("Order created:", { orderId: order._id, gigId, userId });
    return NextResponse.json({ message: "Payment success", orderId: order._id }, { status: 200 });
  } catch (error) {
    console.error("Verify payment error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: "Failed to verify payment", error: error.message },
      { status: 500 }
    );
  }
}
