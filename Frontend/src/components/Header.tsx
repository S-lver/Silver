"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  status: "ready" | "offline";
}

export function Header({ theme, onToggleTheme, status }: HeaderProps) {
  const online = status === "ready";

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="wordmarkSilver" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#E0E0E0" />
              <stop offset="30%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#9E9E9E" />
              <stop offset="100%" stopColor="#525252" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="14" stroke="url(#wordmarkSilver)" strokeWidth="1.5" />
          <path d="M16 6 L16 14 L20 18 L16 22 L12 18 L16 14"
            stroke="url(#wordmarkSilver)" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="16" cy="16" r="1.75" fill="url(#wordmarkSilver)" />
        </svg>
        <span className="text-[16px] font-medium tracking-tight text-[var(--text-primary)]">
          Silver
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <motion.span
            className="inline-block h-[6px] w-[6px] rounded-full"
            style={{
              background: online
                ? "linear-gradient(135deg,#E0E0E0,#FFFFFF,#9E9E9E)"
                : "#525252",
              boxShadow: online
                ? "0 0 8px rgba(224,224,224,0.5)"
                : "none",
            }}
            animate={
              online ? { opacity: [1, 0.55, 1] } : { opacity: 1 }
            }
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
          <span className="text-[12px] font-normal tracking-silk text-[var(--text-secondary)]">
            {online ? "Ready" : "Offline"}
          </span>
        </div>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}