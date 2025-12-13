// components/AnimatedCounter.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  label,
  icon,
  delay = 0,
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startValue = 0;
          const duration = 2000;
          const startTime = Date.now();

          const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            startValue = Math.floor(easedProgress * value);
            setCount(startValue);

            if (progress === 1) clearInterval(timer);
          }, 16);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) observer.observe(countRef.current);

    return () => {
      if (countRef.current) observer.unobserve(countRef.current);
    };
  }, [value]);

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay }}
    >
      <div className="bg-red-600/10 p-4 rounded-full mb-4">{icon}</div>
      <span ref={countRef} className="text-4xl font-bold text-white">
        {count}
        <span className="text-red-500">+</span>
      </span>
      <span className="text-zinc-400 mt-2 text-sm uppercase tracking-wider">
        {label}
      </span>
    </motion.div>
  );
};

export default AnimatedCounter;
