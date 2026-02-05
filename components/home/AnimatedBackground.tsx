// components/AnimatedBackground.tsx
"use client";

import React from "react";
import { useScroll } from "framer-motion";

const AnimatedBackground: React.FC = () => {
  const { scrollYProgress } = useScroll();

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Static Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-red-950/20 to-black/80 z-0" />

      {/* Optional blur based on scroll */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          backdropFilter: "blur(2px)",
          opacity: scrollYProgress.get() > 0.05 ? 0.2 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Scan lines overlay */}
      <div className="absolute inset-0 scan-lines opacity-20 z-0"></div>

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-gradient z-0"></div>
    </div>
  );
};

export default AnimatedBackground;
