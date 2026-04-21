"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { Coins, Flame, Star, Target, Trophy } from "lucide-react"

interface UserDashboard {
  totalPoints: number
  zeCoins: number
  experience: number
  rank: string
  leaderboardRank?: number
  badge: string
  progress: number
  rankIcon: string
  progressToNextRank: number
  nextRankPoints: number
  currentRankPoints: number
}

interface FeaturedMission {
  _id: string
  name: string
  points: number
  difficulty: "Easy" | "Medium" | "Hard"
}

export interface BentoProps {
  textAutoHide?: boolean
  enableStars?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  disableAnimations?: boolean
  spotlightRadius?: number
  particleCount?: number
  enableTilt?: boolean
  glowColor?: string
  clickEffect?: boolean
  enableMagnetism?: boolean
  dashboardData: UserDashboard
}

const DEFAULT_PARTICLE_COUNT = 12
const DEFAULT_SPOTLIGHT_RADIUS = 300
const DEFAULT_GLOW_COLOR = "239, 68, 68"
const MOBILE_BREAKPOINT = 768

const createParticleElement = (x: number, y: number, color: string = DEFAULT_GLOW_COLOR): HTMLDivElement => {
  const el = document.createElement("div")
  el.className = "particle"
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `
  return el
}

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
})

const updateCardGlowProperties = (card: HTMLElement, mouseX: number, mouseY: number, glow: number, radius: number) => {
  const rect = card.getBoundingClientRect()
  const relativeX = ((mouseX - rect.left) / rect.width) * 100
  const relativeY = ((mouseY - rect.top) / rect.height) * 100

  card.style.setProperty("--glow-x", `${relativeX}%`)
  card.style.setProperty("--glow-y", `${relativeY}%`)
  card.style.setProperty("--glow-intensity", glow.toString())
  card.style.setProperty("--glow-radius", `${radius}px`)
}

function StatPill({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.13em] text-zinc-300/90">
        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-red-400/20 bg-red-500/10 text-red-300">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span>{label}</span>
      </div>
      <p className="text-[clamp(1.1rem,1.6vw,1.45rem)] font-semibold tracking-tight text-zinc-100 drop-shadow-[0_0_12px_rgba(239,68,68,0.2)]">{value}</p>
    </div>
  )
}

const ParticleCard: React.FC<{
  children: React.ReactNode
  className?: string
  disableAnimations?: boolean
  style?: React.CSSProperties
  particleCount?: number
  glowColor?: string
  enableTilt?: boolean
  clickEffect?: boolean
  enableMagnetism?: boolean
}> = ({
  children,
  className = "",
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement[]>([])
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const isHoveredRef = useRef(false)
  const memoizedParticles = useRef<HTMLDivElement[]>([])
  const particlesInitialized = useRef(false)
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null)

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return

    const { width, height } = cardRef.current.getBoundingClientRect()
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    )
    particlesInitialized.current = true
  }, [particleCount, glowColor])

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    magnetismAnimationRef.current?.kill()

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          particle.parentNode?.removeChild(particle)
        }
      })
    })
    particlesRef.current = []
  }, [])

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return

    if (!particlesInitialized.current) {
      initializeParticles()
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return

        const clone = particle.cloneNode(true) as HTMLDivElement
        cardRef.current.appendChild(clone)
        particlesRef.current.push(clone)

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" })

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: "none",
          repeat: -1,
          yoyo: true
        })

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true
        })
      }, index * 100)

      timeoutsRef.current.push(timeoutId)
    })
  }, [initializeParticles])

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return

    const element = cardRef.current

    const handleMouseEnter = () => {
      isHoveredRef.current = true
      animateParticles()

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: "power2.out",
          transformPerspective: 1000
        })
      }
    }

    const handleMouseLeave = () => {
      isHoveredRef.current = false
      clearAllParticles()

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: "power2.out"
        })
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return

      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10
        const rotateY = ((x - centerX) / centerX) * 10

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000
        })
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05
        const magnetY = (y - centerY) * 0.05

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return

      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      )

      const ripple = document.createElement("div")
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `

      element.appendChild(ripple)

      gsap.fromTo(
        ripple,
        {
          scale: 0,
          opacity: 1
        },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => ripple.remove()
        }
      )
    }

    element.addEventListener("mouseenter", handleMouseEnter)
    element.addEventListener("mouseleave", handleMouseLeave)
    element.addEventListener("mousemove", handleMouseMove)
    element.addEventListener("click", handleClick)

    return () => {
      isHoveredRef.current = false
      element.removeEventListener("mouseenter", handleMouseEnter)
      element.removeEventListener("mouseleave", handleMouseLeave)
      element.removeEventListener("mousemove", handleMouseMove)
      element.removeEventListener("click", handleClick)
      clearAllParticles()
    }
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor])

  return (
    <div
      ref={cardRef}
      className={`${className} relative overflow-hidden`}
      style={{ ...style, position: "relative", overflow: "hidden" }}
    >
      {children}
    </div>
  )
}

