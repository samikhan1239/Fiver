// Chat.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import jwt from "jsonwebtoken";
import ChatBox from "../../../../components/ChatBox";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function Chat() {
  const { gigId, sellerId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user || !gigId || !sellerId) return;

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
        setTimeout(connectWebSocket, 3000);
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
      const wsMessage = {
        gigId: gigId.toString(),
        senderId: user.id.toString(),
        recipientId: user.id === sellerId ? null : sellerId.toString(),
        text,
        timestamp: Date.now(),
      };
      console.log("Preparing to send WebSocket message:", wsMessage);
      ws.send(JSON.stringify(wsMessage));
      console.log("Sent WebSocket message:", wsMessage);

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
      }, 100);
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="border-0 bg-red-800/50 backdrop-blur-sm rounded-xl">
          <CardContent className="p-6">
            <p className="text-red-300 text-center font-medium flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Please log in to access chat
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="border-0 bg-gray-800/90 backdrop-blur-sm rounded-xl">
          <CardContent className="p-6">
            <p className="text-teal-300 text-lg font-medium flex items-center gap-2">
              <MessageCircle className="h-5 w-5 animate-pulse" />
              Loading chat...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="border-0 bg-red-800/50 backdrop-blur-sm rounded-xl">
          <CardContent className="p-6">
            <p className="text-red-300 text-center font-medium flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <nav className="p-4 sm:p-6 bg-gray-800/95 border-b border-gray-700/50 flex items-center">
        <Link href="/messages" className="text-teal-300 hover:text-teal-400 transition-colors mr-4">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Chat with Seller
        </h2>
      </nav>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <ChatBox messages={messages} sendMessage={sendMessage} userId={user.id} />
      </div>
    </div>
  );
}