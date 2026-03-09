"use client";

import { useEffect, useRef } from "react";

interface ScreenPreviewProps {
  stream: MediaStream | null;
  isCapturing: boolean;
}

export default function ScreenPreview({ stream, isCapturing }: ScreenPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-medium text-white/50">Screen Preview</span>
        </div>
        {isCapturing && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 status-pulse" style={{ boxShadow: "0 0 6px rgba(239,68,68,0.6)" }} />
            <span className="text-[10px] text-white/40">Live</span>
          </div>
        )}
      </div>

      {/* Video area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Always mounted so the ref is available when stream arrives */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
          style={{ background: "#000", display: isCapturing && stream ? "block" : "none" }}
        />
        {(!isCapturing || !stream) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center screen-placeholder">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/30">No screen shared</p>
            <p className="text-xs text-white/20 mt-1">Click the screen button below to start</p>

            {/* Decorative grid lines */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full"
                  style={{
                    top: `${(i + 1) * 16.666}%`,
                    height: "1px",
                    background: "rgba(255,255,255,0.02)",
                  }}
                />
              ))}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full"
                  style={{
                    left: `${(i + 1) * 16.666}%`,
                    width: "1px",
                    background: "rgba(255,255,255,0.02)",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
