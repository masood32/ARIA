"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/hooks/useGeminiSession";

interface ConversationPanelProps {
  messages: Message[];
  onSendText: (text: string) => void;
  isConnected: boolean;
}

export default function ConversationPanel({ messages, onSendText, isConnected }: ConversationPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !isConnected) return;
    onSendText(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-xs font-medium text-white/50">Conversation</span>
        {messages.length > 0 && (
          <span className="ml-auto text-[10px] text-white/25">{messages.length} messages</span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(99,160,246,0.8)" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
                <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs font-medium text-white/30">ARIA is watching</p>
            <p className="text-[11px] text-white/20 mt-1 leading-relaxed">
              Connect and share your screen to get real-time guidance
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))
        )}
      </div>

      {/* Text input */}
      <div className="p-3 flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Ask ARIA anything..." : "Connect to start..."}
            disabled={!isConnected}
            className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: isConnected && input.trim() ? "rgba(59,130,246,0.8)" : "rgba(255,255,255,0.05)",
              cursor: isConnected && input.trim() ? "pointer" : "default",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-white/25 px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 animate-fade-in ${isUser ? "items-end" : "items-start"}`}>
      <span className="text-[10px] text-white/30 px-1">{isUser ? "You" : "ARIA"}</span>
      <div
        className="max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
        style={
          isUser
            ? {
                background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.25)",
                color: "rgba(255,255,255,0.85)",
                borderBottomRightRadius: "6px",
              }
            : {
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
                borderBottomLeftRadius: "6px",
              }
        }
      >
        {message.content}
      </div>
      <span className="text-[9px] text-white/20 px-1">
        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}
