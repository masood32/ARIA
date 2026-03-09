"use client";

import { useCallback, useRef } from "react";

/**
 * Browser Web Speech API for real-time user speech transcription.
 * Runs alongside the AudioWorklet (both can capture the same mic stream).
 */
export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const rec = new SpeechRecognitionAPI();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) onTranscript(text);
        }
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore no-speech errors (normal silence periods)
      if (event.error !== "no-speech") {
        console.warn("SpeechRecognition error:", event.error);
      }
    };

    rec.onend = () => {
      // Auto-restart to keep listening continuously
      if (recognitionRef.current === rec) {
        try { rec.start(); } catch { /* already stopped */ }
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, [onTranscript]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null; // prevent onend restart
      rec.stop();
    }
  }, []);

  return { start, stop };
}
