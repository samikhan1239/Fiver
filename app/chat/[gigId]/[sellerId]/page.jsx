"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import jwt from "jsonwebtoken";
import ChatBox from "../../../../components/ChatBox";

export default function Chat() {
  const { gigId, sellerId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Get user from JWT token
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const decoded = jwt.decode(token);
    if (!decoded) {
      setError("Invalid token");
      setLoading(false);
      return;
    }
    setUser(decoded);
  }, [router]);

  // Fetch initial messages and set up WebSocket
  useEffect(() => {
    if (!user || !gigId || !sellerId) return;

    // Fetch initial messages
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?gigId=${gigId}&sellerId=${sellerId}&userId=${user.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await res.json();
        console.log("Fetched initial messages:", data);
        setMessages(data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch messages error:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        setError("Failed to load messages");
        setLoading(false);
      }
    }
    fetchMessages();

    // Set up WebSocket
    const websocket = new WebSocket(`wss://server-ha0p.onrender.com/"?gigId=${gigId}&sellerId=${sellerId}&userId=${user.id}`);
    websocket.onopen = () => {
      console.log("WebSocket connected for user:", user.id);
    };
    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received WebSocket message:", message);
        if (message.error) {
          setError(message.error);
          return;
        }
        // Deduplicate by _id
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) {
            console.log("Duplicate message ignored:", message._id);
            return prev;
          }
          return [...prev, message];
        });
      } catch (err) {
        console.error("WebSocket message parsing error:", err);
        setError("Failed to process incoming message");
      }
    };
    websocket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection failed");
    };
    websocket.onclose = () => {
      console.log("WebSocket closed");
    };
    setWs(websocket);

    return () => {
      console.log("Cleaning up WebSocket");
      websocket.close();
    };
  }, [user, gigId, sellerId]);

  const sendMessage = async (text) => {
    if (!ws || !user || ws.readyState !== WebSocket.OPEN) {
      setError("Cannot send message: Not connected");
      console.error("WebSocket not connected:", { ws, user, readyState: ws?.readyState });
      return;
    }
    const message = {
      gigId,
      senderId: user.id,
      recipientId: user.id === sellerId ? null : sellerId,
      text,
      timestamp: Date.now(),
    };
    console.log("Sending message:", message);
    ws.send(JSON.stringify(message));

    // Save message to MongoDB (no state update here)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(message),
      });
      if (!res.ok) {
        throw new Error("Failed to save message");
      }
      console.log("Message saved to API:", await res.json());
    } catch (err) {
      console.error("Save message error:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError("Failed to save message");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Please log in to access chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading chat...</p>
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
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/gigs" className="hover:text-green-600">
            Gigs
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/gigs/${gigId}`} className="hover:text-green-600">
            Gig
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Chat</span>
        </nav>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Chat with Seller</h2>
        <ChatBox messages={messages} sendMessage={sendMessage} userId={user.id} />
      </div>
    </div>
  );
}