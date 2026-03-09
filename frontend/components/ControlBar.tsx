"use client";

interface ControlBarProps {
  isConnected: boolean;
  isCapturing: boolean;
  micActive: boolean;
  speakerActive: boolean;
  onConnect: () => void | Promise<void>;
  onScreenToggle: () => void;
  onMicToggle: () => void;
  onSpeakerToggle: () => void;
}

export default function ControlBar({
  isConnected,
  isCapturing,
  micActive,
  speakerActive,
  onConnect,
  onScreenToggle,
  onMicToggle,
  onSpeakerToggle,
}: ControlBarProps) {
  return (
    <footer className="glass-panel mx-3 mb-3 mt-0 rounded-2xl px-5 py-3 flex items-center justify-between flex-shrink-0">
      {/* Left: spacer to balance layout */}
      <div className="flex-1" />

      {/* Center: all three controls */}
      <div className="flex items-center gap-3">
        <ControlButton
          active={isCapturing}
          onClick={onScreenToggle}
          title={isCapturing ? "Stop screen share" : "Share screen"}
          activeColor="rgba(59,130,246,0.7)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" strokeLinecap="round" />
          </svg>
        </ControlButton>

        <ControlButton
          active={micActive}
          onClick={onMicToggle}
          title={micActive ? "Mute mic" : "Unmute mic"}
          activeColor="rgba(34,197,94,0.7)"
          size="lg"
          inactiveIcon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" strokeLinecap="round" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8" strokeLinecap="round" />
            </svg>
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" />
          </svg>
        </ControlButton>

        <ControlButton
          active={speakerActive}
          onClick={onSpeakerToggle}
          title={speakerActive ? "Mute speaker" : "Unmute speaker"}
          activeColor="rgba(168,85,247,0.7)"
          inactiveIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          }
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
          </svg>
        </ControlButton>
      </div>

      {/* Right: Connect button */}
      <div className="flex-1 flex justify-end">
      <button
        onClick={onConnect}
        className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
        style={
          isConnected
            ? {
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "rgba(252,165,165,0.9)",
              }
            : {
                background: "linear-gradient(135deg, rgba(59,130,246,0.8) 0%, rgba(99,102,241,0.8) 100%)",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "white",
                boxShadow: "0 0 20px rgba(99,102,241,0.3)",
              }
        }
      >
        {isConnected ? "Disconnect" : "Connect ARIA"}
      </button>
      </div>
    </footer>
  );
}

interface ControlButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  activeColor: string;
  children: React.ReactNode;
  inactiveIcon?: React.ReactNode;
  size?: "md" | "lg";
}

function ControlButton({ active, onClick, title, activeColor, children, inactiveIcon, size = "md" }: ControlButtonProps) {
  const dims = size === "lg" ? "w-11 h-11" : "w-9 h-9";
  return (
    <button
      onClick={onClick}
      title={title}
      className={`${dims} rounded-xl flex items-center justify-center transition-all duration-200`}
      style={{
        background: active ? activeColor : "rgba(255,255,255,0.06)",
        border: `1px solid ${active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
        color: active ? "white" : "rgba(255,255,255,0.4)",
        boxShadow: active ? `0 0 12px ${activeColor}` : "none",
      }}
    >
      {active ? children : (inactiveIcon || children)}
    </button>
  );
}
