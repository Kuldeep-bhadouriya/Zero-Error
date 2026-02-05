"use client";

import React from "react";

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* Static gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/10 to-black/80" />

      {/* Subtle cyberpunk grid - static for better performance */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.03)_1px,transparent_1px)] bg-[size:70px_70px] opacity-15"></div>

      {/* Subtle scan lines - reduced opacity for performance */}
      <div className="absolute inset-0 scan-lines opacity-5"></div>
    </div>
  );
}
