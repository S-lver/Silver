"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/silver-tokens";

export function StreamingCursor() {
  return (
    <motion.span
      className="relative ml-1 inline-block align-middle"
      style={{
        width: 2,
        height: "1.05em",
        borderRadius: 2,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #E0E0E0 0%, #FFFFFF 50%, #9E9E9E 100%)",
        boxShadow: "0 0 8px rgba(224,224,224,0.35)",
      }}
      animate={{
        opacity: [1, 0.4, 1],
      }}
      transition={{
        duration: 1.1,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {/* Traveling shine */}
      <motion.span
        className="absolute inset-x-0"
        style={{
          height: "40%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)",
        }}
        animate={{ top: ["-40%", "100%"] }}
        transition={{
          duration: 1.4,
          ease: EASE.silver,
          repeat: Infinity,
        }}
      />
    </motion.span>
  );
}