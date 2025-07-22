"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import ChatBox from "../../components/ChatBox";

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!user) return;
    const websocket = new WebSocket(`ws://${window.location.host}/api/ws`);
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };
    setWs(websocket);
    return () => websocket.close();
  }, [user]);

  const sendMessage = (text) => {
    if (ws && user) {
      const message = { userId: user._id, text, timestamp: Date.now() };
      ws.send(JSON.stringify(message));
    }
  };

  if (!user) {
    return <div className="text-center mt-10">Please login to access chat</div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">Chat</h2>
      <ChatBox messages={messages} sendMessage={sendMessage} />
    </div>
  );
}