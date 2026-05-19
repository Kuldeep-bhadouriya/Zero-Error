import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ZEClubPageHeaderProps {
  eyebrow?: string
  title: string
  highlight?: string
  subtitle?: string
  action?: ReactNode
  align?: "left" | "center"
  className?: string
}

export default function ZEClubPageHeader({
  eyebrow,
  title,
  highlight,
  subtitle,
  action,
  align = "left",
  className
}: ZEClubPageHeaderProps) {
  const isCentered = align === "center"

  return (
    <div className={cn("relative z-10 flex flex-col gap-3", isCentered && "items-center text-center", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3",
          isCentered && "flex-col"
        )}
      >
        <div>
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.32em] text-zinc-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
            {highlight ? (
              <>
                {title} <span className="text-red-300">{highlight}</span>
              </>
            ) : (
              title
            )}
          </h1>
        </div>
        {action && <div>{action}</div>}
      </div>
      {subtitle && (
        <p className={cn("text-sm text-zinc-400", isCentered && "max-w-2xl")}>{subtitle}</p>
      )}
    </div>
  )
}
