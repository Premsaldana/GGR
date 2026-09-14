"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * UnicornHero — lazy-loaded, optional WebGL enhancement.
 * Requires NEXT_PUBLIC_ENABLE_UNICORN=true in env to activate.
 *
 * Provides:
 * - Static image fallback (LCP optimized)
 * - Reduced motion fallback
 * - Mobile fallback (disabled on small screens)
 * - WebGL/runtime failure fallback (reverts to static)
 */
export function UnicornHero({ 
  fallbackSrc, 
  fallbackAlt,
  projectId = "default-project-id"
}: { 
  fallbackSrc: string; 
  fallbackAlt: string;
  projectId?: string;
}) {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_UNICORN === "true";
  const [loadUnicorn, setLoadUnicorn] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Check mobile (e.g. disable on screens < 768px for performance)
    if (window.innerWidth < 768) return;

    // Check WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return;
    } catch {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadUnicorn(true);
  }, [isEnabled]);

  if (!loadUnicorn || hasError) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
        <Image
          src={fallbackSrc}
          alt={fallbackAlt}
          fill
          style={{ objectFit: "cover", opacity: 0.7 }}
          priority
        />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", backgroundColor: "var(--color-ink-900)" }}>
      {/* 
        Placeholder for Unicorn Studio integration.
        In a real scenario, this would load the Unicorn Studio script and mount the project.
      */}
      <div 
        data-us-project={projectId}
        style={{ width: "100%", height: "100%" }}
        onError={() => setHasError(true)}
      />
      {/* The static fallback image behind the WebGL canvas in case it takes time to load */}
      <div style={{ position: "absolute", inset: 0, zIndex: -1 }}>
        <Image
          src={fallbackSrc}
          alt={fallbackAlt}
          fill
          style={{ objectFit: "cover", opacity: 0.3 }}
          priority
        />
      </div>
    </div>
  );
}
