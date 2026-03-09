"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

export function useGeminiSession(onAudio: (base64: string) => void, mode: "meeting" | "learning" | "interview" = "learning") {
  const wsRef = useRef<WebSocket | null>(null);
  const onAudioRef = useRef(onAudio);
  useEffect(() => { onAudioRef.current = onAudio; }, [onAudio]);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("Disconnected");

  const addMessage = useCallback((role: Message["role"], content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) return;

    const ws = new WebSocket(`ws://localhost:8000/ws?mode=${mode}`);
    wsRef.current = ws;
    setStatus("Connecting...");

    ws.onopen = () => {
      setIsConnected(true);
      setStatus("Connected");
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus("Disconnected");
      wsRef.current = null;
    };

    ws.onerror = () => {
      setStatus("Connection error");
    };

    ws.onmessage = (e) => {
      let data: { type: string; [key: string]: unknown };
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }

      switch (data.type) {
        case "audio":
          onAudioRef.current(data.data as string);
          break;
        case "transcript":
          addMessage(data.role as "user" | "assistant", data.content as string);
          break;
        case "status":
          setStatus(data.message as string);
          if (data.connected) {
            addMessage("system", data.message as string);
          }
          break;
        case "error":
          setStatus(`Error: ${data.message as string}`);
          addMessage("system", `Error: ${data.message as string}`);
          break;
      }
    };
  }, [addMessage, mode]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendAudio = useCallback((base64: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "audio", data: base64 }));
    }
  }, []);

  const sendScreen = useCallback((base64: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "screen", data: base64 }));
    }
  }, []);

  const sendText = useCallback(
    (content: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "text", content }));
        addMessage("user", content);
      }
    },
    [addMessage]
  );

  const addUserTranscript = useCallback((text: string) => {
    addMessage("user", text);
  }, [addMessage]);

  return { connect, disconnect, sendAudio, sendScreen, sendText, addUserTranscript, isConnected, messages, status };
}
