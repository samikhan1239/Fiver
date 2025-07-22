"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Star, ArrowRight, CheckCircle, Clock, Award } from "lucide-react";
import jwt from "jsonwebtoken";
import Image from "next/image";

export default function Home() {
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Memoize token and user
  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  const categories = [
    { name: "Graphics & Design", icon: "🎨", color: "bg-purple-500" },
    { name: "Digital Marketing", icon: "📱", color: "bg-blue-500" },
    { name: "Writing & Translation", icon: "✍️", color: "bg-green-500" },
    { name: "Video & Animation", icon: "🎬", color: "bg-red-500" },
    { name: "Music & Audio", icon: "🎵", color: "bg-yellow-500" },
    { name: "Programming & Tech", icon: "💻", color: "bg-indigo-500" },
    { name: "Data", icon: "📊", color: "bg-pink-500" },
    { name: "Business", icon: "💼", color: "bg-teal-500" },
  ];

  useEffect(() => {
    const fetchAllServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/gigs", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch gigs: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setAllServices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch all services error:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        setError(err.message || "Failed to load services");
      } finally {
        setLoading(false);
      }
    };

    fetchAllServices();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find the perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                freelance services
              </span>
              for your business
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
              Work with talented people at the most affordable prices to get the most done for your business
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Try 'building mobile app'"
                  className="w-full px-6 py-4 pl-6 pr-16 text-gray-900 text-lg rounded-lg border-0 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/20"
                />
                <button className="absolute right-2 top-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
                  Search
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-white/10 px-4 py-2 rounded-full">Popular:</span>
              <Link href="/browse?category=logo-design" className="hover:text-yellow-300 transition-colors">
                Logo Design
              </Link>
              <Link href="/browse?category=wordpress" className="hover:text-yellow-300 transition-colors">
                WordPress
              </Link>
              <Link href="/browse?category=voice-over" className="hover:text-yellow-300 transition-colors">
                Voice Over
              </Link>
              <Link href="/browse?category=video-editing" className="hover:text-yellow-300 transition-colors">
                Video Editing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why choose our marketplace?</h2>
            <p className="text-xl text-gray-600">The best place to find quality freelance services</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Work</h3>
              <p className="text-gray-600">Get access to skilled professionals who deliver quality work on time</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Most services are delivered within 24-48 hours</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">Your payment is safe with our secure escrow system</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Browse services by category</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/browse?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group"
              >
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border">
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mb-4 text-2xl`}>
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">All Services</h2>
            <Link href="/browse" className="text-green-600 hover:text-green-700 font-medium flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center text-gray-600">Loading services...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : allServices.length === 0 ? (
            <div className="text-center text-gray-600">No services available.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allServices.map((service) => (
                <Link key={service.id} href={`/gigs/${service.id}`} className="group">
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border">
                    <div className="relative">
                     <Image
  src={
    service.image ||
    "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=300"
  }
  alt={service.title}
  width={800} // Set to match your layout; adjust as needed
  height={192} // h-48 = 192px
  className="w-full h-48 object-cover rounded-t-lg"
/>
                      <div className="absolute top-3 right-3 bg-black/20 text-white px-2 py-1 rounded text-sm">
                        ❤️
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center mb-2">
                       <Image
  src={
    service.sellerAvatar ||
    "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop"
  }
  alt={service.seller || "Unknown"}
  width={24} // w-6 = 24px
  height={24} // h-6 = 24px
  className="rounded-full mr-2"
/>
                        <span className="text-sm font-medium text-gray-700">{service.seller || "Unknown"}</span>
                      </div>

                      <h3 className="font-medium text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                        {service.title}
                      </h3>

                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{service.rating || "4.9"} ({service.reviews || "2847"})</span>
                      </div>

                      <div className="flex items-center mb-2 text-sm text-gray-500">
                        <span>Delivery: {service.packages?.basic?.delivery || "N/A"} days</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Starting at</span>
                        <span className="font-bold text-gray-900">₹{service.packages?.basic?.price || service.price || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Join millions of people who use our platform to make their dreams come true
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href={user ? "/dashboard" : "/auth/login"}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}