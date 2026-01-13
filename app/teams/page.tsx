"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ArrowRight, Users, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamsPage() {
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  // Team members data organized by departments
  const teamMembers = {
    leadership: [
      {
        name: "Aazam Khan",
        role: "Founder & CEO",
        image: "/images/team/Aazam Khan.jpg",
        fallbackImage: "/images/team/Aazam Khan.jpg",
      },
      {
        name: "Deepanshu Savita",
        role: "Co-Founder",
        image: "/images/team/Deepanshu Savita.jpg",
        fallbackImage: "/images/gow.jpg",
      },
      {
        name: "Priyesh Kekan",
        role: "Co-Founder",
        image: "/images/team/Priyesh Kekan.jpg",
        fallbackImage: "/images/bgmi.avif",
      },
      {
        name: "Avinash Sharma",
        role: "CFO",
        image: "/images/team/Avinash Sharma.jpg",
        fallbackImage: "/images/valorantgame.jpeg",
      },
    ],
  };

  // Icon mapping for each department
  const departmentIcons = {
    leadership: <Briefcase className="w-5 h-5 mr-2" />,
  };

  // Department titles
  const departmentTitles = {
    leadership: "Leadership Team",
  };

  // Helper function to render team member cards
  const renderTeamCards = (
    members: any[],
    department: keyof typeof departmentIcons
  ) => (
    <div className="mb-16">
      <motion.div
        className="flex items-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="bg-red-600/20 p-3 rounded-lg mr-3">
          {departmentIcons[department]}
        </div>
        <h3 className="text-2xl font-bold">{departmentTitles[department]}</h3>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {members.map((member: any, index: number) => (
          <motion.div
            key={index}
            className="bg-zinc-900/40 backdrop-blur-sm rounded-lg overflow-hidden group border border-zinc-800 shadow-lg hover:shadow-[0_0_20px_rgba(150,0,0,0.3)]"
            variants={itemVariants}
            whileHover={{ y: -10, borderColor: "rgba(220,38,38,0.5)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative h-[280px] overflow-hidden">
              <Image
                src={member.image || member.fallbackImage}
                alt={member.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // Fallback if the image fails to load
                  e.currentTarget.src = member.fallbackImage;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-300"></div>

              <div className="absolute bottom-0 left-0 w-full p-6">
                <motion.h3
                  className="text-xl font-bold mb-1 group-hover:text-red-500 transition-colors duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  {member.name}
                </motion.h3>

                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="h-0.5 w-10 bg-red-600 mr-2"></div>
                  <p className="text-zinc-300 text-sm">{member.role}</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[350px] sm:h-[400px] overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_2px,transparent_2px),linear-gradient(90deg,rgba(20,20,20,0.5)_2px,transparent_2px)] bg-[size:40px_40px] opacity-30 z-10"></div>

        {/* Red glowing orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-red-600/10 filter blur-[120px] z-10"></div>
        <div className="absolute bottom-[-30%] left-[-20%] w-[500px] h-[500px] rounded-full bg-red-600/5 filter blur-[100px] z-10"></div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 z-10"></div>

        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/banner.jpg?height=400&width=1200"
            alt="Teams Background"
            fill
            className="object-cover"
          />
        </div>

        {/* Scan lines effect */}
        <div className="absolute inset-0 z-10 scan-lines opacity-20"></div>

        {/* Hero content */}
        <div className="container mx-auto relative z-20 h-full flex flex-col justify-center px-4 sm:px-6">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            OUR{" "}
            <motion.span
              className="text-red-600 inline-block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              TEAM
            </motion.span>
          </motion.h1>
          <motion.p
            className="text-lg text-zinc-300 mt-4 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Meet the talented individuals behind Zero Error Esports who make
            excellence happen every day
          </motion.p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.button
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-md flex items-center shadow-[0_0_15px_rgba(150,0,0,0.3)] relative overflow-hidden group"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 25px rgba(220,0,0,0.4)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const teamSection = document.getElementById("team-members");
                if (teamSection) {
                  teamSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center font-bold">
                MEET THE TEAM
                <motion.span
                  initial={{ x: 0 }}
                  animate={{ x: [0, 5, 0] }}
                  transition={{
                    repeat: Infinity,
                    repeatDelay: 2,
                    duration: 1,
                  }}
                >
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.span>
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Team Members Section */}
      <section id="team-members" className="py-12 sm:py-16 relative">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.3)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20"></div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold uppercase mb-8 sm:mb-12 flex items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Users className="mr-3 text-red-600" />
            MEET <span className="text-red-600 ml-2">OUR TEAM</span>
          </motion.h2>

          {/* Render leadership team members */}
          {renderTeamCards(teamMembers.leadership, "leadership")}
        </div>
      </section>

      {/* Join Our Teams */}
      <section className="py-16 relative">
        {/* Subtle diagonal pattern background */}
        <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#333,#333_1px,transparent_1px,transparent_10px)]"></div>

        {/* Red glowing orb */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-red-600/10 filter blur-[120px] opacity-50"></div>

        <div className="container mx-auto px-6 relative">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.h2
              className="text-3xl font-bold uppercase mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              JOIN OUR <span className="text-red-600">TEAM</span>
            </motion.h2>

            <motion.p
              className="text-zinc-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Zero Error Esports is always looking for talented individuals to
              join our team. If you have a passion for esports and want to be
              part of our growing organization, we want to hear from you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Link href="/contact">
                <motion.div
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-md uppercase font-bold text-sm inline-flex items-center relative overflow-hidden group shadow-[0_0_15px_rgba(150,0,0,0.3)]"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 25px rgba(220,0,0,0.4)",
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center">
                    View Open Positions
                    <motion.span
                      initial={{ x: 0 }}
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        repeat: Infinity,
                        repeatDelay: 2,
                        duration: 1,
                      }}
                    >
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </motion.span>
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
