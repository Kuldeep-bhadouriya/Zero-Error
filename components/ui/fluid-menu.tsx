"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

interface MenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
  showChevron?: boolean
}

export function Menu({ trigger, children, align = "left", showChevron = true }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer inline-flex items-center"
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        {showChevron && (
          <ChevronDown className="ml-2 -mr-1 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-9 focus:outline-none z-50`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  icon?: React.ReactNode
  isActive?: boolean
  className?: string
}

export function MenuItem({ children, onClick, disabled = false, icon, isActive = false, className }: MenuItemProps) {
  return (
    <button
      className={`relative block w-full h-12 text-center group outline-none focus:outline-none focus-visible:outline-none select-none
        ${disabled ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-white"}
        ${isActive ? "bg-white/10" : ""}
      `}
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className="flex items-center justify-center h-full">
        {icon && (
          <span className="h-5 w-5 transition-all duration-200 group-hover:[&_svg]:stroke-[2.5] group-hover:scale-110">
            {icon}
          </span>
        )}
        {children}
      </span>
    </button>
  )
}

export function MenuContainer({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const childrenArray = React.Children.toArray(children)
  const totalItems = childrenArray.length

  const handleToggle = () => {
    if (isExpanded) {
      setIsExpanded(false)
    } else {
      setIsExpanded(true)
    }
  }

  return (
    <div className="relative w-[48px]" data-expanded={isExpanded}>
      {/* Container for all items */}
      <div className="relative">
        {/* First item - always visible */}
        <div 
          className="relative w-12 h-12 bg-gradient-to-r from-red-600/70 to-red-700/70 backdrop-blur-md cursor-pointer rounded-full group will-change-transform z-50 shadow-lg shadow-red-500/50 hover:from-red-600/90 hover:to-red-700/90 transition-all border border-white/10"
          onClick={handleToggle}
        >
          {childrenArray[0]}
        </div>

        {/* Other items */}
        {childrenArray.slice(1).map((child: any, index) => {
          const isAdmin = child?.props?.className?.includes('admin-button')
          return (
          <div 
            key={index} 
            className={`absolute top-0 left-0 w-12 h-12 backdrop-blur-md will-change-transform shadow-lg transition-all rounded-full border border-white/10 ${
              isAdmin 
                ? 'bg-gradient-to-r from-purple-600/70 to-indigo-600/70 hover:from-purple-600/90 hover:to-indigo-600/90 shadow-purple-500/30' 
                : 'bg-gradient-to-r from-red-600/70 to-red-700/70 hover:from-red-600/90 hover:to-red-700/90 shadow-red-500/30'
            }`}
            style={{
              transform: `translateY(${isExpanded ? -(index + 1) * 56 : 0}px)`,
              opacity: isExpanded ? 1 : 0,
              zIndex: 40 - index,
              transition: `transform ${isExpanded ? '300ms' : '300ms'} cubic-bezier(0.4, 0, 0.2, 1),
                         opacity ${isExpanded ? '300ms' : '350ms'}`,
              backfaceVisibility: 'hidden',
              perspective: 1000,
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            {child}
          </div>
        )})}
      </div>
    </div>
  )
}
