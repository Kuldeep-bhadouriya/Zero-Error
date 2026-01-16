"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  AnimatePresence,
} from "framer-motion";

import ParticlesBackground from "@/components/home/ParticlesBackground";
import LoadingScreen from "@/components/home/LoadingScreen";
import AnimatedBackground from "@/components/home/AnimatedBackground";
import HeroSection from "@/components/home/HeroSection";
import AnnouncementsSection from "@/components/home/AnnouncementsSection";
import StatsSection from "@/components/home/StatsSection";
import FeaturedGamesSection from "@/components/home/FeaturedGamesSection";
import PastEventsSection from "@/components/home/PastEventsSection";

interface HomeClientProps {
  heroVideoUrl?: string
  heroPosterUrl?: string
}

export default function Home({ heroVideoUrl, heroPosterUrl }: HomeClientProps) {
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();

  const [heroMedia, setHeroMedia] = useState({
    videoUrl: heroVideoUrl || "",
    posterUrl: heroPosterUrl || "",
  })

  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    async function fetchHeroMedia() {
      try {
        const response = await fetch("/api/admin/marketing/hero")
        if (response.ok) {
          const data = await response.json()
          setHeroMedia({
            videoUrl: data.heroVideoUrl || "",
            posterUrl: data.heroPosterUrl || "",
          })
        }
      } catch (error) {
        console.error("Failed to fetch hero media:", error)
      }
    }
    
    fetchHeroMedia()
  }, [])

  useEffect(() => {
    // Track mouse movement for dynamic effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLoadingComplete = () => {
    setLoading(false);
  };

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
              <AnimatedBackground mousePosition={mousePosition} />

              {/* Particle effects layer */}
              <ParticlesBackground />
            </div>
            {/* Hero Section with Video Background */}
            <HeroSection
              scrollYProgress={scrollYProgress}
              mousePosition={mousePosition}
              heroVideoUrl={heroMedia.videoUrl}
              heroPosterUrl={heroMedia.posterUrl}
            />
            <AnnouncementsSection />
            {/* Stats Section */}
            <StatsSection />
            {/* Featured Games Section */}
            <FeaturedGamesSection />
            {/* Past Events Section */}
            <PastEventsSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
