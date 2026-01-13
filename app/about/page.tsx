"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  Users,
  ChevronRight,
  MessageSquare,
  Map,
  Zap,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export default function AboutPage() {
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
    },
  };

  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_2px,transparent_2px),linear-gradient(90deg,rgba(20,20,20,0.5)_2px,transparent_2px)] bg-[size:40px_40px] opacity-30 z-10"></div>

        {/* Red glowing orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-red-600/10 filter blur-[150px] z-10"></div>
        <div className="absolute bottom-[-30%] left-[-20%] w-[700px] h-[700px] rounded-full bg-red-600/5 filter blur-[120px] z-10"></div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/80 z-10"></div>

        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/banner.jpg?height=600&width=1200"
            alt="About Us Background"
            fill
            className="object-cover"
          />
        </div>

        {/* Scan lines effect */}
        <div className="absolute inset-0 z-10 scan-lines opacity-20"></div>

        {/* Hero content */}
        <div className="container mx-auto relative z-20 h-full flex flex-col justify-center px-6">
          <motion.h1
            className="text-5xl md:text-7xl font-black uppercase leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            ABOUT{" "}
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 glow-text"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Zero Error
            </motion.span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-zinc-300 mt-6 max-w-2xl font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            We’re igniting a competitive gaming revolution from the heart of
            Gwalior. Whether you're a player, content creator, or fan – Zero
            Error is your new arena.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-8"
          >
            <motion.a
              href="#our-story"
              className="inline-flex items-center text-red-500 font-semibold text-lg group"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Discover our journey
              <motion.span
                initial={{ x: 0 }}
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 1, duration: 1 }}
              >
                <ChevronRight className="ml-2 h-5 w-5 group-hover:text-red-400" />
              </motion.span>
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="our-story" className="py-24 relative">
        {/* Subtle diagonal pattern background */}
        <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#333,#333_1px,transparent_1px,transparent_10px)]"></div>

        <div className="container mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Text content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-bold uppercase mb-8">
                OUR{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                  STORY
                </span>
              </h2>
              <div className="space-y-6 text-zinc-300 text-lg">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Zero Error Esports was born in Gwalior, Madhya Pradesh, with
                  one goal: to provide a professional platform for gaming talent
                  across the heart of India. We are MP’s first full-stack
                  esports organization – building players, creating events, and
                  launching careers.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Started by passionate gamers and creators, Zero Error isn’t
                  just about competition — it’s about community, opportunity,
                  and expression. We’re nurturing local talent and giving them
                  the resources to shine on national and international stages.
                </motion.p>
              </div>

              <motion.div
                className="mt-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link href="/teams">
                  <motion.div
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-md inline-flex items-center font-semibold text-sm uppercase relative overflow-hidden group shadow-[0_0_15px_rgba(150,0,0,0.2)]"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 0 20px rgba(220,0,0,0.3)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative z-10 flex items-center">
                      Meet Our Team
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-bold uppercase mb-8">
                OUR{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                  VISION
                </span>
              </h2>
              <div className="space-y-6 text-zinc-300 text-lg">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  To teach gaming and esports in every city of India and in
                  underserved countries across the globe.
                </motion.p>
              </div>

              <motion.div
                className="mt-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              ></motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Mission Section - Fixed for mobile and icon visibility */}
      <section className="py-24 relative">
        {/* Transparent diagonal pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,#fff,#fff_1px,transparent_1px,transparent_10px)]"></div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold uppercase mb-8 sm:mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            OUR{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
              MISSION
            </span>
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                title: "Build Learning Hubs",
                description:
                  "Establish esports hubs in Tier-2 & Tier-3 cities to nurture talent.",
                icon: Map,
              },
              {
                title: "Educate & Train",
                description:
                  "Provide training for players, creators, casters, and team managers.",
                icon: Users,
              },
              {
                title: "Career Opportunities",
                description:
                  "Offer career paths in gaming beyond just playing professionally.",
                icon: TrendingUp,
              },
              {
                title: "Inclusive Events",
                description:
                  "Host skill-based events in India and abroad for all levels.",
                icon: Trophy,
              },
              {
                title: "Esports Awareness",
                description:
                  "Promote esports in schools, colleges, and communities.",
                icon: MessageSquare,
              },
            ].map((mission, index) => (
              <motion.div
                key={index}
                className="bg-transparent backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-zinc-800/50 shadow-lg hover:shadow-red-900/20 transition-all duration-300"
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  boxShadow:
                    "0 20px 25px -5px rgba(220, 38, 38, 0.1), 0 10px 10px -5px rgba(220, 38, 38, 0.04)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg mb-3 sm:mb-0">
                    {React.createElement(mission.icon, {
                      className: "w-6 h-6 text-white",
                    })}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold sm:ml-4">
                    {mission.title}
                  </h3>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {mission.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Leadership Section */}
      <section className="py-24 relative">
        {/* Subtle diagonal pattern background */}
        <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#333,#333_1px,transparent_1px,transparent_10px)]"></div>

        <div className="container mx-auto px-6 relative">
          <motion.h2
            className="text-4xl font-bold uppercase mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            OUR{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
              LEADERSHIP
            </span>
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                name: "Aazam Khan",
                role: "Founder & CEO",
                icon: <Zap className="w-4 h-4" />,
                bio: "",
                image: "/images/team/Aazam Khan.jpg",
              },
              {
                name: "Priyesh Kekan",
                role: "Co-founder",
                icon: <TrendingUp className="w-4 h-4" />,
                bio: "",
                image: "/images/team/Priyesh Kekan.jpg",
              },
              {
                name: "Deepanshu Savita",
                role: "Co-founder",
                icon: <Trophy className="w-4 h-4" />,
                bio: "",
                image: "/images/team/Deepanshu Savita.jpg",
              },
            ].map((member, index) => (
              <motion.div
                key={index}
                className="group"
                variants={itemVariants}
                whileHover={{ y: -10 }}
              >
                <div className="relative h-[350px] w-full mb-5 overflow-hidden rounded-xl border border-zinc-800 shadow-lg">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>

                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <div className="flex items-center mb-3">
                      <span className="bg-red-600 p-1.5 rounded-md mr-2 flex items-center justify-center">
                        {member.icon}
                      </span>
                      <span className="text-xs uppercase text-white font-bold tracking-wider">
                        {member.role}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {member.bio}
                    </p>
                  </div>

                  {/* Overlay effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ opacity: 1 }}
                  ></motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <Link href="/teams">
              <motion.button
                className="bg-transparent border-2 border-zinc-700 hover:border-red-600 text-white px-8 py-4 rounded-md uppercase tracking-wider font-medium"
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(220,38,38,0.1)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                Meet The Full Team
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
