import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { v4 as uuid } from "uuid";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { amount, currency } = await request.json();
    if (!amount) {
      return NextResponse.json({ message: "Amount is required" }, { status: 400 });
    }
    const options = {
      amount: amount * 100,
      currency: currency || "INR",
      receipt: uuid(),
    };
    const order = await razorpay.orders.create(options);
    return NextResponse.json({ orderId: order.id }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server Error", error }, { status: 500 });
  }
}