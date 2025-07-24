import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  gigId: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["pending", "in_progress", "completed", "cancelled"], required: true },
  buyer: {
    name: { type: String, required: true },
    avatar: { type: String, default: "/default-avatar.png" },
  },
  deadline: { type: String },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);