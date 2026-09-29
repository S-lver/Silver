"use client";

import { motion } from "framer-motion";
import { SILVER, EASE } from "@/lib/silver-tokens";

export function LiquidPulse({ size = 44 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label="Silver is thinking"
      role="status"
    >
      {/* Ambient glow — soft, diffused, never neon */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: SILVER.shineSoft,
          filter: "blur(14px)",
          opacity: 0.35,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.28, 0.5, 0.28],
        }}
        transition={{
          duration: 2.6,
          ease: EASE.silver,
          repeat: Infinity,
        }}
      />

      {/* Morphing droplet */}
      <motion.div
        className="relative"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: SILVER.shine,
          boxShadow:
            "inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.35)",
        }}
        animate={{
          borderRadius: [
            "60% 40% 55% 45% / 50% 60% 40% 50%",
            "45% 55% 40% 60% / 55% 45% 55% 45%",
            "55% 45% 60% 40% / 45% 55% 45% 55%",
            "60% 40% 55% 45% / 50% 60% 40% 50%",
          ],
          rotate: [0, 120, 240, 360],
          scale: [1, 1.06, 0.96, 1],
        }}
        transition={{
          duration: 3.6,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      {/* Inner specular highlight — the "polished" read */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: size * 0.22,
          height: size * 0.16,
          top: "22%",
          left: "28%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)",
          transform: "rotate(-25deg)",
        }}
      />
    </div>
  );
}