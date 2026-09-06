"use client";
/**
 * Motion system — South Goa Garden Villa
 * ─────────────────────────────────────────
 * Framer Motion variant presets.
 * All animations respect prefers-reduced-motion via the
 * useReducedMotion hook — call getVariants() in components.
 *
 * Rule: use transform + opacity only; never animate layout properties.
 * Rule: no animation may delay essential content (headings, CTAs).
 */

import { useReducedMotion, type Variants } from "framer-motion";

/** Returned by useMotionVariants() — swap based on reduced-motion pref. */
export type MotionVariants = {
  fadeUp: Variants;
  fadeIn: Variants;
  staggerContainer: Variants;
  imageReveal: Variants;
};

/** Static (no-motion) variant set — all elements appear immediately. */
export const staticVariants: MotionVariants = {
  fadeUp: {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
  staggerContainer: {
    hidden: {},
    visible: { transition: { staggerChildren: 0 } },
  },
  imageReveal: {
    hidden: { opacity: 1, scale: 1 },
    visible: { opacity: 1, scale: 1 },
  },
};

/** Animated variant set — used when motion is allowed. */
export const animatedVariants: MotionVariants = {
  fadeUp: {
    hidden:  { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0, 0.25, 1] },
    },
  },
  fadeIn: {
    hidden:  { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.35, ease: [0.25, 0, 0.25, 1] },
    },
  },
  staggerContainer: {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  },
  imageReveal: {
    hidden:  { opacity: 0, scale: 1.04 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: [0.25, 0, 0.25, 1] },
    },
  },
};

/**
 * Hook: returns the correct variant set based on prefers-reduced-motion.
 * Use at the top of any component that uses Framer Motion.
 *
 * @example
 * const variants = useMotionVariants();
 * <motion.div variants={variants.fadeUp} initial="hidden" animate="visible" />
 */
export function useMotionVariants(): MotionVariants {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? staticVariants : animatedVariants;
}
