"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { Welcome } from "./Welcome";
import { LiquidPulse } from "./LiquidPulse";
import type { UIMessage } from "@/types/chat";

interface ChatCanvasProps {
  messages: UIMessage[];
  isProcessing: boolean;
  onPickSuggestion: (prompt: string) => void;
}

export function ChatCanvas({
  messages,
  isProcessing,
  onPickSuggestion,
}: ChatCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const showWelcome = messages.length === 0;

  // Auto-scroll on new content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  // Decide whether to show the loader:
  // Only when the last bot message is empty (before first token arrives)
  const lastMsg = messages[messages.length - 1];
  const showLoader =
    isProcessing &&
    lastMsg?.role === "bot" &&
    !lastMsg.content &&
    !lastMsg.html;

  return (
    <div
      ref={scrollRef}
      className="relative flex-1 overflow-y-auto px-6"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-[820px] flex-col gap-4 py-6">
        <AnimatePresence mode="wait">
          {showWelcome ? (
            <motion.div
              key="welcome"
              className="flex flex-1"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.35 } }}
            >
              <Welcome onPick={onPickSuggestion} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-4"
            >
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  sender={m.role}
                  content={m.content}
                  html={m.html}
                  streaming={m.streaming}
                />
              ))}

              {showLoader && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex self-start pl-2 pt-2"
                >
                  <LiquidPulse size={40} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}