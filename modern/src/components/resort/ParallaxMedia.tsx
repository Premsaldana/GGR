"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

type ParallaxMediaProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  preload?: boolean;
  speed?: "gentle" | "cinematic";
};

export function ParallaxMedia({
  src,
  alt,
  className = "",
  imageClassName = "",
  sizes = "100vw",
  preload = false,
  speed = "gentle",
}: ParallaxMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const travel = speed === "cinematic" ? 72 : 36;
  const y = useTransform(scrollYProgress, [0, 1], [-travel, travel]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.06, 1, 1.06]);

  return (
    <div ref={containerRef} className={`parallax-media ${className}`.trim()}>
      <motion.div
        className="parallax-media__plane"
        style={{ y: reduceMotion ? 0 : y, scale: reduceMotion ? 1 : scale }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className={imageClassName}
        />
      </motion.div>
    </div>
  );
}
