"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Star, ArrowRight, Zap, Shield, Award, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import jwt from "jsonwebtoken";
import { useRouter } from "next/navigation";

export default function Home() {
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  // Memoize token and user
  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  const heroSlides = [
    {
      title: "Unleash Your Creative Potential",
      subtitle: "Connect with world-class freelancers and bring your wildest ideas to life.",
      bg: "from-teal-400 via-cyan-500 to-blue-500",
    },
    {
      title: "Transform Ideas Into Reality",
      subtitle: "Join millions who trust our platform to turn dreams into digital masterpieces.",
      bg: "from-emerald-400 via-teal-500 to-cyan-600",
    },
    {
      title: "Build Tomorrow, Today",
      subtitle: "Access cutting-edge talent and revolutionary services that define the future.",
      bg: "from-indigo-500 via-purple-500 to-pink-500",
    },
  ];

  const categories = [
    { name: "Graphics & Design", icon: "🎨", count: "1.2M+", color: "from-coral-400 to-red-500" },
    { name: "Digital Marketing", icon: "📱", count: "800K+", color: "from-teal-400 to-cyan-500" },
    { name: "Writing & Translation", icon: "✍️", count: "950K+", color: "from-lime-400 to-green-500" },
    { name: "Video & Animation", icon: "🎬", count: "600K+", color: "from-orange-400 to-red-500" },
    { name: "Music & Audio", icon: "🎵", count: "400K+", color: "from-purple-400 to-pink-500" },
    { name: "Programming & Tech", icon: "💻", count: "1.5M+", color: "from-blue-400 to-indigo-500" },
    { name: "Data", icon: "📊", count: "700K+", color: "from-pink-400 to-purple-500" },
    { name: "Business", icon: "💼", count: "300K+", color: "from-emerald-400 to-teal-500" },
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
  
  

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${heroSlides[currentSlide].bg} transition-all duration-1000 ease-in-out`}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-coral-400/20 to-orange-400/20 rounded-full blur-xl animate-bounce" />
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-lime-400/30 to-green-400/30 rotate-45 animate-spin-slow" />
          <div className="absolute bottom-32 left-40 w-40 h-40 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-white/10 rounded-full animate-ping" />
          <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg rotate-12 animate-float" />
          <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-float-delayed" />
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-5xl mx-auto text-center text-white">
            <Badge className="bg-gradient-to-r from-coral-400/20 to-orange-400/20 text-coral-300 border-coral-400/30 mb-8 text-lg px-6 py-3 backdrop-blur-sm">
              ✨ The Future of Freelancing
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                {heroSlides[currentSlide].title}
              </span>
            </h1>
            <p className="text-xl md:text-3xl mb-12 text-gray-200 max-w-4xl mx-auto font-light">
              {heroSlides[currentSlide].subtitle}
            </p>
            <div className="max-w-3xl mx-auto mb-12">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Discover amazing services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 pl-8 pr-20 text-lg rounded-full border-0 bg-white/95 backdrop-blur-sm shadow-2xl text-gray-900 placeholder:text-gray-500"
                  />
                  <Button
                    size="lg"
                    className="absolute right-2 top-2 h-12 px-8 rounded-full bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 shadow-lg"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-teal-200 mb-6 text-lg">🔥 Trending Now:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {["Logo Design", "WordPress", "Voice Over", "Video Editing"].map((tag, index) => (
                <Badge
                  key={tag}
                  className={`bg-gradient-to-r ${categories[index]?.color || "from-teal-400 to-cyan-500"} text-white border-0 hover:scale-110 transition-all duration-300 cursor-pointer px-4 py-2 text-sm font-semibold shadow-lg`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-gradient-to-r from-teal-400 to-cyan-400 scale-125"
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-coral-500/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Trusted by Industry Leaders
            </h3>
          </div>
          <div className="flex justify-center items-center space-x-16 opacity-70">
            {["Meta", "Google", "Netflix", "Tesla", "Apple"].map((company, index) => (
              <div
                key={company}
                className={`text-3xl font-black bg-gradient-to-r ${categories[index]?.color || "from-white to-gray-300"} bg-clip-text text-transparent hover:scale-110 transition-all duration-300`}
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-gray-900 to-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-lime-400/20 to-green-400/20 text-lime-300 border-lime-400/30 mb-6 px-4 py-2">
              🚀 Explore Categories
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Discover Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-coral-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Perfect Match
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Dive into a universe of creative possibilities with our cutting-edge service categories
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/browse?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group"
              >
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm hover:scale-105 transition-all duration-500">
                  <div
                    className={`absolute -inset-1 bg-gradient-to-r ${category.color} rounded-lg blur opacity-0 group-hover:opacity-30 transition-all duration-500`}
                  ></div>
                  <CardContent className="relative p-8 text-center">
                    <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-500">
                      {category.icon}
                    </div>
                    <h3 className="font-bold text-white mb-3 text-lg group-hover:text-teal-300 transition-colors duration-300">
                      {category.name}
                    </h3>
                    <p
                      className={`text-sm bg-gradient-to-r ${category.color} bg-clip-text text-transparent font-semibold`}
                    >
                      {category.count} services
                    </p>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-coral-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700"></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(20,184,166,0.1),transparent_60%,rgba(251,146,60,0.1),transparent_100%)]"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-coral-500/20 to-orange-500/20 rounded-full px-6 py-3 mb-6 backdrop-blur-sm border border-coral-500/30">
              <Sparkles className="w-5 h-5 text-coral-400" />
              <span className="text-coral-300 font-semibold">Featured Services</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-white via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                Handpicked
              </span>
              <br />
              <span className="bg-gradient-to-r from-coral-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Excellence
              </span>
            </h2>
          </div>
          {loading ? (
            <div className="text-center text-gray-300">Loading services...</div>
          ) : error ? (
            <div className="text-center text-red-400">{error}</div>
          ) : allServices.length === 0 ? (
            <div className="text-center text-gray-300">No services available.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allServices.slice(0,3).map((service) => (
                <Link key={service.id} href={`/gigs/${service.id}`} className="group">
                  <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:scale-105 transition-all duration-500">
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r ${categories[0].color} rounded-xl blur opacity-0 group-hover:opacity-50 transition-all duration-500`}
                    ></div>
                    <div className="relative">
                      <div className="relative overflow-hidden">
                       <Image
  src={
    service.image ||
    "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=300"
  }
  alt={service.title}
  width={300}
  height={192}
  className="w-full h-48 object-contain group-hover:scale-110 transition-transform duration-500"
/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <Badge
                          className={`absolute top-3 left-3 bg-gradient-to-r ${categories[0].color} text-white border-0 shadow-lg`}
                        >
                          Featured
                        </Badge>
                        <div className="absolute top-3 right-3 w-3 h-3 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                      </div>
                      <CardContent className="p-6 relative">
                        <div className="flex items-center mb-4">
                          <Image
                            src={
                              service.sellerAvatar ||
                              "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop"
                            }
                            alt={service.seller || "Unknown"}
                            width={40}
                            height={40}
                            className={`w-10 h-10 bg-gradient-to-r ${categories[0].color} rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 shadow-lg`}
                          />
                          <span className="text-gray-300 font-medium">{service.seller || "Unknown"}</span>
                        </div>
                        <h3 className="font-bold text-white mb-4 line-clamp-2 group-hover:text-teal-300 transition-colors duration-300">
                          {service.title}
                        </h3>
                        <div className="flex items-center mb-4">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm font-semibold text-white">{service.rating || "4.9"}</span>
                          <span className="text-sm text-gray-400 ml-1">({service.reviews || "2847"})</span>
                        </div>
                        <div className="flex items-center mb-4 text-sm text-gray-400">
                          <span>Delivery: {service.packages?.basic?.delivery || "N/A"} days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Starting at</span>
                          <span
                            className={`text-2xl font-black bg-gradient-to-r ${categories[0].color} bg-clip-text text-transparent`}
                          >
                            ₹{service.packages?.basic?.price || service.price || "N/A"}
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.15),transparent_70%)]"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-lime-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
                Why We&apos;re
              </span>
              <br />
              <span className="bg-gradient-to-r from-coral-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Different
              </span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Speed",
                desc: "Most services are delivered within 24-48 hours",
                color: "from-yellow-400 to-orange-500",
                bg: "from-yellow-500/20 to-orange-500/20",
              },
              {
                icon: Shield,
                title: "Secure Payment",
                desc: "Your payment is safe with our secure escrow system",
                color: "from-teal-400 to-cyan-500",
                bg: "from-teal-500/20 to-cyan-500/20",
              },
              {
                icon: Award,
                title: "Quality Work",
                desc: "Get access to skilled professionals who deliver quality work on time",
                color: "from-purple-400 to-pink-500",
                bg: "from-purple-500/20 to-pink-500/20",
              },
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <div
                  className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-all duration-500`}
                ></div>
                <Card
                  className={`relative border-0 bg-gradient-to-br ${feature.bg} backdrop-blur-sm hover:scale-105 transition-all duration-500 overflow-hidden`}
                >
                  <CardContent className="p-8 text-center relative">
                    <div
                      className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-2xl`}
                    >
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-teal-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">{feature.desc}</p>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500"></div>
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-coral-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-lime-500/20 to-green-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/20 rounded-full animate-spin-slow"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <Badge className="bg-white/20 text-white border-white/30 mb-8 text-lg px-6 py-3 backdrop-blur-sm">
            🎯 Ready to Launch?
          </Badge>
          <h2 className="text-5xl md:text-7xl font-black mb-8 text-white leading-tight">
            Start Your
            <br />
            <span className="bg-gradient-to-r from-coral-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Success Story
            </span>
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-teal-100 max-w-3xl mx-auto">
            Join millions of people who use our platform to make their dreams come true
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-12 py-6 text-xl font-bold shadow-2xl shadow-coral-500/30 hover:scale-105 transition-all duration-300"
            >
              Get Started
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-teal-600 px-12 py-6 text-xl font-bold bg-transparent backdrop-blur-sm hover:scale-105 transition-all duration-300"
            >
              Start Selling
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-black via-gray-900 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(20,184,166,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <h3 className="text-4xl font-black bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
                FreelanceHub
              </h3>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                The future of freelancing is here. Connect, create, and conquer with the world&apos;s most advanced talent
                marketplace.
              </p>
              <div className="flex space-x-6">
                {["F", "T", "I", "L"].map((social, index) => (
                  <div
                    key={social}
                    className={`w-12 h-12 bg-gradient-to-r ${categories[index]?.color || "from-teal-400 to-cyan-500"} rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg font-bold`}
                  >
                    {social}
                  </div>
                ))}
              </div>
            </div>
            {[
              {
                title: "Categories",
                items: categories.map((c) => c.name),
                color: "from-coral-400 to-red-500",
              },
              {
                title: "Company",
                items: ["About Us", "Careers", "Press", "Blog"],
                color: "from-teal-400 to-cyan-500",
              },
              {
                title: "Support",
                items: ["Help Center", "Community", "Contact Us", "Trust & Safety"],
                color: "from-lime-400 to-green-500",
              },
            ].map((column) => (
              <div key={column.title}>
                <h4 className={`font-bold mb-6 text-xl bg-gradient-to-r ${column.color} bg-clip-text text-transparent`}>
                  {column.title}
                </h4>
                <ul className="space-y-3">
                  {column.items.map((item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-2 inline-block"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-16 pt-8 text-center">
            <p className="text-gray-400 text-lg">
              © 2025 FreelanceHub. Revolutionizing creativity, one project at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}