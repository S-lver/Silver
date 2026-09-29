"use client";

import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/lib/silver-tokens";

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "dark" | "light";
  onToggle: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2, ease: [0.34, 1.4, 0.64, 1] }}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition-colors"
      style={{
        background: "var(--bubble-bot)",
        borderColor: "var(--border-glass)",
      }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: isDark ? 14 : -14, opacity: 0, rotate: isDark ? -60 : 60 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: isDark ? -14 : 14, opacity: 0, rotate: isDark ? 60 : -60 }}
          transition={{ duration: 0.32, ease: EASE.silver }}
          className="absolute flex items-center justify-center"
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}