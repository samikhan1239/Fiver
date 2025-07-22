// models/Gig.js
import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  delivery: { type: String, required: true },
  features: [{ type: String, required: true }],
});

const gigSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }],
  images: [{ type: String }],
  packages: [packageSchema], // Array of packages
  requirements: { type: String, default: "" },
  faqs: [{ question: String, answer: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Gig || mongoose.model("Gig", gigSchema);