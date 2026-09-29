"use client";

import { motion } from "framer-motion";
import { messageIn } from "@/lib/motion";
import { StreamingCursor } from "./StreamingCursor";
import clsx from "clsx";

type Sender = "user" | "bot";

interface MessageBubbleProps {
  content: string;
  html?: string;
  sender: Sender;
  streaming?: boolean;
}

export function MessageBubble({
  content,
  html,
  sender,
  streaming,
}: MessageBubbleProps) {
  const isUser = sender === "user";

  return (
    <motion.div
      variants={messageIn}
      initial="hidden"
      animate="visible"
      className={clsx(
        "relative max-w-[min(680px,82%)] rounded-[20px] px-4 py-3",
        "text-[15px] leading-[1.65] tracking-tight",
        "transition-colors duration-500",
        isUser
          ? "self-end rounded-br-[6px] text-[var(--text-primary)]"
          : "self-start rounded-bl-[6px] text-[var(--text-primary)]"
      )}
      style={
        isUser
          ? {
              background: "var(--bubble-user)",
              border: "1px solid var(--border-glass-strong)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(0,0,0,0.2)",
            }
          : {
              background: "var(--bubble-bot)",
              border: "1px solid var(--border-glass)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 0 rgba(0,0,0,0.15)",
            }
      }
    >
      {/* Hairline top shine — the "metal edge catching light" detail */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
          opacity: isUser ? 0.9 : 0.5,
        }}
      />

      {html && !streaming ? (
        <div
          className="prose-silver"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="whitespace-pre-wrap break-words">
          {content}
          {streaming && <StreamingCursor />}
        </div>
      )}
    </motion.div>
  );
}
