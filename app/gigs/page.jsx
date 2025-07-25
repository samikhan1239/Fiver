"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Star, Grid, List } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    { name: "All Categories", color: "from-teal-400 to-cyan-500" },
    { name: "Graphics & Design", color: "from-coral-400 to-red-500" },
    { name: "Digital Marketing", color: "from-teal-400 to-cyan-500" },
    { name: "Writing & Translation", color: "from-lime-400 to-green-500" },
    { name: "Video & Animation", color: "from-orange-400 to-red-500" },
    { name: "Music & Audio", color: "from-purple-400 to-pink-500" },
    { name: "Programming & Tech", color: "from-blue-400 to-indigo-500" },
    { name: "Data", color: "from-pink-400 to-purple-500" },
    { name: "Business", color: "from-emerald-400 to-teal-500" },
  ];

  useEffect(() => {
    async function fetchGigs() {
      try {
        setLoading(true);
        const res = await fetch("/api/gigs", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to fetch gigs");
        }
        const data = await res.json();
        console.log("API response:", data);
        setGigs(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load gigs");
        setLoading(false);
      }
    }
    fetchGigs();
  }, []);

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
      return 0;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from inky-400/20 to-orange-400/20 rounded-full blur-xl animate-bounce" />
        <div className="absolute bottom-32 right-40 w-40 h-40 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse" />
      </div>
      <div className="container mx-auto px-4 py-12 relative">
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-teal-400/20 to-cyan-400/20 text-teal-300 border-teal-400/30 mb-6 px-4 py-2">
            🚀 Explore Gigs
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Discover
            </span>
            <br />
            <span className="bg-gradient-to-r from-coral-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Freelance Talent
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Find the perfect service for your project from thousands of talented freelancers.
          </p>
        </div>

        {error && (
          <Card className="mb-8 border-0 bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-red-300 text-center font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for gigs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="relevance">Best Match</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>

                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="all">All Prices</option>
                  <option value="0-25">₹0 - ₹25</option>
                  <option value="25-50">₹25 - ₹50</option>
                  <option value="50-100">₹50 - ₹100</option>
                  <option value="100+">₹100+</option>
                </select>

                <div className="flex border border-gray-700/50 rounded-lg bg-gray-900/50">
                  <Button
                    onClick={() => setViewMode("grid")}
                    className={`p-3 ${viewMode === "grid" ? "bg-gradient-to-r from-teal-400 to-cyan-400 text-white" : "text-gray-400 hover:text-teal-300"}`}
                    variant="ghost"
                  >
                    <Grid className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() => setViewMode("list")}
                    className={`p-3 ${viewMode === "list" ? "bg-gradient-to-r from-teal-400 to-cyan-400 text-white" : "text-gray-400 hover:text-teal-300"}`}
                    variant="ghost"
                  >
                    <List className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-8">
          <div className="w-64 hidden lg:block">
            <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((category, index) => (
                    <label key={category.name} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.name]);
                          } else {
                            setSelectedCategories(selectedCategories.filter((cat) => cat !== category.name));
                          }
                        }}
                        className="mr-2 rounded bg-gray-900/50 border-gray-700/50 text-teal-400 focus:ring-teal-400"
                      />
                      <span className="text-sm text-gray-300">{category.name}</span>
                    </label>
                  ))}
                </div>

                <hr className="my-6 border-gray-700/50" />

                <h3 className="text-xl font-bold text-white mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Delivery Time
                </h3>
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
                        className="mr-2 rounded bg-gray-900/50 border-gray-700/50 text-teal-400 focus:ring-teal-400"
                      />
                      <span className="text-sm text-gray-300">{days} Day{Number(days) > 1 ? "s" : ""}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            {loading && (
              <p className="text-teal-300 text-center text-xl">Loading gigs...</p>
            )}
            {error && (
              <Card className="mb-8 border-0 bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-red-300 text-center font-medium">{error}</p>
                </CardContent>
              </Card>
            )}
            {!loading && !error && (
              <div className="mb-4 text-sm text-gray-300">
                Showing {filteredGigs.length} results
              </div>
            )}
            {!loading && !error && filteredGigs.length === 0 && (
              <p className="text-gray-300 text-center">No gigs found matching your criteria.</p>
            )}
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredGigs.map((gig, index) => (
                <Link key={gig.id} href={`/gigs/${gig.id}`} className="group">
                  <Card className={`relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:scale-105 transition-all duration-500 ${viewMode === "list" ? "flex" : ""}`}>
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r ${categories[index % categories.length].color} rounded-xl blur opacity-0 group-hover:opacity-50 transition-all duration-500`}
                    ></div>
                    <div className={`relative ${viewMode === "list" ? "w-64" : ""}`}>
                      <Image
                        src={gig.image || "/placeholder.jpg"}
                        alt={gig.title || "Untitled Gig"}
                        width={300}
                        height={300}
                        className={`object-cover ${viewMode === "list" ? "w-full h-48 rounded-l-lg" : "w-full h-48 rounded-t-lg"} group-hover:scale-110 transition-transform duration-500`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <Badge
                        className={`absolute top-3 left-3 bg-gradient-to-r ${categories[index % categories.length].color} text-white border-0 shadow-lg`}
                      >
                        {gig.category || "Featured"}
                      </Badge>
                    </div>

                    <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className="flex items-center mb-2">
                        <Image
                          src={gig.sellerAvatar || "/default-avatar.png"}
                          alt={gig.seller || "Seller"}
                          width={24}
                          height={24}
                          className="rounded-full mr-2"
                        />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-teal-300 transition-colors duration-300">
                          {gig.seller || "Unknown"}
                        </span>
                      </div>

                      <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-teal-300 transition-colors duration-300">
                        {gig.title || "Untitled Gig"}
                      </h3>

                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-300 ml-1">{gig.rating || 0} ({gig.reviews || 0})</span>
                      </div>

                      <div className="flex items-center mb-2 text-sm text-gray-400">
                        <span>Delivery: {gig.packages?.basic?.delivery || "N/A"} days</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Starting at</span>
                        <span className={`font-bold text-xl bg-gradient-to-r ${categories[index % categories.length].color} bg-clip-text text-transparent`}>
                          ₹{gig.packages?.basic?.price || 0}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-12">
              <nav className="flex space-x-2">
                <Button
                  className="px-3 py-2 text-sm text-gray-400 hover:text-teal-300 bg-transparent"
                  variant="ghost"
                >
                  Previous
                </Button>
                <Button className="px-3 py-2 text-sm bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-lg">
                  1
                </Button>
                <Button
                  className="px-3 py-2 text-sm text-gray-400 hover:text-teal-300 bg-transparent"
                  variant="ghost"
                >
                  2
                </Button>
                <Button
                  className="px-3 py-2 text-sm text-gray-400 hover:text-teal-300 bg-transparent"
                  variant="ghost"
                >
                  3
                </Button>
                <Button
                  className="px-3 py-2 text-sm text-gray-400 hover:text-teal-300 bg-transparent"
                  variant="ghost"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}