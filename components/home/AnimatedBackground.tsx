// components/AnimatedBackground.tsx
"use client";

import React from "react";

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Static Gradient background - simplified for performance */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-red-950/20 to-black/80 z-0" />

      {/* Subtle scan lines overlay - reduced opacity for mobile performance */}
      <div className="absolute inset-0 scan-lines opacity-10 z-0"></div>
    </div>
  );
};

export default AnimatedBackground;
