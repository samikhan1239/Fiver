"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import defaultAvatar from "../public/default-avatar.png";

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
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mb-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((message, index) => {
            const senderId = String(message.userId?._id || message.userId || message.senderId);
            const isSent = senderId === String(userId);
            console.log("Rendering message:", { senderId, userId, isSent, message });

            return (
              <div
                key={message._id || index}
                className={`flex ${
                  isSent ? "justify-end pr-2" : "justify-start pl-2"
                } transition-all duration-300 animate-fade-in`}
              >
                <div
                  className={`flex ${
                    isSent ? "flex-row-reverse" : "flex-row"
                  } items-start max-w-[75%] gap-3`}
                >
                  <Image
                    src={message.userId?.avatar || defaultAvatar}
                    alt={
                      message.userId?.name ||
                      (typeof message.userId === "object" && message.userId?.name) ||
                      "User"
                    }
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                    unoptimized
                  />
                  <div
                    className={`p-4 shadow-md ${
                      isSent
                        ? "bg-green-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
                        : "bg-blue-100 text-gray-900 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-semibold">
                        {message.userId?.name ||
                          (typeof message.userId === "object" && message.userId?.name) ||
                          "User"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <div
                      className={`text-xs opacity-70 mt-1 flex items-center ${
                        isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isSent && message.read && (
                        <span className="ml-2 text-green-200">✓ Seen</span>
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
      <form onSubmit={handleSubmit} className="flex gap-3 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-all duration-200 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          Send
        </button>
      </form>
    </div>
  );
}