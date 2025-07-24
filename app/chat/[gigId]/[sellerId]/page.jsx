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
      router.push("/login");
      return;
    }
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.id) {
        setError("Invalid token");
        setLoading(false);
        return;
      }
      setUser(decoded);
    } catch (err) {
      console.error("JWT decode error:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError("Invalid token");
      setLoading(false);
    }
  }, [router]);

  // Fetch initial messages and set up WebSocket
  useEffect(() => {
    if (!user || !gigId || !sellerId) return;

    // Fetch initial messages
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?gigId=${gigId}&sellerId=${sellerId}&userId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch messages: ${res.status} ${res.statusText}`);
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

    // Set up WebSocket with reconnection
    const connectWebSocket = () => {
      const websocket = new WebSocket(
        `wss://server-1-v0qz.onrender.com/?gigId=${gigId}&sellerId=${sellerId}&userId=${user.id}`
      );

      websocket.onopen = () => {
        console.log("WebSocket connected for user:", user.id);
        setWs(websocket);
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received WebSocket message:", message);
          if (message.error) {
            setError(message.error);
            return;
          }
          setMessages((prev) => {
            if (message._id && prev.some((m) => m._id === message._id)) {
              console.log("Duplicate message ignored:", message._id);
              return prev;
            }
            return [...prev, { ...message, userId: message.userId || { _id: message.senderId } }];
          });
        } catch (err) {
          console.error("WebSocket message parsing error:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
          });
          setError("Failed to process incoming message");
        }
      };

      websocket.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection failed");
      };

      websocket.onclose = () => {
        console.log("WebSocket closed, attempting to reconnect...");
        setWs(null);
        setTimeout(connectWebSocket, 3000); // Reconnect after 3s
      };

      return websocket;
    };

    const websocket = connectWebSocket();

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

    // Optimistically add message to UI
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      gigId,
      userId: { _id: user.id, name: user.name, avatar: user.avatar },
      senderId: user.id,
      text,
      timestamp: Date.now(),
      read: false,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    console.log("Optimistically added message:", optimisticMessage);

    try {
      // Send message via WebSocket
      const wsMessage = {
        gigId: gigId.toString(), // Ensure string for WebSocket
        senderId: user.id.toString(),
        recipientId: user.id === sellerId ? null : sellerId.toString(),
        text,
        timestamp: Date.now(),
      };
      console.log("Preparing to send WebSocket message:", wsMessage);
      ws.send(JSON.stringify(wsMessage));
      console.log("Sent WebSocket message:", wsMessage);

      // Save message to MongoDB with slight delay
      setTimeout(async () => {
        try {
          const apiPayload = {
            gigId,
            senderId: user.id,
            recipientId: user.id === sellerId ? null : sellerId,
            text,
            timestamp: Date.now(),
          };
          console.log("Preparing to send API payload:", apiPayload);
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(apiPayload),
          });
          const responseData = await res.json();
          if (!res.ok) {
            throw new Error(`Failed to save message: ${res.status} ${responseData.message || responseData.error}`);
          }
          console.log("Message saved to API:", responseData);

          // Replace optimistic message with saved message
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId
                ? { ...responseData, userId: responseData.userId || { _id: responseData.senderId } }
                : msg
            )
          );
        } catch (err) {
          console.error("API save error:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
          });
          setError(err.message);
          setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
        }
      }, 100); // Delay to avoid race condition
    } catch (err) {
      console.error("WebSocket send error:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError(err.message);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
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