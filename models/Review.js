// models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  gigId: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Review || mongoose.model("Review", reviewSchema);