const GlobalSpotlight: React.FC<{
  gridRef: React.RefObject<HTMLDivElement | null>
  disableAnimations?: boolean
  enabled?: boolean
  spotlightRadius?: number
  glowColor?: string
}> = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return

    const spotlight = document.createElement("div")
    spotlight.className = "global-spotlight"
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `
    document.body.appendChild(spotlight)
    spotlightRef.current = spotlight

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return

      const section = gridRef.current.closest(".bento-section")
      const rect = section?.getBoundingClientRect()
      const mouseInside =
        rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom

      const cards = gridRef.current.querySelectorAll(".card")

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        })
        cards.forEach((card) => {
          (card as HTMLElement).style.setProperty("--glow-intensity", "0")
        })
        return
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius)
      let minDistance = Infinity

      cards.forEach((card) => {
        const cardElement = card as HTMLElement
        const cardRect = cardElement.getBoundingClientRect()
        const centerX = cardRect.left + cardRect.width / 2
        const centerY = cardRect.top + cardRect.height / 2
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2
        const effectiveDistance = Math.max(0, distance)

        minDistance = Math.min(minDistance, effectiveDistance)

        let glowIntensity = 0
        if (effectiveDistance <= proximity) {
          glowIntensity = 1
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity)
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius)
      })

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: "power2.out"
      })

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: "power2.out"
      })
    }

    const handleMouseLeave = () => {
      gridRef.current?.querySelectorAll(".card").forEach((card) => {
        (card as HTMLElement).style.setProperty("--glow-intensity", "0")
      })
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current)
    }
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor])

  return null
}

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

function ZEClubMagicBento({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
  dashboardData
}: BentoProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobileDetection()
  const shouldDisableAnimations = disableAnimations || isMobile
  const [featuredMissions, setFeaturedMissions] = useState<FeaturedMission[]>([])
  const rankOrder = ["Rookie", "Contender", "Gladiator", "Vanguard", "Errorless Legend"]
  const currentRankIndex = rankOrder.indexOf(dashboardData.rank)
  const nextRank = currentRankIndex >= 0 && currentRankIndex < rankOrder.length - 1
    ? rankOrder[currentRankIndex + 1]
    : "Max Rank"
  const pointsToNextRank = Math.max(0, dashboardData.nextRankPoints - dashboardData.experience)
  const coinToPointRatio = dashboardData.totalPoints > 0 ? (dashboardData.zeCoins / dashboardData.totalPoints) * 100 : 0
  const coinMilestones = [500, 1000, 2500, 5000, 10000]
  const nextCoinMilestone = coinMilestones.find((milestone) => dashboardData.zeCoins < milestone)
  const coinMilestoneProgress = nextCoinMilestone
    ? Math.min(100, Math.round((dashboardData.zeCoins / nextCoinMilestone) * 100))
    : 100
  const rankProgress = Math.max(0, Math.min(100, dashboardData.progressToNextRank))
  const leaderboardRank = dashboardData.leaderboardRank
  const leaderboardBand = !leaderboardRank
    ? "Unranked"
    : leaderboardRank <= 10
      ? "Top 10"
      : leaderboardRank <= 25
        ? "Top 25"
        : leaderboardRank <= 50
          ? "Top 50"
          : "Climbing"
  const xpContribution = dashboardData.totalPoints > 0
    ? Math.min(100, Math.round((dashboardData.experience / dashboardData.totalPoints) * 100))
    : 0

  useEffect(() => {
    async function fetchFeaturedMissions() {
      try {
        const response = await fetch("/api/ze-club/user/featured-missions")
        if (!response.ok) return
        const data: FeaturedMission[] = await response.json()
        setFeaturedMissions(data.slice(0, 3))
      } catch {
        setFeaturedMissions([])
      }
    }

    fetchFeaturedMissions()
  }, [])

  const baseClassName = `card flex flex-col relative aspect-[4/3] w-full max-w-full p-4 sm:p-5 rounded-[20px] border border-solid font-normal overflow-hidden transition-colors duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(239,68,68,0.15)] ${
    enableBorderGlow ? "card--border-glow" : ""
  }`

  const cardStyle = {
    background:
      "linear-gradient(155deg, rgba(8,8,12,0.96) 0%, rgba(19,9,11,0.95) 55%, rgba(34,15,7,0.93) 100%)",
    borderColor: "var(--border-color)",
    color: "var(--white)",
    "--glow-x": "50%",
    "--glow-y": "50%",
    "--glow-intensity": "0",
    "--glow-radius": "200px"
  } as React.CSSProperties

  const renderCard = (
    index: number,
    children: React.ReactNode,
    size: "small" | "large" = "small",
    alignment: "between" | "top" = "between"
  ) => {
    const sizeClassName = size === "large"
      ? "tile-large min-h-[260px] sm:min-h-[280px] lg:min-h-[380px]"
      : "tile-small min-h-[132px] sm:min-h-[155px] lg:min-h-[165px]"
    const alignmentClassName = alignment === "top" ? "justify-start" : "justify-between"

    if (!enableStars) {
      return (
        <div key={index} className={`${baseClassName} ${sizeClassName} ${alignmentClassName}`} style={cardStyle}>
          {children}
        </div>
      )
    }

    return (
      <ParticleCard
        key={index}
        className={`${baseClassName} ${sizeClassName} ${alignmentClassName}`}
        style={cardStyle}
        disableAnimations={shouldDisableAnimations}
        particleCount={particleCount}
        glowColor={glowColor}
        enableTilt={enableTilt}
        clickEffect={clickEffect}
        enableMagnetism={enableMagnetism}
      >
        {children}
      </ParticleCard>
    )
  }

  return (
    <>
      <style>
        {`
          .bento-section {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-radius: 200px;
            --glow-color: ${glowColor};
            --border-color: rgba(239, 68, 68, 0.25);
            --background-dark: #060010;
            --white: hsl(0, 0%, 100%);
          }

          .card {
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .card::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at 80% 10%, rgba(249, 115, 22, 0.14), transparent 35%),
              radial-gradient(circle at 10% 100%, rgba(239, 68, 68, 0.12), transparent 35%);
            pointer-events: none;
            z-index: 0;
          }

          .card > * {
            position: relative;
            z-index: 1;
          }

          .card-responsive {
            grid-template-columns: 1fr;
            width: 100%;
          }

          @media (max-width: 699px) {
            .tile-small,
            .tile-large {
              aspect-ratio: auto;
            }

            .tile-title {
              letter-spacing: 0.11em;
            }
          }

          @media (min-width: 700px) {
            .card-responsive {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .card-responsive {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            .card-responsive .card:nth-child(3) {
              grid-column: span 2;
              grid-row: span 2;
              aspect-ratio: auto;
            }

            .card-responsive .card:nth-child(4) {
              grid-column: 1 / span 2;
              grid-row: 2 / span 2;
              aspect-ratio: auto;
            }

            .card-responsive .card:nth-child(6) {
              grid-column: 4;
              grid-row: 3;
            }
          }

          .card--border-glow::after {
            content: "";
            position: absolute;
            inset: 0;
            padding: 5px;
            background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
                rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%,
                rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 30%,
                transparent 60%);
            border-radius: inherit;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            pointer-events: none;
            z-index: 1;
          }

          .tile-title {
            letter-spacing: 0.14em;
            font-size: 0.78rem;
            font-weight: 600;
            color: rgba(228, 228, 231, 0.92);
          }

          .card__title {
            font-size: clamp(1.75rem, 2.65vw, 2.45rem);
            line-height: 0.95;
            letter-spacing: -0.03em;
            font-weight: 650;
            color: rgba(250, 250, 250, 0.98);
          }

          .card__body-copy {
            font-size: 0.82rem;
            letter-spacing: 0.02em;
            line-height: 1.45;
            color: rgba(212, 212, 216, 0.9);
          }

          .card__meta-label {
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.11em;
            color: rgba(161, 161, 170, 0.94);
          }

          .card__meta-value {
            margin-top: 0.2rem;
            font-size: 0.9rem;
            font-weight: 560;
            letter-spacing: 0.005em;
            color: rgba(244, 244, 245, 0.98);
          }

          .card__chip {
            font-size: 0.66rem;
            font-weight: 600;
            letter-spacing: 0.13em;
          }

          .text-clamp-1 {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}
      </style>

      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <div className="bento-section grid gap-3 p-0 select-none" ref={gridRef}>
          <div className="card-responsive grid gap-2.5 sm:gap-3">
          {renderCard(
            0,
            <>
              <div className="card__header flex justify-between gap-3 relative text-white">
                <span className="tile-title card__label text-sm uppercase text-zinc-300">ZE Coins</span>
                <Coins className="h-4 w-4 text-amber-300" />
              </div>
              <div className="card__content flex flex-col gap-2.5 relative text-white">
                <div className="flex items-end justify-between gap-3">
                  <h3 className={`card__title m-0 ${textAutoHide ? "text-clamp-1" : ""}`}>
                    {dashboardData.zeCoins.toLocaleString()}
                  </h3>
                  <span className="card__chip rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 uppercase text-amber-200">
                    Active Wallet
                  </span>
                </div>
                <p className="card__body-copy">Coins ready for reward redemptions.</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
                    <p className="card__meta-label">Coin Ratio</p>
                    <p className="card__meta-value">{coinToPointRatio.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
                    <p className="card__meta-label">Next Target</p>
                    <p className="card__meta-value">
                      {nextCoinMilestone ? nextCoinMilestone.toLocaleString() : "Maxed"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
                    <span>Milestone Track</span>
                    <span>{coinMilestoneProgress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900/90">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500/70 via-amber-300/80 to-orange-300/80 transition-all duration-500"
                      style={{ width: `${coinMilestoneProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {renderCard(
            1,
            <>
              <div className="card__header flex justify-between gap-3 relative text-white">
                <span className="tile-title card__label text-sm uppercase text-zinc-300">ZE Points</span>
                <Star className="h-4 w-4 text-rose-300" />
              </div>
              <div className="card__content flex flex-col gap-2.5 relative text-white">
                <div className="flex items-end justify-between gap-3">
                  <h3 className={`card__title m-0 ${textAutoHide ? "text-clamp-1" : ""}`}>
                    {dashboardData.experience.toLocaleString()}
                  </h3>
                  <span className="card__chip rounded-full border border-rose-300/30 bg-rose-300/10 px-2 py-0.5 uppercase text-rose-200">
                    XP Active
                  </span>
                </div>
                <p className="card__body-copy">Season XP accumulated so far.</p>

                <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs">
                  <div className="mb-1.5 flex items-center justify-between uppercase tracking-wider text-zinc-400">
                    <span>Promotion Track</span>
                    <span>{rankProgress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900/90">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500/70 via-red-400/80 to-orange-300/80 transition-all duration-500"
                      style={{ width: `${rankProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-zinc-300">
                  <span className="text-zinc-400">Needed for {nextRank} Tier</span>
                  <span className="font-medium text-white">{pointsToNextRank.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          {renderCard(
            2,
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="tile-title text-sm uppercase text-zinc-300">Rank Progress</span>
                <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-red-200">
                  Elite Tier
                </span>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <StatPill icon={Trophy} label="Current Rank" value={dashboardData.rank} />
                <StatPill icon={Target} label="Progress" value={`${dashboardData.progressToNextRank}%`} />
              </div>

              <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-black/50 via-black/35 to-red-950/20 p-4">
                <div className="mb-2 text-sm uppercase tracking-wide text-zinc-400">Promotion Intel</div>
                <div className="grid gap-2 text-sm text-zinc-200 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-xs text-zinc-400">Next Tier</p>
                    <p className="font-medium text-white">{nextRank}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-xs text-zinc-400">XP Required</p>
                    <p className="font-medium text-white">{pointsToNextRank.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </>,
            "large"
          )}

          {renderCard(
            3,
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
                <span className="tile-title text-sm uppercase text-zinc-300">Featured Missions</span>
                <Link href="/ze-club/missions" className="text-xs font-medium text-fuchsia-300 hover:text-fuchsia-200 whitespace-nowrap">
                  Open Missions
                </Link>
              </div>

              <div className="rounded-xl border border-orange-400/20 bg-gradient-to-br from-black/50 via-black/35 to-orange-950/20 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Flame className="h-4 w-4 text-orange-400" />
                  Active Picks
                </div>

                <div className="space-y-2">
                  {featuredMissions.length > 0 ? (
                    featuredMissions.map((mission) => (
                      <Link
                        href={`/ze-club/missions#${mission._id}`}
                        key={mission._id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-200 transition-colors hover:border-orange-300/60 hover:bg-orange-400/10"
                      >
                        <div className="mr-3 min-w-0">
                          <span className="block truncate text-sm text-white">{mission.name}</span>
                          <span className="text-xs uppercase tracking-wider text-zinc-400">{mission.difficulty}</span>
                        </div>
                        <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-amber-200">
                          +{mission.points}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400">No featured missions available right now.</p>
                  )}
                </div>
              </div>
            </>,
            "large",
            "top"
          )}

          {renderCard(
            4,
            <>
              <div className="card__header flex justify-between gap-3 relative text-white">
                <span className="tile-title card__label text-sm uppercase text-zinc-300">Leaderboard</span>
                <Trophy className="h-4 w-4 text-yellow-300" />
              </div>
              <div className="card__content flex flex-col gap-2.5 relative text-white">
                <div className="flex items-end justify-between gap-3">
                  <h3 className={`card__title m-0 ${textAutoHide ? "text-clamp-1" : ""}`}>
                    {leaderboardRank ? `#${leaderboardRank}` : "-"}
                  </h3>
                  <span className="card__chip rounded-full border border-yellow-300/30 bg-yellow-300/10 px-2 py-0.5 uppercase text-yellow-200">
                    {leaderboardBand}
                  </span>
                </div>
                <p className="card__body-copy">Current standing in this season.</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
                    <p className="card__meta-label">Bracket</p>
                    <p className="card__meta-value">{leaderboardBand}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
                    <p className="card__meta-label">Board State</p>
                    <p className="card__meta-value">Season Live</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {renderCard(
            5,
            <>
              <div className="card__header flex justify-between gap-3 relative text-white">
                <span className="tile-title card__label text-sm uppercase text-zinc-300">Total Points</span>
                <Target className="h-4 w-4 text-red-300" />
              </div>
              <div className="card__content flex flex-col gap-2.5 relative text-white">
                <div className="flex items-end justify-between gap-3">
                  <h3 className={`card__title m-0 ${textAutoHide ? "text-clamp-1" : ""}`}>
                    {dashboardData.totalPoints.toLocaleString()}
                  </h3>
                  <span className="card__chip rounded-full border border-red-300/30 bg-red-300/10 px-2 py-0.5 uppercase text-red-200">
                    Legacy Total
                  </span>
                </div>
                <p className="card__body-copy">All-time ZE Club points on record.</p>

                <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-zinc-300">
                  <div className="mb-1.5 flex items-center justify-between uppercase tracking-wider text-zinc-400">
                    <span>Season Share</span>
                    <span>{xpContribution}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900/90">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500/75 via-rose-400/80 to-orange-300/75 transition-all duration-500"
                      style={{ width: `${xpContribution}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-zinc-300">
                  <span className="text-zinc-400">Coins on hand</span>
                  <span className="font-medium text-white">{dashboardData.zeCoins.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ZEClubMagicBento
