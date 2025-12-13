// components/ParticlesBackground.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
}

const ParticlesBackground: React.FC = () => {
  const { width, height } = useWindowSize();
  const prefersReducedMotion = useReducedMotion();

  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationValues, setAnimationValues] = useState<
    { x: number; y: number }[]
  >([]);

  // Determine number of particles based on screen size
  const getParticleCount = () => {
    if (width === 0) return 0;
    if (width < 640) return 10;
    if (width < 1024) return 20;
    return 30;
  };

  useEffect(() => {
    if (width === 0 || height === 0) return;

    const particleCount = prefersReducedMotion
      ? Math.floor(getParticleCount() / 2)
      : getParticleCount();
    const speedFactor = prefersReducedMotion ? 0.5 : 1;
    const maxSize = Math.min(width, height) / 100;

    const newParticles: Particle[] = Array.from(
      { length: particleCount },
      (_, i) => {
        const isRed = Math.random() > 0.6;
        return {
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 1 + Math.random() * Math.min(2.5, maxSize),
          color: isRed
            ? `rgba(${220 + Math.random() * 35}, ${20 + Math.random() * 30}, ${
                20 + Math.random() * 30
              }, ${0.1 + Math.random() * 0.2})`
            : `rgba(255, 255, 255, ${0.05 + Math.random() * 0.1})`,
          speed: (30 + Math.random() * 30) * speedFactor,
          opacity: 0.1 + Math.random() * 0.2,
        };
      }
    );

    const magnitude = prefersReducedMotion ? 10 : 40;
    const newAnimationValues = Array(5)
      .fill(0)
      .map(() => ({
        x: Math.random() * magnitude * 2 - magnitude,
        y: Math.random() * magnitude * 2 - magnitude,
      }));

    setParticles(newParticles);
    setAnimationValues(newAnimationValues);
  }, [width, height, prefersReducedMotion]);

  return (
    <div className="particles-container absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default ParticlesBackground;
