// ChatBox.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Clock } from "lucide-react";

export default function ChatBox({ messages, sendMessage, userId }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log("Messages updated:", messages);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <Card className="flex-1 h-full border-0 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-md">
      <CardContent className="p-4 sm:p-6 h-full flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-500/50 scrollbar-track-gray-800/20 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <Send className="h-14 w-14 text-teal-400/60 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-200 text-xl font-semibold">No messages yet</p>
              <p className="text-gray-400 text-sm mt-2">Start the conversation by sending a message!</p>
            </div>
          ) : (
            messages.map((message) => {
              const senderId = String(message.userId?._id || message.userId || message.senderId);
              const isSent = senderId === String(userId);
              console.log("Rendering message:", {
                messageId: message.messageId,
                _id: message._id,
                senderId,
                userId,
                isSent,
                text: message.text,
                timestamp: message.timestamp,
              });

              return (
                <div
                  key={message.messageId || message._id} // Use messageId or _id
                  className={`flex ${isSent ? "justify-end pr-3" : "justify-start pl-3"} transition-all duration-300 animate-slide-in`}
                >
                  <div
                    className={`flex ${isSent ? "flex-row-reverse" : "flex-row"} items-start max-w-[80%] sm:max-w-[70%] gap-2 group`}
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={message.userId?.avatar || "/default-avatar.png"}
                        alt={
                          message.userId?.name ||
                          (typeof message.userId === "object" && message.userId?.name) ||
                          "User"
                        }
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-600/50 group-hover:ring-teal-400/60 transition-all duration-200"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-teal-400 rounded-full ring-1 ring-gray-800/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <div
                      className={`p-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md ${
                        isSent
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                          : "bg-gray-700/90 text-gray-100"
                      }`}
                    >
                      <p className="text-sm leading-relaxed font-normal">{message.text}</p>
                      <div
                        className={`text-xs opacity-80 mt-1 flex items-center gap-1.5 ${
                          isSent ? "justify-end" : "justify-start"
                        }`}
                      >
                        <Clock className="h-3 w-3 text-gray-300/80" />
                        <span>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isSent && message.read && (
                          <span className="text-teal-300">✓✓ Seen</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-900/80 border border-gray-700/40 rounded-full text-gray-100 placeholder-gray-400/80 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:bg-gray-900/90 transition-all duration-200 shadow-sm"
          />
          <Button
            type="submit"
            disabled={!input.trim()}
            className={`px-4 py-2.5 rounded-full font-medium transition-all duration-200 shadow-sm flex items-center gap-1 text-sm ${
              !input.trim()
                ? "bg-gray-700/50 text-gray-400/80 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white hover:shadow-md"
            }`}
          >
            <Send className="w-4 h-4" />
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}