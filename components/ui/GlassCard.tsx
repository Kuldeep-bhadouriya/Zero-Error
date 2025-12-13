import { cn } from "@/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Variant controls the glass effect intensity
   * - default: Standard dark glass with medium blur
   * - subtle: Lighter glass with less opacity
   * - intense: Darker glass with more blur
   */
  variant?: "default" | "subtle" | "intense"
  
  /**
   * Enable hover effect with subtle lift and glow
   */
  hover?: boolean
  
  /**
   * Add gradient overlay (useful for headers or featured cards)
   */
  gradient?: "red" | "orange" | "purple" | "blue" | "none"
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", hover = false, gradient = "none", children, ...props }, ref) => {
    const baseStyles = "rounded-xl border transition-all duration-300 ease-out"
    
    const variantStyles = {
      default: "bg-[rgba(0,0,0,0.55)] backdrop-blur-md border-white/8",
      subtle: "bg-[rgba(10,10,10,0.4)] backdrop-blur-sm border-white/5",
      intense: "bg-[rgba(0,0,0,0.7)] backdrop-blur-lg border-white/10",
    }
    
    const hoverStyles = hover
      ? "hover:-translate-y-0.5 hover:border-opacity-20 hover:shadow-lg cursor-pointer"
      : ""
    
    const gradientOverlays = {
      red: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-red-500/5 before:to-transparent before:pointer-events-none",
      orange: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-orange-500/5 before:to-transparent before:pointer-events-none",
      purple: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-purple-500/5 before:to-transparent before:pointer-events-none",
      blue: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-blue-500/5 before:to-transparent before:pointer-events-none",
      none: "",
    }
    
    const hoverGlow = hover && gradient !== "none"
      ? {
          red: "hover:shadow-red-500/20",
          orange: "hover:shadow-orange-500/20",
          purple: "hover:shadow-purple-500/20",
          blue: "hover:shadow-blue-500/20",
        }[gradient]
      : ""

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          hoverStyles,
          gradientOverlays[gradient],
          hoverGlow,
          "relative",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = "GlassCard"

export { GlassCard }
