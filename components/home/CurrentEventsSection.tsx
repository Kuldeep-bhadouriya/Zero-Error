"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ExternalLink, Clock, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Event {
  _id: string
  title: string
  description: string
  eventDate: string
  eventType?: 'upcoming' | 'past' | 'current'
  imageUrl?: string
  location?: string
  registrationLink?: string
  games: string[]
  organizer: string
  maxParticipants?: number
  currentParticipants: number
}

const CurrentEventsSection = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentEvents()
  }, [])

  async function fetchCurrentEvents() {
    try {
      const response = await fetch('/api/events?eventType=current')
      const data = await response.json()
      
      if (data.success) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching current events:', error)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  if (loading) {
    return (
      <section className="py-20 relative bg-transparent">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-zinc-400">Checking for live events...</p>
          </div>
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    return (
      <section className="py-16 relative bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
              <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
              <span className="text-zinc-400 font-medium text-sm uppercase tracking-wider">
                No Live Events
              </span>
            </div>
            <p className="text-zinc-500 text-sm">
              Check back later or view our upcoming events below
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 relative bg-transparent overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Pulsing gradient orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Section Header with Live Indicator */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(239, 68, 68, 0.4)",
                  "0 0 0 10px rgba(239, 68, 68, 0)",
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.div
                className="w-3 h-3 bg-red-500 rounded-full"
                animate={{
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span className="text-red-500 font-semibold text-sm uppercase tracking-wider">
                Live Now
              </span>
            </motion.div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Happening Right Now
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Join the action! These events are currently underway
          </p>
        </motion.div>

        {/* Events Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {events.map((event) => (
            <motion.div
              key={event._id}
              variants={itemVariants}
              className="group relative"
            >
              {/* Card Container */}
              <div className="relative h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all duration-500">
                {/* Live Badge Overlay */}
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-red-500 text-white border-0 px-3 py-1 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className="w-2 h-2 bg-white rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      LIVE
                    </div>
                  </Badge>
                </div>

                {/* Event Image */}
                <div className="relative h-56 overflow-hidden">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center">
                      <Gamepad2 className="w-16 h-16 text-zinc-600" />
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent opacity-60" />
                </div>

                {/* Event Details */}
                <div className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300">
                    {event.title}
                  </h3>

                  <p className="text-zinc-400 line-clamp-2 text-sm leading-relaxed">
                    {event.description}
                  </p>

                  {/* Event Meta Information */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span>{format(new Date(event.eventDate), "MMM dd, yyyy • h:mm a")}</span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.maxParticipants && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>
                          {event.currentParticipants} / {event.maxParticipants} participants
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Games Tags */}
                  {event.games && event.games.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {event.games.slice(0, 3).map((game, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="border-zinc-700 text-zinc-300 hover:border-red-500/50 hover:text-red-400 transition-colors"
                        >
                          {game}
                        </Badge>
                      ))}
                      {event.games.length > 3 && (
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                          +{event.games.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 flex gap-3">
                    {event.registrationLink && (
                      <Button
                        asChild
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0 group/btn"
                      >
                        <a
                          href={event.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Join Now
                          <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                    )}
                    <Button
                      asChild
                      variant="outline"
                      className="border-zinc-700 hover:border-red-500 hover:text-red-400"
                    >
                      <Link href="/events">Details</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </motion.div>

        {/* View All Events Link */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Button
            asChild
            variant="outline"
            className="border-zinc-700 hover:border-red-500 hover:text-red-400 group"
          >
            <Link href="/events">
              View All Events
              <motion.span
                className="ml-2"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CurrentEventsSection;
