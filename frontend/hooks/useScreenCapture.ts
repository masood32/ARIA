"use client";

import { useCallback, useRef, useState } from "react";

export function useScreenCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCapture = useCallback(
    async (onFrame: (base64jpeg: string) => void) => {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 2, max: 2 } },
        audio: false,
      });

      streamRef.current = stream;
      setPreviewStream(stream);

      // Hidden video element to read frames from
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      videoRef.current = video;

      const canvas = document.createElement("canvas");
      canvasRef.current = canvas;

      setIsCapturing(true);

      // Capture a frame every second and send to backend
      intervalRef.current = setInterval(() => {
        if (!video.videoWidth || !video.videoHeight) return;

        // Scale down to max 1280 wide to keep payload manageable
        const scale = Math.min(1, 1280 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              const base64 = dataUrl.split(",")[1];
              onFrame(base64);
            };
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.75
        );
      }, 1000);

      // Stop when the user ends the screen share via browser UI
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopCapture();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setPreviewStream(null);
    setIsCapturing(false);
  }, []);

  return { isCapturing, previewStream, startCapture, stopCapture };
}
