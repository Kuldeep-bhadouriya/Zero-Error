// components/GameCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, Trophy } from "lucide-react";

interface GameCardProps {
  title: string;
  image: string;
}

const GameCard: React.FC<GameCardProps> = ({ title, image }) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-zinc-800/60 group"
      style={{
        background: "rgba(24, 24, 27, 0.7)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.36)",
      }}
      whileHover={{
        y: -10,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={image || "/event.jpg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <div className="flex justify-between text-sm text-zinc-400"></div>
      </div>
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-red-600"
        initial={{ width: 0 }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
      />
    </motion.div>
  );
};

export default GameCard;
