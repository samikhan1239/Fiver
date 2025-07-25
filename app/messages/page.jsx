"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Clock } from "lucide-react";
import jwt from "jsonwebtoken";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const token = useMemo(() => typeof window !== "undefined" ? localStorage.getItem("token") : null, []);
  const user = useMemo(() => token ? jwt.decode(token) : null, [token]);

  useEffect(() => {
    if (!token || !user || !user.id) {
      console.error("No valid token or user ID found:", { token, user });
      router.push("/auth/login");
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching conversations for userId:", user.id);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`/api/messages/conversations?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Conversations API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Fetched conversations:", data);
        setConversations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch conversations error:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        setError(err.message || "Failed to load conversations");
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchConversations();
  }, [router, token, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <p className="text-teal-300 text-xl">Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <Card className="border-0 bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-red-300 text-center font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-coral-400/20 to-orange-400/20 rounded-full blur-xl animate-bounce" />
        <div className="absolute bottom-32 right-40 w-40 h-40 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse" />
      </div>
      <div className="container mx-auto px-4 py-12 relative">
        <h1 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Messages
        </h1>
        <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Your Conversations
            </h2>
            {conversations.length === 0 ? (
              <p className="text-gray-300">No conversations found.</p>
            ) : (
              <div className="space-y-4">
                {conversations.map((conv) => (
                  <Link
                    key={`${conv.gigId}-${conv.otherUserId || "broadcast"}`}
                    href={`/chat/${conv.gigId}/${user.id === conv.otherUserId ? user.id : conv.otherUserId || user.id}`}
                    className="group flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center">
                      <Image
                        src={conv.otherUserAvatar || "/default-avatar.png"}
                        alt={conv.otherUserName || "User"}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                      <div>
                        <h3 className="font-medium text-gray-300 group-hover:text-teal-300 transition-colors">
                          {conv.otherUserName || "Unknown User"}
                        </h3>
                        <p className="text-sm text-gray-400">{conv.gigTitle || "Untitled Gig"}</p>
                        <p className="text-sm text-gray-500 truncate max-w-md">{conv.latestMessage.text || "No messages yet"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-gradient-to-r from-coral-500 to-orange-500 text-white border-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-400 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(conv.latestMessage.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}