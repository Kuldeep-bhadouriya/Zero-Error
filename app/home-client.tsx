"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  motion,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import LoadingScreen from "@/components/home/LoadingScreen";
import AnimatedBackground from "@/components/home/AnimatedBackground";
import HeroSection from "@/components/home/HeroSection";

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

interface HomeClientProps {
  initialHeroMedia: {
    videoUrl: string
    posterUrl: string
  }
}

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

export default function HomeClient({ initialHeroMedia }: HomeClientProps) {
  const [loading, setLoading] = useState(true);
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const { scrollYProgress } = useScroll();

  const [heroMedia] = useState(initialHeroMedia);

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

                <section className="relative z-10 py-14">
                  <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-sm p-8">
                      <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">
                        Explore The <span className="text-red-500">Zero Error</span> Network
                      </h2>
                      <p className="text-zinc-300 text-sm md:text-base mb-5 max-w-3xl">
                        Discover tournaments, services, team culture, and community systems built for India-first esports growth.
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <Link href="/events" className="text-red-400 hover:text-red-300 underline underline-offset-4">
                          Events and Tournaments
                        </Link>
                        <Link href="/services" className="text-red-400 hover:text-red-300 underline underline-offset-4">
                          Esports Services
                        </Link>
                        <Link href="/about" className="text-red-400 hover:text-red-300 underline underline-offset-4">
                          About Zero Error
                        </Link>
                        <Link href="/teams" className="text-red-400 hover:text-red-300 underline underline-offset-4">
                          Team and Leadership
                        </Link>
                        <Link href="/ze-club" className="text-red-400 hover:text-red-300 underline underline-offset-4">
                          ZE Club Missions
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
