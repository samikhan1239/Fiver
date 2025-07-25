"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import jwt from "jsonwebtoken";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  useEffect(() => {
    console.log("Selected package:", selectedPackage);
  }, [selectedPackage]);

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

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: selectedPkg.price * 100,
        currency: "INR",
        name: "Fiver Clone",
        description: `Order for ${gig.title} - ${selectedPkg.name}`,
        order_id: orderId,
        handler: async function (response) {
          try {
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
          color: "#14B8A6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        setError(response.error.description || "Payment failed");
        setPaymentStatus("failed");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <Card className="border-0 bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-red-300 text-center font-medium">Please log in to place an order</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <p className="text-teal-300 text-xl">Loading...</p>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <Card className="border-0 bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-red-300 text-center font-medium">{error || "Gig not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-coral-400/20 to-orange-400/20 rounded-full blur-xl animate-bounce" />
        <div className="absolute bottom-32 right-40 w-40 h-40 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse" />
      </div>
      <div className="container mx-auto px-4 py-12 relative">
        <nav className="text-sm text-gray-300 mb-6">
          <Link href="/" className="hover:text-teal-300 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/gigs" className="hover:text-teal-300 transition-colors">
            {gig.category || "Gigs"}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/gigs/${gigId}`} className="hover:text-teal-300 transition-colors">
            {gig.title || "Gig"}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Order</span>
        </nav>

        <Card className="max-w-4xl mx-auto border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Order Summary
            </h1>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Gig</span>
                <span className="font-medium">{gig.title || "Untitled Gig"}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Package</span>
                <span className="font-medium">
                  {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage.toLowerCase())?.name || selectedPackage}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Price</span>
                <span className="font-bold bg-gradient-to-r from-coral-400 to-orange-400 bg-clip-text text-transparent">
                  ₹{gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage.toLowerCase())?.price || 0}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Delivery</span>
                <span className="font-medium">
                  {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage.toLowerCase())?.delivery || "N/A"} days
                </span>
              </div>
            </div>

            {error && (
              <Card className="mb-4 border-0 bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-red-300 text-center font-medium">{error}</p>
                </CardContent>
              </Card>
            )}
            {paymentStatus === "success" && (
              <Card className="mb-4 border-0 bg-gradient-to-br from-teal-800/50 to-cyan-900/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-teal-300 text-center font-medium">
                    Payment successful! Redirecting to dashboard...
                  </p>
                </CardContent>
              </Card>
            )}
            {paymentStatus === "processing" && (
              <p className="text-teal-300 text-center mb-4">Processing payment...</p>
            )}
            {!isRazorpayLoaded && paymentStatus !== "processing" && (
              <p className="text-gray-300 text-center mb-4">Loading payment system...</p>
            )}

            <Button
              onClick={handlePayment}
              disabled={paymentStatus === "processing" || paymentStatus === "success" || !isRazorpayLoaded}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors shadow-lg ${
                paymentStatus === "processing" || paymentStatus === "success" || !isRazorpayLoaded
                  ? "bg-gray-600/50 cursor-not-allowed text-gray-400"
                  : "bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white"
              }`}
            >
              {paymentStatus === "processing" ? "Processing..." : "Pay with Razorpay"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}