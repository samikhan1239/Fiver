
"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, DollarSign, Clock, Star, Eye, MessageCircle, Edit, Trash2, BarChart3 } from "lucide-react";
import jwt from "jsonwebtoken";
import Image from "next/image";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeOrders: 0,
    completedOrders: 0,
    avgRating: 0,
    totalViews: 0,
    messagesUnread: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Memoize token and user
  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  useEffect(() => {
    if (!token || !user || !user.id) {
      console.error("No valid token or user ID found:", { token, user });
      router.push("/auth/login");
      return;
    }

    // Fetch stats, orders, and gigs
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

        const [statsData, ordersData, gigsData] = await Promise.all([
          fetchWithTimeout(`/api/stats?sellerId=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetchWithTimeout(`/api/order?userId=${user.id}`, { // Changed to /api/orders and userId
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetchWithTimeout(`/api/gigs?sellerId=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        console.log("Fetched data:", { statsData, ordersData, gigsData });

        setStats(statsData || {});
        setRecentOrders(Array.isArray(ordersData) ? ordersData : []);
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

  // Deliver order handler
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
      setRecentOrders((orders) =>
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
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your services and track your performance</p>
          </div>
          <Link
            href="/gigs/create"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Gig
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₹{(stats.totalEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgRating || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-indigo-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.totalViews || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-pink-500">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-pink-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.messagesUnread || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("gigs")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "gigs"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                My Gigs
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "orders"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "analytics"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-gray-600">No recent orders found.</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Image
  src={order.buyer?.avatar || "/default-avatar.jpg"}
  alt={order.buyer?.name || "Unknown"}
  width={40} // w-10 = 40px
  height={40} // h-10 = 40px
  className="rounded-full mr-3"
/>
                        <div>
                          <h3 className="font-medium text-gray-900">{order.title || "Untitled Order"}</h3>
                          <p className="text-sm text-gray-600">
                            {user.id === order.sellerId ? `Buyer: ${order.buyer?.name || "Unknown"}` : `Seller: ${order.seller?.name || "Unknown"}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{order.price || 0}</p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status?.replace("_", " ") || "Unknown"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4">
                <Link
                  href="/create-service"
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Plus className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Create New Gig</h3>
                    <p className="text-sm text-gray-600">Start selling a new service</p>
                  </div>
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <MessageCircle className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Check Messages</h3>
                    <p className="text-sm text-gray-600">{stats.messagesUnread || 0} unread messages</p>
                  </div>
                </Link>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <BarChart3 className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">View Analytics</h3>
                    <p className="text-sm text-gray-600">Track your performance</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gigs" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">My Gigs</h2>
              <Link
                href="/create-service"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Gig</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Views</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myGigs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-4 px-4 text-center text-gray-600">
                        No gigs found.
                      </td>
                    </tr>
                  ) : (
                    myGigs.map((gig) => (
                      <tr key={gig._id} className="border-b border-gray-100">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                           <Image
  src={gig.image || "/placeholder.jpg"}
  alt={gig.title || "Untitled Gig"}
  width={48}
  height={48}
  className="rounded-lg mr-3"
/>
                            <div>
                              <h3 className="font-medium text-gray-900 line-clamp-1">{gig.title || "Untitled Gig"}</h3>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium">₹{gig.price || 0}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span>
                              {gig.rating || 0} ({gig.reviews || 0})
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span>{(gig.views || 0).toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span>{gig.orders || 0}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              gig.status
                            )}`}
                          >
                            {gig.status || "Unknown"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Link
                              href={`/edit-gig/${gig._id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button className="text-red-600 hover:text-red-800">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">Order Management</h2>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-gray-600">No orders found.</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                       <Image
  src={order.buyer?.avatar || "/default-avatar.jpg"}
  alt={order.buyer?.name || "Unknown"}
  width={48}
  height={48}
  className="rounded-full mr-4"
/>
                        <div>
                          <h3 className="font-medium text-gray-900">{order.title || "Untitled Order"}</h3>
                          <p className="text-sm text-gray-600">
                            {user.id === order.sellerId ? `Buyer: ${order.buyer?.name || "Unknown"}` : `Seller: ${order.seller?.name || "Unknown"}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{order.price || 0}</p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status?.replace("_", " ") || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Deadline: {order.deadline ? new Date(order.deadline).toLocaleDateString() : "Not specified"}
                      </span>
                      <div className="flex space-x-2">
                        {user.id === order.sellerId && order.status === "pending" && (
                          <button
                            onClick={() => handleDeliverOrder(order._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Deliver Order
                          </button>
                        )}
                        <Link
                          href={`/chat/${order.gigId}/${user.id === order.sellerId ? order.buyerId : order.sellerId}`}
                          className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {user.id === order.sellerId ? "Message Buyer" : "Message Seller"}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">Analytics & Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">Earnings Overview</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-16 w-16" />
                  <span className="ml-2">Chart placeholder</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">Order Trends</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <TrendingUp className="h-16 w-16" />
                  <span className="ml-2">Chart placeholder</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
