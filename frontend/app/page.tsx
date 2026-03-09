"use client";

import { useCallback, useRef, useState } from "react";
import Header from "@/components/Header";
import ScreenPreview from "@/components/ScreenPreview";
import ConversationPanel from "@/components/ConversationPanel";
import ControlBar from "@/components/ControlBar";
import { useGeminiSession } from "@/hooks/useGeminiSession";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { useAudioProcessor } from "@/hooks/useAudioProcessor";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export default function Home() {
  const [mode, setMode] = useState<"meeting" | "learning" | "interview">("learning");
  const [micActive, setMicActive] = useState(false);
  const [speakerActive, setSpeakerActive] = useState(true);

  const micStreamRef = useRef<MediaStream | null>(null);
  const stopMicRef = useRef<(() => void) | null>(null);

  const { playAudio, startMicCapture, initOutputAudio } = useAudioProcessor();

  const handleAudio = useCallback(
    (base64: string) => {
      if (speakerActive) playAudio(base64);
    },
    [speakerActive, playAudio]
  );

  const { connect, disconnect, sendAudio, sendScreen, sendText, addUserTranscript, isConnected, messages, status } =
    useGeminiSession(handleAudio, mode);

  const { start: startSpeechRecognition, stop: stopSpeechRecognition } =
    useSpeechRecognition(addUserTranscript);

  const { isCapturing, startCapture, stopCapture, previewStream } = useScreenCapture();

  // Toggle screen share
  const handleScreenToggle = useCallback(async () => {
    if (isCapturing) {
      stopCapture();
    } else {
      await startCapture(sendScreen);
    }
  }, [isCapturing, startCapture, stopCapture, sendScreen]);

  // Toggle microphone
  const handleMicToggle = useCallback(async () => {
    if (micActive) {
      stopSpeechRecognition();
      stopMicRef.current?.();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      stopMicRef.current = null;
      setMicActive(false);
    } else {
      const { stream, stop } = await startMicCapture(sendAudio);
      micStreamRef.current = stream;
      stopMicRef.current = stop;
      startSpeechRecognition();
      setMicActive(true);
    }
  }, [micActive, startMicCapture, sendAudio]);

  // Connect/disconnect
  const handleConnect = useCallback(async () => {
    if (isConnected) {
      disconnect();
      if (micActive) handleMicToggle();
      if (isCapturing) stopCapture();
    } else {
      // Init AudioContext during this user gesture so it's unlocked for playback
      await initOutputAudio();
      connect();
    }
  }, [isConnected, connect, disconnect, micActive, handleMicToggle, isCapturing, stopCapture, initOutputAudio]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header status={status} isConnected={isConnected} mode={mode} onModeChange={setMode} />

      <main className="flex flex-1 gap-3 p-3 overflow-hidden">
        {/* Left: Screen preview */}
        <div className="flex-1 min-w-0">
          <ScreenPreview stream={previewStream} isCapturing={isCapturing} />
        </div>

        {/* Right: Conversation */}
        <div className="w-[360px] flex-shrink-0">
          <ConversationPanel messages={messages} onSendText={sendText} isConnected={isConnected} />
        </div>
      </main>

      <ControlBar
        isConnected={isConnected}
        isCapturing={isCapturing}
        micActive={micActive}
        speakerActive={speakerActive}
        onConnect={handleConnect}
        onScreenToggle={handleScreenToggle}
        onMicToggle={handleMicToggle}
        onSpeakerToggle={() => setSpeakerActive((v) => !v)}
      />
    </div>
  );
}
