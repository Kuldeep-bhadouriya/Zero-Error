"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAnimation } from "@/contexts/AnimationContext";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { animationEnabled } = useAnimation();

  // Force animation reset on route change
  useEffect(() => {
    // Scroll to top on page changes
    window.scrollTo(0, 0);
  }, [pathname]);

  // If animations disabled, just render children without transitions
  if (!animationEnabled) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: "easeInOut",
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
