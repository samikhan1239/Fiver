// app/api/upload/route.js
import { NextResponse } from "next/server";
import { uploadImage } from "../../../lib/cloudinary";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      console.error("Upload error: No file provided in FormData");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Verify file type and size
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      console.error(`Upload error: Invalid file type: ${file.type}`);
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, GIF allowed" }, { status: 400 });
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error(`Upload error: File size too large: ${file.size} bytes`);
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const url = await uploadImage(file);
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Image upload error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      fileDetails: error.file ? { name: error.file.name, size: error.file.size, type: error.file.type } : "No file details",
    });
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}