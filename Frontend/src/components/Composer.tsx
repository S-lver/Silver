"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { composerFocus } from "@/lib/motion";

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function Composer({ onSend, disabled }: ComposerProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start(focused ? "focus" : "rest");
  }, [focused, controls]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    inputRef.current?.focus();
  };

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="px-6 pb-6 pt-2">
      <motion.div
        animate={controls}
        initial="rest"
        variants={composerFocus}
        className="flex items-center gap-2 rounded-full border px-2 py-1.5 transition-colors"
        style={{
          background: "var(--bubble-bot)",
          borderColor: "var(--border-glass)",
        }}
      >
        <input
          ref={inputRef}
          value={value}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message Silver…"
          className="flex-1 bg-transparent px-3 py-2.5 text-[15px] font-normal tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-40"
        />

        <motion.button
          onClick={submit}
          disabled={disabled || !value.trim()}
          whileHover={{ scale: 1.045 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.18, ease: [0.34, 1.4, 0.64, 1] }}
          className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full disabled:opacity-30"
          style={{
            background:
              "linear-gradient(135deg, #E0E0E0 0%, #FFFFFF 30%, #9E9E9E 70%, #525252 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 10px -3px rgba(224,224,224,0.35)",
          }}
          aria-label="Send"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </motion.button>
      </motion.div>

      <div className="mt-2 flex justify-center">
        <span className="text-[11px] tracking-silk text-[var(--text-muted)]">
          {isMac ? "Press ⌘⏎ or Enter to send" : "Press Enter to send"}
        </span>
      </div>
    </div>
  );
}