"use client";

import { useAnimation } from "@/contexts/AnimationContext";
import Image from "next/image";

export default function AnimationToggle() {
  const { prefersReducedMotion, toggleAnimations } = useAnimation();

  return (
    <button
      onClick={toggleAnimations}
      className="flex items-center gap-2 text-sm"
      aria-pressed={prefersReducedMotion}
    >
      <span className="sr-only">
        {prefersReducedMotion ? "Enable animations" : "Reduce animations"}
      </span>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={prefersReducedMotion ? "text-gray-400" : "text-white"}
      >
        {prefersReducedMotion ? (
          <path d="M9 18l6-6-6-6" />
        ) : (
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        )}
      </svg>
      {prefersReducedMotion ? "Reduced motion" : "Full animations"}
    </button>
  );
}

export function EventImage({ item }: { item: string }) {
  return (
    <Image
      src="/images/events/event1.jpg" // Replace with actual image path
      alt={`Past Event ${item}`}
      width={300}
      height={250}
      className="object-cover group-hover:scale-110 transition-transform duration-500"
    />
  );
}
