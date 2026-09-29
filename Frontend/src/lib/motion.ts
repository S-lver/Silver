import { Variants } from "framer-motion";
import { EASE, DURATION } from "./silver-tokens";

export const messageIn: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: DURATION.base, ease: EASE.silver },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.fast, ease: EASE.silverIn },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE.silver },
  },
};

export const pillHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.035,
    transition: { duration: DURATION.fast, ease: EASE.bounce },
  },
  tap: { scale: 0.97, transition: { duration: 0.12 } },
};

export const composerFocus = {
  rest: { boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" },
  focus: {
    boxShadow:
      "0 0 0 1px rgba(224,224,224,0.35), 0 0 24px -4px rgba(224,224,224,0.12)",
    transition: { duration: DURATION.base, ease: EASE.silver },
  },
};