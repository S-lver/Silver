/**
 * Silver Design Tokens
 * The single source of truth for the "liquid metal" aesthetic.
 */

export const SILVER = {
  // Gradient strings — usable in Framer Motion / inline styles
  shine:
    "linear-gradient(135deg, #E0E0E0 0%, #FFFFFF 25%, #9E9E9E 55%, #525252 100%)",
  shineSoft:
    "linear-gradient(135deg, rgba(224,224,224,0.9) 0%, rgba(255,255,255,0.95) 30%, rgba(158,158,158,0.85) 70%, rgba(82,82,82,0.9) 100%)",
  hairline:
    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%)",
  chromeShine:
    "linear-gradient(135deg, #C9C9CF 0%, #FFFFFF 30%, #9E9E9E 70%, #525252 100%)",
} as const;

export const RADII = {
  bubble: "1.25rem",
  bubbleTail: "0.25rem",
  pill: "9999px",
  canvas: "1.75rem",
} as const;

export const EASE = {
  silver: [0.16, 1, 0.3, 1] as const,
  silverIn: [0.7, 0, 0.84, 0] as const,
  bounce: [0.34, 1.4, 0.64, 1] as const,
} as const;

export const DURATION = {
  fast: 0.22,
  base: 0.38,
  slow: 0.6,
} as const;