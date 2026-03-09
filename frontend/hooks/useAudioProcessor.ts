"use client";

import { useCallback, useRef } from "react";

export function useAudioProcessor() {
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);

  /**
   * Start capturing mic audio at 16 kHz and call onChunk with base64 PCM16 chunks.
   * Returns the MediaStream and a stop() function.
   */
  const startMicCapture = useCallback(
    async (onChunk: (base64: string) => void): Promise<{ stream: MediaStream; stop: () => void }> => {
      // 16 kHz matches what Gemini Live API expects
      const ctx = new AudioContext({ sampleRate: 16000 });
      inputCtxRef.current = ctx;

      // Load the AudioWorklet processor
      await ctx.audioWorklet.addModule("/audio-worklet.js");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, "audio-capture-processor");

      workletNode.port.onmessage = (e) => {
        if (e.data.type !== "audio") return;
        const float32: Float32Array = e.data.samples;
        const int16 = float32ToInt16(float32);
        const base64 = arrayBufferToBase64(int16.buffer);
        onChunk(base64);
      };

      source.connect(workletNode);
      // Do NOT connect workletNode to destination — prevents feedback loop

      const stop = () => {
        source.disconnect();
        workletNode.disconnect();
        workletNode.port.close();
        stream.getTracks().forEach((t) => t.stop());
        ctx.close();
        inputCtxRef.current = null;
      };

      return { stream, stop };
    },
    []
  );

  /**
   * Call this inside a user-gesture handler (e.g. clicking Connect) to
   * pre-create and unlock the output AudioContext before audio arrives.
   */
  const initOutputAudio = useCallback(async () => {
    if (!outputCtxRef.current || outputCtxRef.current.state === "closed") {
      outputCtxRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayTimeRef.current = 0;
    }
    if (outputCtxRef.current.state === "suspended") {
      await outputCtxRef.current.resume();
    }
  }, []);

  /**
   * Play a base64-encoded PCM16 chunk received from Gemini (24 kHz, mono).
   */
  const playAudio = useCallback(async (base64: string) => {
    if (!outputCtxRef.current || outputCtxRef.current.state === "closed") {
      outputCtxRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayTimeRef.current = 0;
    }
    const ctx = outputCtxRef.current;

    // Await resume — without this the context stays suspended and plays nothing
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const arrayBuffer = base64ToArrayBuffer(base64);
    const int16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startAt = Math.max(nextPlayTimeRef.current, ctx.currentTime + 0.05);
    source.start(startAt);
    nextPlayTimeRef.current = startAt + audioBuffer.duration;
  }, []);

  return { startMicCapture, initOutputAudio, playAudio };
}

// --- Utilities ---

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return int16;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
