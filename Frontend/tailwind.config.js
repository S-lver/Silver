import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Obsidian spine — dark mode
        obsidian: {
          950: "#0A0A0A",
          900: "#0E0E0E",
          850: "#121212",
          800: "#171717",
          700: "#1F1F1F",
          600: "#2A2A2A",
        },
        // Polished silver — accent system
        silver: {
          50:  "#FAFAFA",
          100: "#F0F0F0",
          200: "#E0E0E0",
          300: "#C7C7C7",
          400: "#9E9E9E",
          500: "#7A7A7A",
          600: "#525252",
          700: "#3D3D3D",
          800: "#2A2A2A",
          900: "#1A1A1A",
        },
        // Chrome-light (light mode spine)
        chrome: {
          50:  "#FFFFFF",
          100: "#F7F7F8",
          200: "#EFEFF1",
          300: "#E2E2E6",
          400: "#C9C9CF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        "tightest": "-0.04em",
        "tighter": "-0.025em",
        "tight": "-0.015em",
        "silk": "0.01em",
      },
      backgroundImage: {
        // The signature "liquid silver" shine
        "silver-shine":
          "linear-gradient(135deg, #E0E0E0 0%, #FFFFFF 25%, #9E9E9E 55%, #525252 100%)",
        "silver-shine-soft":
          "linear-gradient(135deg, rgba(224,224,224,0.9) 0%, rgba(255,255,255,0.95) 30%, rgba(158,158,158,0.85) 70%, rgba(82,82,82,0.9) 100%)",
        "silver-hairline":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%)",
        "obsidian-fade":
          "linear-gradient(180deg, #0A0A0A 0%, #121212 100%)",
        "chrome-fade":
          "linear-gradient(180deg, #FFFFFF 0%, #F7F7F8 100%)",
      },
      boxShadow: {
        // Ambient, diffused — never neon
        "silver-ambient":
          "0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px -20px rgba(0,0,0,0.8), 0 0 40px -10px rgba(224,224,224,0.06)",
        "silver-inset":
          "inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 -1px 0 0 rgba(0,0,0,0.4)",
        "silver-focus":
          "0 0 0 1px rgba(224,224,224,0.35), 0 0 24px -4px rgba(224,224,224,0.12)",
        "chrome-ambient":
          "0 0 0 1px rgba(0,0,0,0.04), 0 20px 60px -20px rgba(0,0,0,0.12)",
        "chrome-focus":
          "0 0 0 1px rgba(82,82,82,0.35), 0 0 24px -4px rgba(82,82,82,0.10)",
      },
      transitionTimingFunction: {
        // "Weightless" — expo-out family
        "silver": "cubic-bezier(0.16, 1, 0.3, 1)",
        "silver-in": "cubic-bezier(0.7, 0, 0.84, 0)",
        "silver-bounce": "cubic-bezier(0.34, 1.4, 0.64, 1)",
      },
      keyframes: {
        "silver-drift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "shimmer-sweep": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        "liquid-morph": {
          "0%, 100%": {
            borderRadius: "60% 40% 55% 45% / 50% 60% 40% 50%",
            transform: "rotate(0deg) scale(1)",
          },
          "33%": {
            borderRadius: "45% 55% 40% 60% / 55% 45% 55% 45%",
            transform: "rotate(120deg) scale(1.06)",
          },
          "66%": {
            borderRadius: "55% 45% 60% 40% / 45% 55% 45% 55%",
            transform: "rotate(240deg) scale(0.96)",
          },
        },
        "pulse-ambient": {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)" },
        },
        "caret-breathe": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "silver-drift": "silver-drift 6s ease-in-out infinite",
        "shimmer-sweep": "shimmer-sweep 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        "liquid-morph": "liquid-morph 3.6s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        "pulse-ambient": "pulse-ambient 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        "caret-breathe": "caret-breathe 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;