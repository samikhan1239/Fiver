"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, MessageCircle, Bell, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import jwt from "jsonwebtoken";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const router = useRouter();

  // Memoize token and user
  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false); // Hide on scroll down
      } else {
        setIsVisible(true); // Show on scroll up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleSignUp = () => {
    router.push("/register");
  };

  return (
    <nav
      className={`sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-teal-500/30 shadow-lg shadow-teal-500/20 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-3xl font-black text-teal-500 drop-shadow-lg">
              TalentSync - Sami
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/gigs"
              className="text-white hover:text-teal-400 transition-all duration-300 font-medium"
            >
              Browse
            </Link>
            <Link
              href="/dashboard"
              className="text-white hover:text-teal-400 transition-all duration-300 font-medium"
            >
              Become a Seller
            </Link>
            <Link href="/messages" className="relative text-white hover:text-teal-400 transition-all duration-300">
              <MessageCircle className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center border-0">
                3
              </Badge>
            </Link>
            <button className="relative text-white hover:text-teal-400 transition-all duration-300">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center border-0">
                2
              </Badge>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 text-white hover:text-teal-400 transition-all duration-300"
              >
                <User className="h-8 w-8 rounded-full ring-2 ring-transparent group-hover:ring-teal-400 transition-all duration-300" />
                <ChevronDown className="h-4 w-4" />
              </button>
              {isProfileOpen && (
                <Card className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-sm border-0 shadow-lg z-50">
                  <div className="absolute -inset-1 bg-teal-500 rounded-lg blur opacity-30"></div>
                  <CardContent className="p-2 relative">
                    <button
                      onClick={handleSignIn}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-black/50 hover:text-teal-400 rounded-md transition-all duration-300"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={handleSignUp}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-black/50 hover:text-teal-400 rounded-md transition-all duration-300"
                    >
                      Sign Up
                    </button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-teal-400 transition-all duration-300"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/90 border-t border-teal-500/30">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/gigs"
              className="block px-3 py-2 text-white hover:bg-black/50 hover:text-teal-400 rounded-md transition-all duration-300"
            >
              Browse
            </Link>
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-white hover:bg-black/50 hover:text-teal-400 rounded-md transition-all duration-300"
            >
              Become a Seller
            </Link>
            <Link
              href="/messages"
              className="block px-3 py-2 text-white hover:bg-black/50 hover:text-teal-400 rounded-md transition-all duration-300"
            >
              Messages
            </Link>
            <button
              onClick={handleSignIn}
              className="block w-full text-left px-3 py-2 text-white hover:bg-black/50 hover:text-teal-400 rounded-md transition-all duration-300"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              className="block w-full text-left px-3 py-2 text-white hover:bg-black/50 hover:text-teal-400 rounded-md transition-all duration-300"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .grid-background {
          background-image: 
            linear-gradient(rgba(20, 184, 166, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20, 184, 166, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(45deg, rgba(20, 184, 166, 0.1), rgba(6, 182, 212, 0.1));
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 120px;
          height: 120px;
          top: 20%;
          right: 15%;
          animation-delay: 1s;
        }

        .shape-3 {
          width: 60px;
          height: 60px;
          bottom: 30%;
          left: 20%;
          animation-delay: 2s;
        }

        .shape-4 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          right: 10%;
          animation-delay: 3s;
        }

        .shape-5 {
          width: 40px;
          height: 40px;
          top: 50%;
          left: 5%;
          animation-delay: 4s;
        }

        .shape-6 {
          width: 90px;
          height: 90px;
          top: 70%;
          right: 25%;
          animation-delay: 5s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(10px) rotate(240deg); }
        }

        .wave-path {
          animation: wave 8s ease-in-out infinite;
        }

        .wave-1 {
          d: path("M0,100 Q250,50 500,100 T1000,100 T1500,100 T2000,100");
          animation-delay: 0s;
        }

        .wave-2 {
          d: path("M0,200 Q300,150 600,200 T1200,200 T1800,200 T2400,200");
          animation-delay: 2s;
        }

        .wave-3 {
          d: path("M0,300 Q200,250 400,300 T800,300 T1200,300 T1600,300");
          animation-delay: 4s;
        }

        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-100px); }
        }

        .pulsing-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20, 184, 166, 0.2), transparent);
          animation: pulse 4s ease-in-out infinite;
        }

        .orb-1 {
          width: 200px;
          height: 200px;
          top: 15%;
          right: 10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 150px;
          height: 150px;
          bottom: 25%;
          left: 15%;
          animation-delay: 1.5s;
        }

        .orb-3 {
          width: 100px;
          height: 100px;
          top: 60%;
          right: 30%;
          animation-delay: 3s;
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.1;
          }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px);
            opacity: 0.4;
          }
          50% { 
            transform: translateY(-20px);
            opacity: 0.8;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;