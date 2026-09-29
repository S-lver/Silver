"use client";

import { motion } from "framer-motion";
import { fadeUp, pillHover } from "@/lib/motion";
import { SILVER } from "@/lib/silver-tokens";

const SUGGESTIONS = [
  { label: "Explain quantum computing", prompt: "Explain quantum computing simply" },
  { label: "Weather update", prompt: "What's the weather like?" },
  { label: "Fun fact", prompt: "Tell me a fun fact" },
  { label: "Write a poem", prompt: "Help me write a poem" },
];

export function Welcome({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    >
      {/* Silver mark — SVG droplet */}
      <motion.div
        className="mb-6"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
      >
        <svg width="52" height="52" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="silverMark" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#E0E0E0" />
              <stop offset="30%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#9E9E9E" />
              <stop offset="100%" stopColor="#525252" />
            </linearGradient>
          </defs>
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="url(#silverMark)"
            strokeWidth="1.25"
          />
          <path
            d="M16 6 L16 14 L20 18 L16 22 L12 18 L16 14"
            stroke="url(#silverMark)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="16" r="1.75" fill="url(#silverMark)" />
        </svg>
      </motion.div>

      <h1 className="text-silver-gradient mb-2 text-[34px] font-semibold tracking-tightest">
        Silver
      </h1>
      <p className="mb-8 text-[15px] font-light tracking-tight text-[var(--text-secondary)]">
        How can I help you today?
      </p>

      <div className="flex max-w-[520px] flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s.label}
            variants={pillHover}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            onClick={() => onPick(s.prompt)}
            className="group relative overflow-hidden rounded-full border px-4 py-2 text-[13px] font-medium tracking-tight transition-colors"
            style={{
              background: "var(--bubble-bot)",
              borderColor: "var(--border-glass)",
              color: "var(--text-secondary)",
            }}
          >
            {/* Hover shine sweep */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
              style={{
                background: SILVER.hairline,
                transform: "skewX(-20deg)",
              }}
            />
            <span className="relative">{s.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

