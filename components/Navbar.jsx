
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, MessageCircle, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import jwt from "jsonwebtoken";
import Image from "next/image";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-teal-500/30 shadow-lg shadow-teal-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-3xl font-black bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
              FreelanceHub
            </span>
          </Link>

        

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/gigs"
              className="text-gray-300 hover:text-teal-400 transition-all duration-300 font-medium"
            >
              Browse
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-coral-400 transition-all duration-300 font-medium"
            >
              Become a Seller
            </Link>
            <Link href="/messages" className="relative text-gray-300 hover:text-lime-400 transition-all duration-300">
              <MessageCircle className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-coral-400 to-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center border-0">
                3
              </Badge>
            </Link>
            <button className="relative text-gray-300 hover:text-lime-400 transition-all duration-300">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-coral-400 to-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center border-0">
                2
              </Badge>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 text-gray-300 hover:text-teal-400 transition-all duration-300"
              >
                <div className="relative">
                  <Image
                    src={
                      user?.avatar ||
                      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop"
                    }
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-transparent group-hover:ring-teal-400 transition-all duration-300"
                  />
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isProfileOpen && (
                <Card className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border-0 shadow-lg z-50">
                  <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg blur opacity-30"></div>
                  <CardContent className="p-2 relative">
                    {user ? (
                      <>
                        <Link
                          href={`/profile/${user.id}`}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                        >
                          Dashboard
                        </Link>
                        <hr className="my-1 border-gray-700" />
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleLogin}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                        >
                          Login
                        </button>
                        <button
                          onClick={handleRegister}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                        >
                          Register
                        </button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-teal-400 transition-all duration-300"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Categories Bar */}
    
   

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gradient-to-br from-gray-800 to-gray-900 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/gigs"
              className="block px-3 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
            >
              Browse
            </Link>
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
            >
              Become a Seller
            </Link>
            <Link
              href="/messages"
              className="block px-3 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
            >
              Messages
            </Link>
            {user ? (
              <>
                <Link
                  href={`/profile/${user.id}`}
                  className="block px-3 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                >
                  Login
                </button>
                <button
                  onClick={handleRegister}
                  className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-teal-400 rounded-md transition-all duration-300"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
