"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { RadialMenuItem, RadialNavigationMenuProps } from "@/types/radial-menu"

/**
 * RadialNavigationMenu Component
 * 
 * An animated semi-circular radial navigation menu that expands from a hamburger icon.
 * Features:
 * - 180° semi-circular arc layout
 * - Staggered animations with spring physics
 * - Hover effects with scale and glow
 * - Tooltips on hover
 * - Full accessibility support (ARIA, keyboard navigation, focus trap)
 * - Responsive sizing based on viewport
 */
export function RadialNavigationMenu({ 
  items, 
  position = "left",
  className 
}: RadialNavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [radius, setRadius] = useState(200)
  const menuRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  // Responsive radius calculation
  useEffect(() => {
    const updateRadius = () => {
      const width = window.innerWidth
      if (width < 768) {
        setRadius(100) // Mobile
      } else if (width < 1024) {
        setRadius(150) // Tablet
      } else {
        setRadius(200) // Desktop
      }
    }

    updateRadius()
    window.addEventListener("resize", updateRadius)
    return () => window.removeEventListener("resize", updateRadius)
  }, [])

  // Calculate position for each item in the semi-circle
  const calculatePosition = (index: number, total: number) => {
    // Distribute items evenly across 180 degrees, opening to the RIGHT
    // Angle range: -90° to +90° (or -π/2 to +π/2)
    // This creates a right-facing semi-circle like phone quick ball menus
    const angleStep = Math.PI / (total + 1)
    const angle = -Math.PI / 2 + angleStep * (index + 1)
    
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    
    return { x, y }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        setIsOpen(false)
        hamburgerRef.current?.focus()
      }

      if (e.key === "Tab") {
        e.preventDefault()
        // Handle tab navigation through menu items
        const focusableElements = menuRef.current?.querySelectorAll<HTMLButtonElement>(
          'button[data-menu-item="true"]'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const currentIndex = Array.from(focusableElements).findIndex(
          (el) => el === document.activeElement
        )

        let nextIndex: number
        if (e.shiftKey) {
          nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1
        } else {
          nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1
        }

        focusableElements[nextIndex]?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Focus trap - focus first item when menu opens
  useEffect(() => {
    if (isOpen && firstItemRef.current) {
      setTimeout(() => {
        firstItemRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleItemClick = (item: RadialMenuItem) => {
    item.onClick()
    setIsOpen(false)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const menuVariants = {
    closed: { rotate: 0 },
    open: { rotate: 90 }
  }

  const itemVariants = {
    closed: { 
      scale: 0, 
      opacity: 0,
      x: 0,
      y: 0
    },
    open: (custom: { index: number; position: { x: number; y: number } }) => ({
      scale: 1,
      opacity: 1,
      x: custom.position.x,
      y: custom.position.y,
      transition: {
        delay: custom.index * 0.05,
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
        mass: 1
      }
    })
  }

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[1000]",
        "top-1/2 -translate-y-1/2",
        "transition-all duration-300 ease-out",
        className
      )}
      style={{
        left: isOpen ? '20px' : '-24px',
      }}
      role="navigation"
      aria-label="Radial navigation menu"
    >
      {/* Hamburger Button */}
      <motion.button
        ref={hamburgerRef}
        onClick={handleToggle}
        className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-red-600/80 to-red-700/80 backdrop-blur-md rounded-full shadow-lg shadow-red-500/50 hover:shadow-red-500/70 hover:from-red-600 hover:to-red-700 transition-all duration-300 border border-white/10 flex items-center justify-center group z-[1001]"
        variants={menuVariants}
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.3, ease: "easeOut" }}
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
        aria-controls="radial-menu-items"
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" strokeWidth={1.5} />
            </motion.div>
          ) : (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" strokeWidth={1.5} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse effect when closed */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.button>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div
            id="radial-menu-items"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            role="menu"
          >
            {items.map((item, index) => {
              const position = calculatePosition(index, items.length)
              const Icon = item.icon
              const isAdmin = item.variant === "admin"
              const isHovered = hoveredItem === item.id

              return (
                <motion.div
                  key={item.id}
                  className="absolute"
                  custom={{ index, position }}
                  variants={itemVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  style={{
                    left: 0,
                    top: 0
                  }}
                >
                  <motion.button
                    ref={index === 0 ? firstItemRef : null}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onFocus={() => setHoveredItem(item.id)}
                    onBlur={() => setHoveredItem(null)}
                    className={cn(
                      "relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full backdrop-blur-md shadow-lg transition-all duration-200 border border-white/10 flex items-center justify-center group",
                      isAdmin
                        ? "bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 shadow-purple-500/30 hover:shadow-purple-500/70"
                        : "bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 shadow-red-500/30 hover:shadow-red-500/70",
                      item.className
                    )}
                    style={{
                      left: position.x,
                      top: position.y,
                      transformOrigin: 'center center'
                    }}
                    whileHover={{ 
                      scale: 1.15,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    role="menuitem"
                    aria-label={item.label}
                    data-menu-item="true"
                    tabIndex={0}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white relative z-10" strokeWidth={1.5} />
                    
                    {/* Glow effect on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-full blur-xl",
                            isAdmin ? "bg-purple-500/50" : "bg-blue-500/50"
                          )}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1.2 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-4 pointer-events-none"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        role="tooltip"
                      >
                        <div className="relative bg-black/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-xl border border-white/10">
                          {item.label}
                          
                          {/* Arrow */}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-black/90" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {isOpen ? "Navigation menu opened" : "Navigation menu closed"}
      </div>
    </div>
  )
}
