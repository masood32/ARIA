"use client";

type Mode = "meeting" | "learning" | "interview";

interface HeaderProps {
  status: string;
  isConnected: boolean;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

const MODES: { value: Mode; label: string }[] = [
  { value: "learning", label: "Learning" },
  { value: "meeting", label: "Meeting" },
  { value: "interview", label: "Interview" },
];

export default function Header({ status, isConnected, mode, onModeChange }: HeaderProps) {
  return (
    <header className="glass-panel mx-3 mt-3 rounded-2xl px-5 py-3 flex items-center justify-between flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              boxShadow: "0 0 16px rgba(139, 92, 246, 0.4)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
              <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-gradient">ARIA</h1>
          <p className="text-[10px] text-white/40 -mt-0.5">AI Real-time Assistant</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: mode === m.value ? "rgba(255,255,255,0.1)" : "transparent",
              color: mode === m.value ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              border: mode === m.value ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? "status-pulse" : ""}`}
          style={{
            background: isConnected ? "#22c55e" : "rgba(255,255,255,0.2)",
            boxShadow: isConnected ? "0 0 8px rgba(34, 197, 94, 0.6)" : "none",
          }}
        />
        <span className="text-xs text-white/50">{status}</span>
      </div>
    </header>
  );
}
