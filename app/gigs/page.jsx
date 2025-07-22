"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Star, Grid, List } from "lucide-react";
import Image from "next/image";
export default function Gigs() {
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState("all");
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDeliveryTimes, setSelectedDeliveryTimes] = useState([]);

  const categories = [
    "All Categories",
    "Graphics & Design",
    "Digital Marketing",
    "Writing & Translation",
    "Video & Animation",
    "Music & Audio",
    "Programming & Tech",
    "Data",
    "Business",
  ];

  // Fetch gigs from /api/gigs
  useEffect(() => {
    async function fetchGigs() {
      try {
        setLoading(true);
        const res = await fetch("/api/gigs", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to fetch gigs");
        }
        const data = await res.json();
        console.log("API response:", data); // Debug the response
        setGigs(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load gigs");
        setLoading(false);
      }
    }
    fetchGigs();
  }, []);

  // Filter and sort gigs
  const filteredGigs = gigs
    .filter((gig) => {
      const matchesSearch =
        gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes("All Categories") ||
        selectedCategories.includes(gig.category);
      const matchesDelivery =
        selectedDeliveryTimes.length === 0 ||
        selectedDeliveryTimes.includes(gig.packages?.basic?.delivery);
      return matchesSearch && matchesCategory && matchesDelivery;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return Number(a.packages?.basic?.price || 0) - Number(b.packages?.basic?.price || 0);
      } else if (sortBy === "price-high") {
        return Number(b.packages?.basic?.price || 0) - Number(a.packages?.basic?.price || 0);
      } else if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0; // Default: relevance (no sorting)
    })
    .filter((gig) => {
      if (priceRange === "all") return true;
      const price = Number(gig.packages?.basic?.price || 0);
      if (priceRange === "0-25") return price <= 25;
      if (priceRange === "25-50") return price > 25 && price <= 50;
      if (priceRange === "50-100") return price > 50 && price <= 100;
      if (priceRange === "100+") return price > 100;
      return true;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Gigs</h1>
          <p className="text-gray-600">Explore thousands of services from talented freelancers</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for gigs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="relevance">Best Match</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Prices</option>
                <option value="0-25">₹0 - ₹25</option>
                <option value="25-50">₹25 - ₹50</option>
                <option value="50-100">₹50 - ₹100</option>
                <option value="100+">₹100+</option>
              </select>

              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-green-500 text-white" : "text-gray-600"}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-green-500 text-white" : "text-gray-600"}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter((cat) => cat !== category));
                        }
                      }}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>

              <hr className="my-6" />

              <h3 className="font-semibold mb-4">Delivery Time</h3>
              <div className="space-y-2">
                {["1", "3", "7"].map((days) => (
                  <label key={days} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDeliveryTimes.includes(days)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDeliveryTimes([...selectedDeliveryTimes, days]);
                        } else {
                          setSelectedDeliveryTimes(selectedDeliveryTimes.filter((d) => d !== days));
                        }
                      }}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700">{days} Day{Number(days) > 1 ? "s" : ""}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Gigs Grid/List */}
          <div className="flex-1">
            {loading && <p className="text-gray-600">Loading gigs...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && (
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredGigs.length} results
              </div>
            )}
            {!loading && !error && filteredGigs.length ===0}
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredGigs.map((gig) => (
                <Link key={gig.id} href={`/gigs/${gig.id}`} className="group">
                  <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border ${viewMode === "list" ? "flex" : ""}`}>
                    <div className={`relative ${viewMode === "list" ? "w-64" : ""}`}>
                      <Image
  src={gig.image}
  alt={gig.title}
  width={800} // You can adjust this as needed
  height={192} // h-48 = 192px
  className={`object-cover ${viewMode === "list" ? "w-full h-48 rounded-l-lg" : "w-full h-48 rounded-t-lg"}`}
/>
                      <div className="absolute top-3 right-3 bg-black/20 text-white px-2 py-1 rounded text-sm">
                        ❤️
                      </div>
                    </div>

                    <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className="flex items-center mb-2">
                       <Image
  src={gig.sellerAvatar}
  alt={gig.seller || "Seller"}
  width={24} // w-6 = 24px
  height={24} // h-6 = 24px
  className="rounded-full mr-2"
/>
                        <span className="text-sm font-medium text-gray-700">{gig.seller || "Unknown"}</span>
                      </div>

                      <h3 className="font-medium text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                        {gig.title}
                      </h3>

                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{gig.rating} ({gig.reviews})</span>
                      </div>

                      <div className="flex items-center mb-2 text-sm text-gray-500">
                        <span>Delivery: {gig.packages.basic.delivery} days</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Starting at</span>
                        <span className="font-bold text-gray-900">₹{gig.packages.basic.price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <nav className="flex space-x-2">
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-green-600">Previous</button>
                <button className="px-3 py-2 text-sm bg-green-500 text-white rounded">1</button>
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-green-600">2</button>
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-green-600">3</button>
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-green-600">Next</button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}