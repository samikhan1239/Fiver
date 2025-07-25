"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Clock, Star, MessageCircle, Edit, Trash2 } from "lucide-react";
import jwt from "jsonwebtoken";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeOrders, setActiveOrders] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Memoize token and user
  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  const categories = [
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
    if (!token || !user || !user.id) {
      console.error("No valid token or user ID found:", { token, user });
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching data for userId:", user.id);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const fetchWithTimeout = async (url, options) => {
          try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            if (!response.ok) {
              throw new Error(`${url} error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
          } catch (err) {
            throw new Error(`Failed to fetch ${url}: ${err.message}`);
          } finally {
            clearTimeout(timeoutId);
          }
        };

        const [ordersData, gigsData] = await Promise.all([
          fetchWithTimeout(`/api/order?userId=${user.id}&status=active`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetchWithTimeout(`/api/gigs?sellerId=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        console.log("Fetched data:", { ordersData, gigsData });

        setActiveOrders(Array.isArray(ordersData) ? ordersData : []);
        setMyGigs(Array.isArray(gigsData) ? gigsData : []);
      } catch (err) {
        console.error("Fetch error:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, token, user]);

  const handleDeliverOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to deliver order: ${response.status} ${response.statusText}`);
      }
      setActiveOrders((orders) =>
        orders.map((order) =>
          order._id === orderId ? { ...order, status: "completed" } : order
        )
      );
      console.log("Order delivered:", { orderId });
    } catch (err) {
      console.error("Deliver order error:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError(err.message || "Failed to deliver order");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "from-green-400 to-teal-500";
      case "paused":
        return "from-yellow-400 to-orange-500";
      case "completed":
        return "from-blue-400 to-indigo-500";
      case "in_progress":
        return "from-purple-400 to-pink-500";
      case "pending":
        return "from-gray-400 to-gray-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <p className="text-teal-300 text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <p className="text-red-400 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_50%)]"></div>
      <div className="container mx-auto px-4 py-12 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-teal-400/20 to-cyan-400/20 text-teal-300 border-teal-400/30 mb-6 px-4 py-2">
            🚀 Seller Dashboard
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Manage Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-coral-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Freelance Empire
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Track your active orders, manage your gigs, and grow your business.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl mb-8 border border-gray-700/50">
          <nav className="flex justify-center space-x-8 px-6 py-4">
            {["overview", "gigs", "orders"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 font-medium text-sm transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-lg"
                    : "text-gray-400 hover:text-teal-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Active Orders
              </h2>
              <div className="space-y-6">
                {activeOrders.length === 0 ? (
                  <p className="text-gray-300 text-center">No active orders found.</p>
                ) : (
                  activeOrders.map((order, index) => (
                    <Card
                      key={order._id}
                      className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:scale-105 transition-all duration-500 group"
                    >
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r ${categories[index % categories.length].color} rounded-xl blur opacity-0 group-hover:opacity-50 transition-all duration-500`}
                      ></div>
                      <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Image
                              src={order.buyer?.avatar || "/default-avatar.png"}
                              alt={order.buyer?.name || "Unknown"}
                              width={48}
                              height={48}
                              className="rounded-full mr-4"
                            />
                            <div>
                              <h3 className="font-bold text-white line-clamp-1 group-hover:text-teal-300 transition-colors duration-300">
                                {order.title || "Untitled Order"}
                              </h3>
                              <p className="text-sm text-gray-300">
                                Buyer: {order.buyer?.name || "Unknown"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-xl bg-gradient-to-r ${categories[index % categories.length].color} bg-clip-text text-transparent`}>
                              ₹{order.price || 0}
                            </p>
                            <Badge
                              className={`mt-2 bg-gradient-to-r ${getStatusColor(order.status)} text-white border-0`}
                            >
                              {order.status?.replace("_", " ") || "Unknown"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">
                            Deadline: {order.deadline ? new Date(order.deadline).toLocaleDateString() : "Not specified"}
                          </span>
                          <div className="flex space-x-2">
                            {user.id === order.sellerId && order.status === "active" && (
                              <Button
                                onClick={() => handleDeliverOrder(order._id)}
                                className="bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                              >
                                Deliver Order
                              </Button>
                            )}
                            <Button
                              asChild
                              className="border border-teal-400/50 text-teal-300 hover:bg-teal-400/20 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                            >
                              <Link href={`/chat/${order.gigId}/${order.buyerId}`}>
                                Message Buyer
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:scale-105 transition-all duration-500 group">
                  <div
                    className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-all duration-500"
                  ></div>
                  <CardContent className="p-6 relative">
                    <Link href="/gigs/create" className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform duration-500">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-teal-300 transition-colors duration-300">
                          Create New Gig
                        </h3>
                        <p className="text-sm text-gray-300">Start selling a new service</p>
                      </div>
                    </Link>
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-coral-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700"></div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:scale-105 transition-all duration-500 group">
                  <div
                    className="absolute -inset-1 bg-gradient-to-r from-coral-400 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-all duration-500"
                  ></div>
                  <CardContent className="p-6 relative">
                    <Link href="/messages" className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-coral-400 to-orange-500 rounded-full flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform duration-500">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-teal-300 transition-colors duration-300">
                          Check Messages
                        </h3>
                        <p className="text-sm text-gray-300">Stay connected with your clients</p>
                      </div>
                    </Link>
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700"></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gigs" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                My Gigs
              </h2>
              <Button
                asChild
                className="bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg"
              >
                <Link href="/gigs/create">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Gig
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myGigs.length === 0 ? (
                <p className="text-gray-300 text-center col-span-full">No gigs found.</p>
              ) : (
                myGigs.map((gig, index) => (
                  <Card
                    key={gig._id}
                    className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:scale-105 transition-all duration-500 group"
                  >
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r ${categories[index % categories.length].color} rounded-xl blur opacity-0 group-hover:opacity-50 transition-all duration-500`}
                    ></div>
                    <div className="relative">
                      <div className="relative overflow-hidden">
                        <Image
                          src={gig.image || "/placeholder.jpg"}
                          alt={gig.title || "Untitled Gig"}
                          width={300}
                          height={192}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <Badge
                          className={`absolute top-3 left-3 bg-gradient-to-r ${categories[index % categories.length].color} text-white border-0 shadow-lg`}
                        >
                          {gig.category || "Featured"}
                        </Badge>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-white mb-4 line-clamp-2 group-hover:text-teal-300 transition-colors duration-300">
                          {gig.title || "Untitled Gig"}
                        </h3>
                        <div className="flex items-center mb-4">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm font-semibold text-white">{gig.rating || 0}</span>
                          <span className="text-sm text-gray-400 ml-1">({gig.reviews || 0})</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-400">Views: {(gig.views || 0).toLocaleString()}</span>
                          <span className="text-sm text-gray-400">Orders: {gig.orders || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-2xl font-black bg-gradient-to-r ${categories[index % categories.length].color} bg-clip-text text-transparent`}>
                            ₹{gig.price || 0}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              asChild
                              className="text-teal-300 hover:text-teal-400"
                              variant="ghost"
                            >
                              <Link href={`/edit-gig/${gig._id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              className="text-red-400 hover:text-red-500"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Active Orders
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeOrders.length === 0 ? (
                <p className="text-gray-300 text-center col-span-full">No active orders found.</p>
              ) : (
                activeOrders.map((order, index) => (
                  <Card
                    key={order._id}
                    className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:scale-105 transition-all duration-500 group"
                  >
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r ${categories[index % categories.length].color} rounded-xl blur opacity-0 group-hover:opacity-50 transition-all duration-500`}
                    ></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Image
                            src={order.buyer?.avatar || "/default-avatar.png"}
                            alt={order.buyer?.name || "Unknown"}
                            width={48}
                            height={48}
                            className="rounded-full mr-4"
                          />
                          <div>
                            <h3 className="font-bold text-white line-clamp-1 group-hover:text-teal-300 transition-colors duration-300">
                              {order.title || "Untitled Order"}
                            </h3>
                            <p className="text-sm text-gray-300">
                              Buyer: {order.buyer?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-xl bg-gradient-to-r ${categories[index % categories.length].color} bg-clip-text text-transparent`}>
                            ₹{order.price || 0}
                          </p>
                          <Badge
                            className={`mt-2 bg-gradient-to-r ${getStatusColor(order.status)} text-white border-0`}
                          >
                            {order.status?.replace("_", " ") || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Deadline: {order.deadline ? new Date(order.deadline).toLocaleDateString() : "Not specified"}
                        </span>
                        <div className="flex space-x-2">
                          {user.id === order.sellerId && order.status === "active" && (
                            <Button
                              onClick={() => handleDeliverOrder(order._id)}
                              className="bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                            >
                              Deliver Order
                            </Button>
                          )}
                          <Button
                            asChild
                            className="border border-teal-400/50 text-teal-300 hover:bg-teal-400/20 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                          >
                            <Link href={`/chat/${order.gigId}/${order.buyerId}`}>
                              Message Buyer
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                      <div className="absolute bottom-3 left-3 w-1 h-1 bg-coral-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700"></div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}