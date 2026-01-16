// components/LoadingScreen.tsx
"use client";

import React, { useEffect, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load the Tetris animation component
const TetrisAnimation = lazy(() => import('./TetrisAnimation'));

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  onLoadingComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingText, setLoadingText] = useState("INITIALIZING");

  const loadingTexts = [
    "INITIALIZING",
    "LOADING ASSETS",
    "PREPARING INTERFACE",
    "ESTABLISHING CONNECTION",
    "LAUNCHING",
  ];

  // Progress tracking
  useEffect(() => {
    if (!isLoading) return;

    let hasLoadedBefore = false;
    try {
      hasLoadedBefore = sessionStorage.getItem("hasLoadedSite") === "true";
    } catch (e) {
      // Session storage might not be available
      console.warn("sessionStorage not available");
    }

    const startTime = Date.now();
    const duration = hasLoadedBefore ? 1500 : 4000;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(rawProgress) * 100;
      setProgress(easedProgress);

      if (easedProgress > 20 && easedProgress <= 40) {
        setLoadingText(loadingTexts[1]);
      } else if (easedProgress > 40 && easedProgress <= 60) {
        setLoadingText(loadingTexts[2]);
      } else if (easedProgress > 60 && easedProgress <= 80) {
        setLoadingText(loadingTexts[3]);
      } else if (easedProgress > 80) {
        setLoadingText(loadingTexts[4]);
      }

      if (rawProgress >= 1) {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(() => {
          try {
            sessionStorage.setItem("hasLoadedSite", "true");
          } catch (e) {
            // Ignore sessionStorage errors
          }
          onLoadingComplete();
        }, 1200);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isLoading, onLoadingComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: fadeOut ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
        >
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="relative">
              <motion.div
                className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                ZERO ERROR
              </motion.div>
              <div className="text-center text-sm text-red-500 mt-2 font-bold tracking-wider">
                ESPORTS
              </div>
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-red-600/20 to-orange-500/20 blur-2xl -z-10"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>

          {/* Tetris Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <Suspense fallback={
              <div className="w-[120px] h-[144px] border-2 border-red-600 bg-black rounded flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
              </div>
            }>
              <TetrisAnimation />
            </Suspense>
          </motion.div>

          {/* Simplified Spinner Animation (removed) */}

          {/* Progress Bar */}
          <div className="w-80 max-w-[90vw] space-y-4">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Loading Text */}
            <motion.div
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center text-gray-400 text-sm font-mono tracking-wider"
            >
              {loadingText}
            </motion.div>

            {/* Progress Percentage */}
            <div className="text-center text-red-500 text-xl font-bold font-mono">
              {Math.round(progress)}%
            </div>
          </div>

          {/* Decorative Elements */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-orange-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              delay: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
