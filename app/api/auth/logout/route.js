import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json({ message: "Logged out" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}