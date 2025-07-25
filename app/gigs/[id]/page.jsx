"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Users, CheckCircle, Heart, Share2 } from "lucide-react";
import jwt from "jsonwebtoken";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GigPage() {
  const { id } = useParams();
  const router = useRouter();
  const [gig, setGig] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [currentImage, setCurrentImage] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  useEffect(() => {
    async function fetchData() {
      try {
        const gigRes = await fetch(`/api/gigs/${id}`, { cache: "no-store" });
        if (!gigRes.ok) {
          throw new Error(`Failed to fetch gig: ${gigRes.status} ${gigRes.statusText}`);
        }
        const gigData = await gigRes.json();
        console.log("Fetched gig:", gigData);

        const reviewsRes = await fetch(`/api/reviews?gigId=${id}`, { cache: "no-store" });
        if (!reviewsRes.ok) {
          throw new Error(`Failed to fetch reviews: ${reviewsRes.status} ${reviewsRes.statusText}`);
        }
        const reviewsData = await reviewsRes.json();
        console.log("Fetched reviews:", reviewsData);

        setGig(gigData);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        setError(err.message || "Failed to load gig or reviews");
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to submit a review");
      return;
    }
    if (!newReview.comment || newReview.rating < 1 || newReview.rating > 5) {
      setError("Please provide a valid rating and comment");
      return;
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gigId: id,
          userId: user.id,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to submit review: ${res.status} ${res.statusText}`);
      }
      const newReviewData = await res.json();
      setReviews([...reviews, newReviewData]);
      setNewReview({ rating: 5, comment: "" });
      setError("");
      console.log("Review submitted:", newReviewData);
    } catch (err) {
      console.error("Review submission error:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError(err.message || "Failed to submit review");
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push(`/chat/${id}/${gig.userId?._id || ""}`);
  };

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
          <span className="text-white">{gig.subcategory || "Details"}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6 border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="relative w-full">
                  <Image
                    src={gig.images[currentImage] || "/placeholder.jpg"}
                    alt={gig.title || "Gig Image"}
                    layout="responsive"
                    width={800}
                    height={384}
                    className="w-full h-auto object-contain rounded-t-lg"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Button className="bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500 hover:to-cyan-500 text-white p-2 rounded-full shadow-lg">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button className="bg-gradient-to-r from-teal-400/80 to-cyan-400/80 hover:from-teal-500 hover:to-cyan-500 text-white p-2 rounded-full shadow-lg">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="flex space-x-2 p-4">
                  {gig.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        currentImage === index ? "border-teal-400" : "border-gray-700/50"
                      } hover:border-teal-300 transition-colors`}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  {gig.title || "Untitled Gig"}
                </h1>

                <div className="flex items-center mb-4">
                  <Image
                    src={gig.userId?.avatar || "/default-avatar.png"}
                    alt={gig.userId?.name || "Seller"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full mr-3"
                    unoptimized
                  />
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-300">{gig.userId?.name || "Unknown Seller"}</span>
                      <Badge className="ml-2 bg-gradient-to-r from-coral-400 to-orange-400 text-white border-0">
                        {gig.userId?.level || "New Seller"}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-300 ml-1">
                        {gig.userId?.rating || "N/A"} ({reviews.length} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose max-w-none mb-6 text-gray-300">
                  <p className="leading-relaxed">{gig.description || "No description available."}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-white mb-2 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      What you get:
                    </h3>
                    <ul className="space-y-1">
                      {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.features.map(
                        (feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-300">
                            <CheckCircle className="h-4 w-4 text-teal-400 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      Service details:
                    </h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span>Delivery: {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.delivery || "N/A"} days</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span>Response time: {gig.userId?.responseTime || "1 hour"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Reviews ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-700/50 pb-4 last:border-b-0">
                      <div className="flex items-start">
                        <Image
                          src={review.userId?.avatar || "/default-avatar.png"}
                          alt={review.userId?.name || "Reviewer"}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full mr-3"
                          unoptimized
                        />
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-gray-300">{review.userId?.name || "Anonymous"}</span>
                            <span className="ml-2 text-sm text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-500"}`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-300">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {user ? (
                  <form onSubmit={handleReviewSubmit} className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      Add a Review
                    </h3>
                    {error && (
                      <Card className="mb-4 border-0 bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <p className="text-red-300 text-center font-medium">{error}</p>
                        </CardContent>
                      </Card>
                    )}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-200 mb-2">Rating</label>
                      <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                        className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num} Star{num > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-200 mb-2">Comment</label>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        rows={4}
                        placeholder="Share your experience..."
                        className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white font-medium py-3 px-6 rounded-lg shadow-lg"
                    >
                      Submit Review
                    </Button>
                  </form>
                ) : (
                  <p className="mt-4 text-gray-300">
                    <Link href="/auth/login" className="text-teal-300 hover:text-teal-400">
                      Log in
                    </Link>{" "}
                    to leave a review
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-8">
              <CardContent className="p-6">
                <div className="flex border-b border-gray-700/50 mb-6">
                  {gig.packages.map((pkg, index) => (
                    <button
                      key={pkg.name}
                      onClick={() => setSelectedPackage(pkg.name.toLowerCase())}
                      className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
                        selectedPackage === pkg.name.toLowerCase()
                          ? "border-teal-400 text-teal-300"
                          : "border-transparent text-gray-400 hover:text-teal-300"
                      } transition-colors`}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.name}
                    </h3>
                    <span className="text-2xl font-bold bg-gradient-to-r from-coral-400 to-orange-400 bg-clip-text text-transparent">
                      ₹{gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.price || 0}
                    </span>
                  </div>
                  <div className="flex items-center mb-4 text-sm text-gray-300">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.delivery || "N/A"} day delivery</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {gig.packages
                      .find((pkg) => pkg.name.toLowerCase() === selectedPackage)
                      ?.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 text-teal-400 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                  </ul>
                  <Button
                    onClick={() => router.push(`/gigs/${id}/order?package=${selectedPackage}`)}
                    className="w-full bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white font-medium py-3 px-4 rounded-lg shadow-lg transition-colors mb-3"
                  >
                    Continue (₹{gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.price || 0})
                  </Button>
                  <Button
                    onClick={handleContactSeller}
                    className="w-full border border-teal-400/50 text-teal-300 hover:bg-teal-400/20 font-medium py-3 px-4 rounded-lg transition-colors"
                    variant="outline"
                  >
                    Contact Seller
                  </Button>
                </div>

                <div className="border-t border-gray-700/50 pt-6">
                  <div className="flex items-center mb-4">
                    <Image
                      src={gig.userId?.avatar || "/default-avatar.png"}
                      alt={gig.userId?.name || "Seller"}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full mr-3"
                      unoptimized
                    />
                    <div>
                      <h4 className="font-medium text-gray-300">{gig.userId?.name || "Unknown Seller"}</h4>
                      <p className="text-sm text-gray-400">{gig.userId?.level || "New Seller"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                      <div className="text-gray-400">From</div>
                      <div className="font-medium">{gig.userId?.location || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Avg. response</div>
                      <div className="font-medium">{gig.userId?.responseTime || "1 hour"}</div>
                    </div>
                  </div>
                  <Link
                    href={`/profile/${gig.userId?._id || ""}`}
                    className="mt-4 block text-center text-teal-300 hover:text-teal-400 font-medium"
                  >
                    View Profile
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}