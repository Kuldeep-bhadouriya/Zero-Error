"use client";

import React from "react";

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* Static gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/10 to-black/80" />

      {/* Abstract cyberpunk grid - add infinite-grid class */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:70px_70px] opacity-20 infinite-grid"></div>

      {/* Animated scan lines */}
      <div className="absolute inset-0 scan-lines opacity-8"></div>

      {/* Particle overlay */}
      <div className="absolute inset-0 particle-overlay"></div>

      {/* Dynamic vignette effect */}
      <div className="absolute inset-0 bg-radial-gradient opacity-70"></div>
    </div>
  );
}
