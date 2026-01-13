"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Calendar, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Event {
  _id: string
  title: string
  description: string
  eventDate: string
  eventType: 'upcoming' | 'past'
  imageUrl?: string
  location?: string
  registrationLink?: string
  featured: boolean
  games: string[]
  organizer: string
}

const PastEventsSection = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      const response = await fetch('/api/events?eventType=past&limit=3')
      const data = await response.json()
      
      if (data.success) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching past events:', error)
    } finally {
      setLoading(false)
    }
  }

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
      transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] },
    },
  };

  if (loading) {
    return (
      <section className="py-24 relative bg-transparent">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-zinc-500">Loading past events...</p>
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    return null // Don't show section if no past events
  }

  return (
    <section className="py-12 sm:py-16 md:py-24 relative bg-transparent">
      {/* Subtle diagonal pattern background */}
      <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#333,#333_1px,transparent_1px,transparent_10px)]"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative flex flex-col items-center">
        {/* Section header */}
        <motion.div
          className="flex flex-wrap justify-center items-center mb-8 sm:mb-12 md:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <div>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="h-0.5 bg-gradient-to-r from-red-600 to-transparent mb-4 max-w-[200px] mx-auto"
            />
            <h2 className="text-2xl sm:text-3xl font-bold uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              PAST EVENTS
            </h2>
            <p className="text-zinc-500 mt-2 text-sm sm:text-base">
              Check out our previous successful tournaments and events
            </p>
          </div>
        </motion.div>

        {/* Events cards grid */}
        <motion.div
          className="grid grid-cols-1 gap-8 justify-items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {events.map((event) => (
            <motion.div
              key={event._id}
              className="group"
              variants={itemVariants}
              whileHover={{ y: -10 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
              }}
            >
              <Link href="/events" className="block">
                <div className="relative h-[200px] sm:h-[240px] md:h-[280px] w-full sm:w-[350px] md:w-[400px] overflow-hidden bg-zinc-900 rounded-xl mb-5 border border-zinc-800 shadow-lg group-hover:border-red-600/50 transition-colors duration-300">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 350px, 400px"
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <Calendar className="w-20 h-20 text-zinc-700" />
                    </div>
                  )}
                  <motion.div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  
                  <div className="absolute bottom-0 left-0 p-5 w-full">
                    <div className="flex items-center mb-3 gap-2">
                      <motion.span
                        className="bg-red-600 p-1.5 rounded-md flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Calendar className="w-4 h-4" />
                      </motion.span>
                      <span className="text-xs uppercase text-white font-bold tracking-wider">
                        Past Event
                      </span>
                      {event.featured && (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors duration-300">
                      {event.title}
                    </h3>
                    
                    <div className="flex flex-col text-zinc-400 text-sm space-y-1">
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 3 }}
                        className="flex items-center"
                      >
                        <Calendar className="w-3 h-3 mr-2 text-zinc-500" />
                        {format(new Date(event.eventDate), 'MMM dd, yyyy')}
                      </motion.span>
                      {event.location && (
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 3 }}
                          className="flex items-center"
                        >
                          <MapPin className="w-3 h-3 mr-2 text-zinc-500" />
                          {event.location}
                        </motion.span>
                      )}
                    </div>

                    {event.games.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.games.slice(0, 3).map((game) => (
                          <Badge key={game} variant="secondary" className="text-xs">
                            {game}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center text-red-500 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>View event gallery</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View all events link */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link href="/events">
            <Button variant="outline" className="group">
              View All Events
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PastEventsSection;
