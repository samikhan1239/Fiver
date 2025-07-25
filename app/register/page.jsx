"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Lock } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      console.log("Registration successful:", data);
      router.push("/login");
    } catch (err) {
      console.error("Registration error:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-cyan-500/20">
          <div className="grid-background"></div>
        </div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
        <div className="floating-shape shape-5"></div>
        <div className="floating-shape shape-6"></div>
      </div>

      {/* Animated Wave Lines */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path className="wave-path wave-1" fill="none" stroke="url(#waveGradient)" strokeWidth="2" />
          <path className="wave-path wave-2" fill="none" stroke="url(#waveGradient)" strokeWidth="1.5" />
          <path className="wave-path wave-3" fill="none" stroke="url(#waveGradient)" strokeWidth="1" />
        </svg>
      </div>

      {/* Enhanced Particle System */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-teal-500/40 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Pulsing Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="pulsing-orb orb-1"></div>
        <div className="pulsing-orb orb-2"></div>
        <div className="pulsing-orb orb-3"></div>
      </div>

      

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6">
        <Card className="w-full max-w-lg bg-gray-800/95 border-0 rounded-2xl shadow-2xl backdrop-blur-lg relative overflow-hidden">
          {/* Holographic Border Effect */}
          <div className="absolute -inset-1 bg-teal-500 rounded-2xl blur opacity-20 animate-pulse"></div>

          <CardHeader className="relative text-center pb-8">
            <CardTitle className="text-4xl font-bold text-teal-500">
              Create Your Account
            </CardTitle>
            <p className="text-gray-300 text-base mt-3">Join the freelancing community</p>
          </CardHeader>

          <CardContent className="space-y-8 relative">
            {error && (
              <p className="text-red-300 text-base flex items-center gap-2 justify-center">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <Input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-14 h-14 bg-gray-800/80 border-teal-500/40 text-white placeholder:text-gray-400/80 text-base rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 backdrop-blur-sm"
                  required
                />
              </div>

              {/* Email Field */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <Input
                  type="email"
                  placeholder="@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-14 h-14 bg-gray-800/80 border-teal-500/40 text-white placeholder:text-gray-400/80 text-base rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 backdrop-blur-sm"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-14 h-14 bg-gray-800/80 border-teal-500/40 text-white placeholder:text-gray-400/80 text-base rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 backdrop-blur-sm"
                  required
                />
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-14 bg-teal-500 hover:bg-teal-600 text-white text-base font-bold shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  <span>Register</span>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-6 border-t border-gray-700/40">
              <p className="text-gray-400 text-base">
                Already have an account?{" "}
                <Link href="/login" className="text-teal-500 hover:text-teal-400 font-medium transition-colors">
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}