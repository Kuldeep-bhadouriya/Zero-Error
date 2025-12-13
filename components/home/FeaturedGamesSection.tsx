"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import GameCard from "../GameCard";

const FeaturedGamesSection = () => {
  const games = [
    {
      title: "Gaming Tournaments & Events",
      image: "/images/GamingTournament&Events.png?height=200&width=350",
    },
    {
      title: "Talent Management",
      image: "/images/TalentManagement.png?height=200&width=350",
    },
    {
      title: "Brand Activations",
      image: "/images/BrandActivation.png?height=200&width=350",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="max-w-5xl mx-auto px-6 relative">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100px" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="h-0.5 bg-red-600 mx-auto mb-4"
          />
          <h2 className="text-4xl font-bold uppercase mb-4">
            Featured Services
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Here are some featured Services.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
            >
              <GameCard title={game.title} image={game.image} />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <Link href="/services">
            <motion.button
              className="bg-transparent border-2 border-zinc-700 hover:border-red-600 text-white px-8 py-3 rounded-md uppercase tracking-wider font-medium relative overflow-hidden group"
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(220,38,38,0.1)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">View All Services</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedGamesSection;
