// lib/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: "fiverr_clone" }, (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", {
            message: error.message,
            name: error.name,
            status: error.http_code,
          });
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }).end(buffer);
    });
  } catch (error) {
    console.error("Cloudinary upload preparation error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw error;
  }
}