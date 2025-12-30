import { LucideIcon } from "lucide-react"

/**
 * Radial Menu Item Interface
 * 
 * Defines the structure for individual items in the radial navigation menu.
 */
export interface RadialMenuItem {
  /** Unique identifier for the menu item */
  id: string
  
  /** Lucide icon component to display */
  icon: LucideIcon
  
  /** Label text shown in tooltip on hover */
  label: string
  
  /** Click handler function */
  onClick: () => void
  
  /** Optional CSS class name for custom styling */
  className?: string
  
  /** Visual variant - 'admin' items have purple gradient */
  variant?: "default" | "admin"
}

/**
 * Radial Navigation Menu Props
 * 
 * Configuration options for the RadialNavigationMenu component.
 */
export interface RadialNavigationMenuProps {
  /** Array of menu items to display in the radial arc */
  items: RadialMenuItem[]
  
  /** Position of the menu on the screen */
  position?: "left" | "right"
  
  /** Optional CSS class name for the container */
  className?: string
}
