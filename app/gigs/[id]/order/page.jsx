
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import jwt from "jsonwebtoken";
import Link from "next/link";

export default function OrderPage() {
  const { id: gigId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPackage = searchParams.get("package") || "standard";
  const [gig, setGig] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle, processing, success, failed
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Memoize token and user
  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  // Log selectedPackage for debugging
  useEffect(() => {
    console.log("Selected package:", selectedPackage);
  }, [selectedPackage]);

  // Fetch gig details
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    async function fetchGig() {
      try {
        const res = await fetch(`/api/gigs/${gigId}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to fetch gig: ${res.status} ${res.statusText}`);
        }
        const gigData = await res.json();
        setGig(gigData);
        // Validate selectedPackage
        const pkg = gigData.packages.find((p) => p.name.toLowerCase() === selectedPackage.toLowerCase());
        if (!pkg) {
          console.error("Invalid package selected", { selectedPackage, gigId });
          setError(`Package "${selectedPackage}" not found for this gig`);
        }
        setLoading(false);
      } catch (err) {
        console.error("Fetch gig error:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        setError(err.message || "Failed to load gig");
        setLoading(false);
      }
    }
    fetchGig();
  }, [gigId, router, user, selectedPackage]);

  // Load Razorpay SDK
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.Razorpay) {
      setIsRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("Razorpay SDK loaded");
      setIsRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      setError("Failed to load payment system. Please try again later.");
      setIsRazorpayLoaded(false);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Handle payment
  const handlePayment = async () => {
    if (!gig || !user) {
      setError("Gig or user not loaded");
      return;
    }

    const selectedPkg = gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage.toLowerCase());
    if (!selectedPkg) {
      setError(`Package "${selectedPackage}" not found`);
      return;
    }

    if (!isRazorpayLoaded || !window.Razorpay) {
      setError("Payment system is not ready. Please try again.");
      return;
    }

    setPaymentStatus("processing");
    setError("");

    try {
      // Create Razorpay order
      const orderRes = await fetch("/api/order/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: selectedPkg.price,
          currency: "INR",
        }),
      });
      if (!orderRes.ok) {
        throw new Error(`Failed to create order: ${orderRes.status} ${orderRes.statusText}`);
      }
      const { orderId } = await orderRes.json();

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: selectedPkg.price * 100,
        currency: "INR",
        name: "Fiver Clone",
        description: `Order for ${gig.title} - ${selectedPkg.name}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyRes = await fetch("/api/order/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                userId: user.id,
                gigId,
                selectedPackage,
              }),
            });
            if (!verifyRes.ok) {
              const errorData = await verifyRes.json();
              throw new Error(`Payment verification failed: ${errorData.message || verifyRes.statusText}`);
            }
            setPaymentStatus("success");
            setTimeout(() => router.push("/dashboard"), 1000);
          } catch (err) {
            console.error("Payment verification error:", {
              message: err.message,
              name: err.name,
              stack: err.stack,
            });
            setError(err.message || "Payment verification failed");
            setPaymentStatus("failed");
          }
        },
        prefill: {
          name: user.name || "Unknown",
          email: user.email || "",
        },
        theme: {
          color: "#10B981",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        setError(response.error.description || "Payment failed");
        setPaymentStatus("-fields");
      });
    } catch (err) {
      console.error("Payment error:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError(err.message || "Failed to initiate payment");
      setPaymentStatus("failed");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Please log in to place an order</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error || "Gig not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/gigs" className="hover:text-green-600">
            {gig.category}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/gigs/${gigId}`} className="hover:text-green-600">
            {gig.title}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Order</span>
        </nav>

        <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h1>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-700">Gig</span>
              <span className="font-medium">{gig.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Package</span>
              <span className="font-medium">
                {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage.toLowerCase())?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Price</span>
              <span className="font-medium">
                ₹{gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage.toLowerCase())?.price}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Delivery</span>
              <span className="font-medium">
                {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage.toLowerCase())?.delivery} days
              </span>
            </div>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}
          {paymentStatus === "success" && (
            <p className="text-green-500 mb-4">Payment successful! Redirecting to dashboard...</p>
          )}
          {paymentStatus === "processing" && (
            <p className="text-gray-600 mb-4">Processing payment...</p>
          )}
          {!isRazorpayLoaded && paymentStatus !== "processing" && (
            <p className="text-gray-600 mb-4">Loading payment system...</p>
          )}

          <button
            onClick={handlePayment}
            disabled={paymentStatus === "processing" || paymentStatus === "success" || !isRazorpayLoaded}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              paymentStatus === "processing" || paymentStatus === "success" || !isRazorpayLoaded
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {paymentStatus === "processing" ? "Processing..." : "Pay with Razorpay"}
          </button>
        </div>
      </div>
    </div>
  );
}
