
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Clock } from "lucide-react";
import jwt from "jsonwebtoken";
import Image from "next/image";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
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

    // Fetch conversations
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching conversations for userId:", user.id);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading conversations...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Your Conversations</h2>
          {conversations.length === 0 ? (
            <p className="text-gray-600">No conversations found.</p>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <Link
                  key={`${conv.gigId}-${conv.otherUserId || "broadcast"}`}
                  href={`/chat/${conv.gigId}/${user.id === conv.otherUserId ? user.id : conv.otherUserId || user.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Image
  src={conv.otherUserAvatar}
  alt={conv.otherUserName}
  width={40} // w-10 = 40px
  height={40} // h-10 = 40px
  className="rounded-full mr-3"
/>
                    <div>
                      <h3 className="font-medium text-gray-900">{conv.otherUserName}</h3>
                      <p className="text-sm text-gray-600">{conv.gigTitle}</p>
                      <p className="text-sm text-gray-500 truncate max-w-md">{conv.latestMessage.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {conv.unreadCount > 0 && (
                      <span className="bg-green-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                    <span className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(conv.latestMessage.timestamp).toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
