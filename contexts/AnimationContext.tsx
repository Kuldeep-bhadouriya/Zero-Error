"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type AnimationContextType = {
  prefersReducedMotion: boolean;
  animationEnabled: boolean;
  toggleAnimations: () => void;
};

const AnimationContext = createContext<AnimationContextType | undefined>(
  undefined
);

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const systemPrefersReducedMotion = useReducedMotion();
  const [userPrefersReducedMotion, setUserPrefersReducedMotion] =
    useState(false);

  // Combine system and user preferences
  const prefersReducedMotion =
    systemPrefersReducedMotion || userPrefersReducedMotion;

  // Save user preference to localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem("reduced-motion");
    if (savedPreference) {
      setUserPrefersReducedMotion(savedPreference === "true");
    }
  }, []);

  const toggleAnimations = () => {
    const newValue = !userPrefersReducedMotion;
    setUserPrefersReducedMotion(newValue);
    localStorage.setItem("reduced-motion", String(newValue));
  };

  return (
    <AnimationContext.Provider
      value={{
        prefersReducedMotion,
        animationEnabled: !prefersReducedMotion,
        toggleAnimations,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error("useAnimation must be used within an AnimationProvider");
  }
  return context;
};
