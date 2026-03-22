"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import LoadingScreen from "@/components/home/LoadingScreen";
import AnimatedBackground from "@/components/home/AnimatedBackground";
import HeroSection from "@/components/home/HeroSection";
import logger from '@/lib/browser-logger'

const AnnouncementsSection = dynamic(() => import("@/components/home/AnnouncementsSection"), {
  ssr: false,
});
const StatsSection = dynamic(() => import("@/components/home/StatsSection"), {
  ssr: false,
  loading: () => null,
});
const FeaturedGamesSection = dynamic(() => import("@/components/home/FeaturedGamesSection"), {
  ssr: false,
  loading: () => null,
});
const PastEventsSection = dynamic(() => import("@/components/home/PastEventsSection"), {
  ssr: false,
  loading: () => null,
});

function scheduleIdle(callback: () => void) {
  if (typeof globalThis === 'undefined') {
    return () => undefined
  }

  if ('requestIdleCallback' in globalThis) {
    const id = globalThis.requestIdleCallback(callback, { timeout: 500 })
    return () => globalThis.cancelIdleCallback(id)
  }

  const timeoutId = globalThis.setTimeout(callback, 1)
  return () => globalThis.clearTimeout(timeoutId)
}

export default function HomeClient() {
  const [loading, setLoading] = useState(true);
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const { scrollYProgress } = useScroll();

  const [heroMedia, setHeroMedia] = useState({
    videoUrl: "",
    posterUrl: "",
  });

  useEffect(() => {
    async function fetchHeroMedia() {
      try {
        const response = await fetch("/api/admin/marketing/hero", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setHeroMedia({
            videoUrl: data.heroVideoUrl || "",
            posterUrl: data.heroPosterUrl || "",
          });
        }
      } catch (error) {
        logger.error("Failed to fetch hero media:", error);
      }
    }

    fetchHeroMedia();
  }, []);

  const handleLoadingComplete = () => {
    setLoading(false);
  };

  useEffect(() => {
    if (loading) {
      return
    }

    return scheduleIdle(() => {
      setShowDeferredSections(true)
    })
  }, [loading])

  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden relative">
      {/* Loading Screen */}
      <LoadingScreen
        isLoading={loading}
        onLoadingComplete={handleLoadingComplete}
      />

      {/* Main Content */}
      <AnimatePresence>
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="w-full"
          >
            {/* Background layers */}
            <div className="absolute inset-0 z-0">
              {/* Animated gradient background */}
              <AnimatedBackground />
            </div>
            {/* Hero Section with Video Background */}
            <HeroSection
              scrollYProgress={scrollYProgress}
              heroVideoUrl={heroMedia.videoUrl}
              heroPosterUrl={heroMedia.posterUrl}
            />
            <AnnouncementsSection />
            {showDeferredSections && (
              <>
                {/* Stats Section */}
                <StatsSection />
                {/* Featured Games Section */}
                <FeaturedGamesSection />
                {/* Past Events Section */}
                <PastEventsSection />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
