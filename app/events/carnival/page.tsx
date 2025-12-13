"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  MapPin,
  Users,
  ArrowRight,
  ArrowLeft,
  Clock,
  Trophy,
  Star,
  Zap,
  Shield,
} from "lucide-react";

// Carnival attractions
const carnivalAttractions = [
  {
    id: "gaming-booths",
    title: "Gaming Booths",
    date: "June 21, 2025 (All Day)",
    location: "ITM Gwalior",
    participants: "Unlimited",
    image: "/images/Carnival/Booths.png?height=300&width=500",
    category: "Exhibition",
    description:
      "Explore 10+ gaming booths featuring the challenges, casual playing zones & retro classics.",
    coordinator: "Exhibition Director",
    coordinatorRole: "Exhibition Coordinator",
    registrationLink: "/signup",
    bulletPoints: [
      "10+ Gaming Booths",
      "Gaming Challenges",
      "Casual Playing Zones",
      "Retro Gaming Zone",
    ],
  },
  {
    id: "tournament-finals",
    title: "Tournament Finals",
    date: "June 21, 2025 (Evening)",
    location: "ITM Gwalior",
    participants: "Qualified Teams",
    image: "/images/Carnival/FINALS.png?height=300&width=500",
    category: "Tournament",
    description:
      "Watch the thrilling finals of multiple esports tournaments live on the main stage.",
    coordinator: "Tournament Director",
    coordinatorRole: "Tournament Coordinator",
    registrationLink: "/signup",
    bulletPoints: [
      "Valorant Finals",
      "BGMI Championship",
      "Tekken 8 Showdown",
      "Live Commentary",
    ],
  },
  {
    id: "special-exhibitions",
    title: "Game Dev Exhibition",
    date: "June 21, 2025 (Afternoon)",
    location: "ITM Gwalior",
    participants: "All Attendees",
    image: "/images/Carnival/GameDevExhibition.png?height=300&width=500",
    category: "Exhibition",
    description:
      "Experience exclusive game reveals and special exhibitions from top game developers.",
    coordinator: "Exhibition Director",
    coordinatorRole: "Exhibition Coordinator",
    registrationLink: "/signup",
    bulletPoints: [
      "Game Reveals",
      "Developer Showcases",
      "Exclusive Previews",
      "Industry Insights",
    ],
  },
  {
    id: "cosplay-activities",
    title: "Influencer's Interaction & Stage Performances",
    date: "June 21, 2025 (All Day)",
    location: "ITM Gwalior",
    participants: "All Attendees",
    image: "/images/Carnival/Stage performances.jpg?height=300&width=500",
    category: "Activity",
    description:
      "Meet your favorite gaming influencers and enjoy exciting stage performances.",
    coordinator: "Activity Director",
    coordinatorRole: "Activity Coordinator",
    registrationLink: "/signup",
    bulletPoints: [
      "Influencer Meet & Greet",
      "Stage Performances",
      "Interactive Sessions",
      "Photo Opportunities",
    ],
  },
];

