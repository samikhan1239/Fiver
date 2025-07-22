import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();
    console.log("Login attempt:", { email });

    if (!email || !password) {
      console.error("Login error: Missing email or password");
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      console.error("Login error: User not found", { email });
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error("Login error: Invalid password", { email });
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Login successful:", { userId: user._id });
    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Login error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}