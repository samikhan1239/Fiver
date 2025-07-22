"use client";
import { useState } from "react";
import { createOrderId } from "../lib/createOrderId";
import { useAuth } from "../lib/auth";

export default function BuyButton({ gig }) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handlePayment = async () => {
    if (!user) {
      alert("Please login to make a purchase");
      return;
    }
    setIsLoading(true);
    try {
      const orderId = await createOrderId(gig.price, "INR");
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: gig.price * 100,
        currency: "INR",
        name: "Fiverr Clone",
        description: `Payment for ${gig.title}`,
        order_id: orderId,
        handler: async function (response) {
          const data = {
            razorpay_order_id: orderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            userId: user._id,
            gigId: gig._id,
          };
          const result = await fetch("/api/order/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const res = await result.json();
          if (res.message === "payment success") {
            alert("Payment Successful!");
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#3399cc" },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", (response) => {
        alert(response.error.description);
      });
      paymentObject.open();
    } catch (error) {
      alert("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className="mt-4 bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {isLoading ? "Processing..." : "Buy Now"}
    </button>
  );
}