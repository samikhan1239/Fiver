
"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Users, CheckCircle, Heart, Share2 } from "lucide-react";
import jwt from "jsonwebtoken";

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

  // Memoize token and user
  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  // Fetch gig and reviews
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch gig
        const gigRes = await fetch(`/api/gigs/${id}`, { cache: "no-store" });
        if (!gigRes.ok) {
          throw new Error(`Failed to fetch gig: ${gigRes.status} ${gigRes.statusText}`);
        }
        const gigData = await gigRes.json();
        console.log("Fetched gig:", gigData);

        // Fetch reviews
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

  // Handle review submission
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

  // Handle contact seller
  const handleContactSeller = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push(`/chat/${id}/${gig.userId?._id || ""}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
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
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/gigs" className="hover:text-green-600">
            {gig.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{gig.subcategory}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="relative">
                <Image
                  src={gig.images[currentImage] || "/placeholder.jpg"}
                  alt={gig.title}
                  width={800}
                  height={384}
                  className="w-full h-96 object-cover rounded-lg"
                  unoptimized
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button className="bg-white/90 p-2 rounded-full hover:bg-white transition-colors">
                    <Heart className="h-5 w-5" />
                  </button>
                  <button className="bg-white/90 p-2 rounded-full hover:bg-white transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                {gig.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      currentImage === index ? "border-green-500" : "border-gray-200"
                    }`}
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
            </div>

            {/* Gig Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{gig.title}</h1>

              <div className="flex items-center mb-4">
                <Image
                  src={ "/default-avatar.png"}
                  alt={gig.userId?.name || "Seller"}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full mr-3"
                  unoptimized
                />
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{gig.userId?.name || "Unknown Seller"}</span>
                    <span className="ml-2 text-sm text-gray-500">{gig.userId?.level || "New Seller"}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {gig.userId?.rating || "N/A"} ({reviews.length} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed">{gig.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">What you get:</h3>
                  <ul className="space-y-1">
                    {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.features.map(
                      (feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Service details:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Delivery: {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.delivery} days</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Response time: {gig.userId?.responseTime || "1 hour"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Reviews ({reviews.length})</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start">
                      <Image
                        src={review.userId?.avatar || "/default-avatar.jpg"}
                        alt={review.userId?.name || "Reviewer"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full mr-3"
                        unoptimized
                      />
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-gray-900">{review.userId?.name || "Anonymous"}</span>
                          <span className="ml-2 text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Form */}
              {user ? (
                <form onSubmit={handleReviewSubmit} className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Add a Review</h3>
                  {error && <p className="text-red-500 mb-4">{error}</p>}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <select
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num} Star{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      rows={4}
                      placeholder="Share your experience..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                  >
                    Submit Review
                  </button>
                </form>
              ) : (
                <p className="mt-4 text-gray-600">
                  <Link href="/auth/login" className="text-green-600 hover:text-green-700">
                    Log in
                  </Link>{" "}
                  to leave a review
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              {/* Package Selection */}
              <div className="mb-6">
                <div className="flex border-b border-gray-200">
                  {gig.packages.map((pkg) => (
                    <button
                      key={pkg.name}
                      onClick={() => setSelectedPackage(pkg.name.toLowerCase())}
                      className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
                        selectedPackage === pkg.name.toLowerCase()
                          ? "border-green-500 text-green-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Package Details */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.name}
                  </h3>
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.price}
                  </span>
                </div>
                <div className="flex items-center mb-4 text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.delivery} day delivery</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {gig.packages
                    .find((pkg) => pkg.name.toLowerCase() === selectedPackage)
                    ?.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                </ul>
                <button
                  onClick={() => router.push(`/gigs/${id}/order?package=${selectedPackage}`)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-3"
                >
                  Continue (₹{gig.packages.find((pkg) => pkg.name.toLowerCase() === selectedPackage)?.price})
                </button>
                <button
                  onClick={handleContactSeller}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Contact Seller
                </button>
              </div>

              {/* Seller Info */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center mb-4">
                  <Image
                    src={ "/default-avatar.png"}
                    alt={gig.userId?.name || "Seller"}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full mr-3"
                    unoptimized
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{gig.userId?.name || "Unknown Seller"}</h4>
                    <p className="text-sm text-gray-500">{gig.userId?.level || "New Seller"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">From</div>
                    <div className="font-medium">{gig.userId?.location || "Unknown"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Avg. response</div>
                    <div className="font-medium">{gig.userId?.responseTime || "1 hour"}</div>
                  </div>
                </div>
                <Link
                  href={`/profile/${gig.userId?._id || ""}`}
                  className="mt-4 block text-center text-green-600 hover:text-green-700 font-medium"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
