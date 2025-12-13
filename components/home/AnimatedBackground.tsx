// components/AnimatedBackground.tsx
"use client";

import React from "react";
import { useScroll } from "framer-motion";
import ParticlesBackground from "./ParticlesBackground";

interface AnimatedBackgroundProps {
  mousePosition: { x: number; y: number };
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  mousePosition,
}) => {
  const { scrollYProgress } = useScroll();

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Gradient that shifts based on mouse position */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/80 via-red-950/20 to-black/80 z-0"
        style={{
          backgroundPosition: `${mousePosition.x * 100}% ${
            mousePosition.y * 100
          }%`,
          transition: "background-position 0.8s ease-out",
        }}
      />

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

      {/* Floating particles */}
      <ParticlesBackground />
    </div>
  );
};

export default AnimatedBackground;
