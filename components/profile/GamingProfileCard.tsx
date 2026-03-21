'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Coins, Sparkles, Trophy, Target, Activity } from 'lucide-react'
import styles from './GamingProfileCard.module.css'

interface GamingProfileCardProps {
  profile: {
    zeTag?: string
    bio?: string
    profilePhotoUrl?: string
    image?: string
    rank: string
    points: number
    zeCoins?: number
    experience?: number
    currentRankPoints?: number
    nextRankPoints?: number
  }
  stats?: {
    completedMissions: number
    pendingMissions: number
    leaderboardPosition: number
  }
}

type AbilityKey = 'rank' | 'missions' | 'economy' | 'activity'

const CARD_ARTWORK = '/images/ValorantCover.jpg'

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function GamingProfileCard({ profile, stats }: GamingProfileCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [activeAbility, setActiveAbility] = useState<AbilityKey>('rank')

  const displayName = profile.zeTag ? `@${profile.zeTag}` : 'ZE Cadet'
  const description =
    profile.bio ||
    'A ZE Club explorer forging progress through missions, strategy, and relentless consistency.'

  const xpCurrent = profile.currentRankPoints ?? profile.experience ?? profile.points
  const xpTotal = profile.nextRankPoints ?? Math.max(xpCurrent + 100, 100)
  const xpPercent = clampPercent((xpCurrent / Math.max(1, xpTotal)) * 100)
  const level = Math.max(1, Math.floor((profile.experience ?? profile.points) / 500) + 1)

  const missionsDone = stats?.completedMissions ?? 0
  const missionsPending = stats?.pendingMissions ?? 0
  const totalMissions = Math.max(1, missionsDone + missionsPending)
  const missionPercent = clampPercent((missionsDone / totalMissions) * 100)
  const leaderboardPercent = clampPercent(100 - ((stats?.leaderboardPosition ?? 100) - 1))

  const frontStats = useMemo(
    () => [
      {
        label: 'ZE Points',
        value: (profile.experience ?? profile.points).toLocaleString(),
        percent: xpPercent,
        kind: 'points' as const,
        icon: Sparkles,
      },
      {
        label: 'ZE Coins',
        value: (profile.zeCoins ?? profile.points).toLocaleString(),
        percent: missionPercent,
        kind: 'coins' as const,
        icon: Coins,
      },
    ],
    [profile.experience, profile.points, profile.zeCoins, xpPercent, missionPercent],
  )

  const abilities: Record<AbilityKey, { title: string; subtitle: string; description: string; meter: number }> = {
    rank: {
      title: 'Rank Ascension',
      subtitle: profile.rank,
      description:
        'Climb through ZE ranks by consistently converting mission effort into verified XP and leaderboard momentum.',
      meter: xpPercent,
    },
    missions: {
      title: 'Mission Mastery',
      subtitle: `${missionsDone} Completed`,
      description:
        'Your mission throughput defines your tactical growth curve. High completion means higher influence in the club.',
      meter: missionPercent,
    },
    economy: {
      title: 'Coin Economy',
      subtitle: `${(profile.zeCoins ?? profile.points).toLocaleString()} Coins`,
      description:
        'Build ZE Coin reserves to unlock rewards, strategic upgrades, and stronger progression leverage.',
      meter: clampPercent(((profile.zeCoins ?? profile.points) / Math.max(1, profile.points)) * 100),
    },
    activity: {
      title: 'Leaderboard Pressure',
      subtitle: `#${stats?.leaderboardPosition ?? '-'} Position`,
      description:
        'Sustain activity and push score velocity to improve ranking against the active club field.',
      meter: leaderboardPercent,
    },
  }

  const active = abilities[activeAbility]

  return (
    <div className={styles.container}>
      <div className={styles.aurora} />
      <div
        className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
        onClick={() => setIsFlipped((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsFlipped((v) => !v)
          }
        }}
        aria-label="Flip profile card"
      >
        <div className={styles.inner}>
          <section className={styles.face}>
            <div className={styles.frame}>
              <div className={styles.levelBar}>
                <span className={styles.level}>Lv {level}</span>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${xpPercent}%` }} />
                  <span className={styles.progressText}>
                    {xpCurrent.toLocaleString()} / {xpTotal.toLocaleString()} XP
                  </span>
                </div>
              </div>

              <div className={styles.art}>
                <Image src={CARD_ARTWORK} alt="ZE Card Artwork" fill className={styles.artImage} unoptimized />
                <div className={styles.artOverlay} />
              </div>

              <div className={styles.name}>{displayName}</div>
              <p className={styles.description}>{description}</p>

              <div className={styles.statStack}>
                {frontStats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className={`${styles.statBar} ${styles[stat.kind]}`}>
                      <Icon className={styles.statIcon} />
                      <div className={styles.statTrack}>
                        <div className={styles.statFill} style={{ width: `${stat.percent}%` }} />
                        <span className={styles.statText}>
                          {stat.label}: {stat.value}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className={`${styles.face} ${styles.back}`}>
            <div className={styles.frame}>
              <div className={styles.levelBar}>
                <span className={styles.level}>Profile Intel</span>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${active.meter}%` }} />
                  <span className={styles.progressText}>{active.subtitle}</span>
                </div>
              </div>

              <div
                className={styles.tabRail}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <button
                  className={`${styles.tab} ${activeAbility === 'rank' ? styles.tabActive : ''}`}
                  onClick={() => setActiveAbility('rank')}
                  type="button"
                >
                  <Trophy size={16} />
                </button>
                <button
                  className={`${styles.tab} ${activeAbility === 'missions' ? styles.tabActive : ''}`}
                  onClick={() => setActiveAbility('missions')}
                  type="button"
                >
                  <Target size={16} />
                </button>
                <button
                  className={`${styles.tab} ${activeAbility === 'economy' ? styles.tabActive : ''}`}
                  onClick={() => setActiveAbility('economy')}
                  type="button"
                >
                  <Coins size={16} />
                </button>
                <button
                  className={`${styles.tab} ${activeAbility === 'activity' ? styles.tabActive : ''}`}
                  onClick={() => setActiveAbility('activity')}
                  type="button"
                >
                  <Activity size={16} />
                </button>
              </div>

              <div className={styles.abilityCard}>
                <h3 className={styles.abilityTitle}>{active.title}</h3>
                <p className={styles.abilityBody}>{active.description}</p>
              </div>

              <div className={styles.statStack}>
                <div className={`${styles.statBar} ${styles.points}`}>
                  <Trophy className={styles.statIcon} />
                  <div className={styles.statTrack}>
                    <div className={styles.statFill} style={{ width: `${leaderboardPercent}%` }} />
                    <span className={styles.statText}>Leaderboard: #{stats?.leaderboardPosition ?? '-'}</span>
                  </div>
                </div>
                <div className={`${styles.statBar} ${styles.coins}`}>
                  <Target className={styles.statIcon} />
                  <div className={styles.statTrack}>
                    <div className={styles.statFill} style={{ width: `${missionPercent}%` }} />
                    <span className={styles.statText}>
                      Missions: {missionsDone}/{totalMissions}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