export default function CarnivalShowPage() {
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Parallax effect references
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    // Track mouse movement for dynamic effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] },
    },
  };

  const shimmerVariants = {
    initial: { x: "-100%", opacity: 0.3 },
    animate: {
      x: "100%",
      opacity: 1,
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 relative"
        >
          <div className="w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-lg">
            Carnival
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Global dynamic background elements */}
      <div className="fixed inset-0 z-0">
        {/* Dynamic gradient background that moves with mouse */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-black/80 via-red-950/10 to-black/80 z-0"
          style={{
            backgroundPosition: `${mousePosition.x * 100}% ${
              mousePosition.y * 100
            }%`,
            transition: "background-position 0.5s ease-out",
          }}
        />

        {/* Animated scan lines */}
        <div className="absolute inset-0 scan-lines opacity-20 z-0"></div>

        {/* Dynamic vignette effect */}
        <div className="absolute inset-0 bg-radial-gradient z-0"></div>
      </div>

      {/* Hero Section */}
      <section ref={ref} className="relative h-screen overflow-hidden">
        {/* Parallax background */}
        <motion.div className="absolute inset-0 z-0" style={{ y: backgroundY }}>
          <Image
            src="/images/carnival.webp?height=1200&width=1800"
            alt="Gaming Carnival"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </motion.div>

        {/* Hero content */}
        <div className="container mx-auto px-6 h-full flex flex-col justify-center relative z-10">
          <motion.div className="max-w-4xl" style={{ y: textY, opacity }}>
            {/* Back button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Link href="/events/gameocon">
                <motion.button
                  className="flex items-center text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-lg"
                  whileHover={{ x: -5 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Back to Game'O'Con</span>
                </motion.button>
              </Link>
            </motion.div>

            <div className="mb-4 inline-flex items-center gap-2 bg-red-600/20 text-red-500 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md border border-red-600/30">
              <Star className="h-4 w-4" />
              <span>FEATURED EVENT</span>
            </div>

            <motion.h1
              className="text-6xl md:text-8xl font-black uppercase mb-4 leading-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700">
                CARNIVAL
              </span>
              <br />
              <span className="text-white glow-text-white">SHOW</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-zinc-300 mb-8 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              The ultimate gaming extravaganza featuring exhibitions,
              tournaments, cosplay contests, and interactive experiences for all
              gaming enthusiasts.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50">
                <Calendar className="h-5 w-5 text-red-500" />
                <span>June 21, 2025</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50">
                <MapPin className="h-5 w-5 text-red-500" />
                <span>ITM Gwalior</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50">
                <Users className="h-5 w-5 text-red-500" />
                <span>All Ages Welcome</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-800/50">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>3:00 PM - 9:00 PM</span>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Link href="/signup">
                <motion.div
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 text-lg uppercase font-bold rounded-md flex items-center shadow-[0_0_15px_rgba(220,38,38,0.3)] relative overflow-hidden group"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 25px rgba(220,38,38,0.5)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 w-full h-full"
                    style={{
                      background: `radial-gradient(circle at ${
                        mousePosition.x * 100
                      }% ${
                        mousePosition.y * 100
                      }%, rgba(255,50,50,0.7) 0%, transparent 70%)`,
                      opacity: 0.2,
                    }}
                  />
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

                  {/* Shimmer effect */}
                  <motion.span
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                  />

                  <span className="relative z-10 flex items-center">
                    Get Your Tickets
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                </motion.div>
              </Link>

              <Link href="#carnival-attractions">
                <motion.button
                  className="border-2 border-zinc-700 hover:border-red-600 text-white bg-zinc-900/50 backdrop-blur-sm px-6 py-4 text-lg rounded-md flex items-center transition-colors duration-300"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(30,30,30,0.8)",
                    borderColor: "rgba(220,38,38,0.6)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Explore Attractions
                  <ChevronRight className="ml-2 h-5 w-5" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              delay: 1.5,
              duration: 1,
            },
          }}
        >
          <motion.div
            animate={{
              y: [0, 12, 0],
              transition: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              },
            }}
            className="flex flex-col items-center"
          >
            <span className="text-sm text-zinc-500 mb-2">
              Scroll to explore
            </span>
            <div className="h-10 w-6 border-2 border-zinc-500 rounded-full flex justify-center pt-2">
              <motion.div
                className="h-2 w-2 bg-red-500 rounded-full"
                animate={{
                  y: [0, 12, 0],
                  transition: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                    delay: 0.2,
                  },
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Carnival Attractions Section */}
      <section id="carnival-attractions" className="py-24 relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="mb-4 inline-flex items-center gap-2 bg-red-600/20 text-red-500 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md border border-red-600/30">
              <Star className="h-4 w-4" />
              <span>CARNIVAL ATTRACTIONS</span>
            </div>

            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 font-orbitron"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              EXPLORE THE <span className="text-red-600">CARNIVAL</span>
            </motion.h2>

            <motion.p
              className="text-lg text-zinc-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Discover all the exciting attractions waiting for you at the
              Carnival Show.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {carnivalAttractions.map((attraction) => (
              <motion.div
                key={attraction.id}
                variants={itemVariants}
                className="bg-zinc-900/80 rounded-lg overflow-hidden group border border-zinc-800 shadow-lg hover:shadow-[0_0_20px_rgba(220,0,0,0.2)] h-full"
              >
                {/* Event Image */}
                <div className="relative h-[200px] overflow-hidden">
                  <Image
                    src={attraction.image || "/placeholder.svg"}
                    alt={attraction.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-red-600/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                      {attraction.category}
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-white">
                    {attraction.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    {attraction.description}
                  </p>

                  {/* Event Info */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-zinc-400">
                        {attraction.date}
                      </span>
                    </div>
                    {attraction.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-zinc-400">
                          {attraction.location}
                        </span>
                      </div>
                    )}
                    {attraction.participants && (
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-zinc-400">
                          {attraction.participants}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Registration CTA Section */}
      <section className="py-24 relative bg-gradient-to-b from-zinc-900 to-black">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

          {/* Floating red orbs */}
          <div className="absolute top-20 left-20 w-60 h-60 rounded-full bg-red-600/5 filter blur-[80px]"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-red-600/5 filter blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              className="text-4xl md:text-6xl font-bold mb-6 font-orbitron"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              JOIN THE <span className="text-red-600">CELEBRATION</span>
            </motion.h2>

            <motion.p
              className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Don't miss out on the biggest gaming carnival of the year. Get
              your tickets now for an unforgettable experience!
            </motion.p>

            <Link href="/signup">
              <motion.div
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-10 py-5 text-xl uppercase font-bold rounded-md inline-flex items-center shadow-[0_0_20px_rgba(220,38,38,0.3)] relative overflow-hidden group"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(220,38,38,0.5)",
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    background: `radial-gradient(circle at ${
                      mousePosition.x * 100
                    }% ${
                      mousePosition.y * 100
                    }%, rgba(255,50,50,0.7) 0%, transparent 70%)`,
                    opacity: 0.2,
                  }}
                />
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

                {/* Shimmer effect */}
                <motion.span
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  variants={shimmerVariants}
                  initial="initial"
                  animate="animate"
                />

                <span className="relative z-10 flex items-center">
                  Get Your Tickets
                  <ArrowRight className="ml-2 h-6 w-6" />
                </span>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
