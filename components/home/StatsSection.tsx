"use client";

import { Trophy, Users } from "lucide-react";
import AnimatedCounter from "../AnimatedCounter";

const StatsSection = () => {
  return (
    <section className="relative py-12 sm:py-16 bg-black/50 backdrop-blur-sm border-t border-b border-zinc-800/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-center w-full max-w-2xl">
          <AnimatedCounter
            value={50}
            label="Events Organised"
            icon={<Users className="w-6 h-6 text-red-500" />}
            delay={0.3}
          />
          <AnimatedCounter
            value={10}
            label="Flagship events"
            icon={<Trophy className="w-6 h-6 text-red-500" />}
            delay={0}
          />
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
