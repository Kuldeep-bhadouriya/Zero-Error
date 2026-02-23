export const RANKS = [
  { name: 'Rookie', points: 0, icon: '/images/ranks/rookie.png' },
  { name: 'Contender', points: 100, icon: '/images/ranks/contender.png' },
  { name: 'Gladiator', points: 250, icon: '/images/ranks/gladiator.png' },
  { name: 'Vanguard', points: 500, icon: '/images/ranks/vanguard.png' },
  { name: 'Errorless Legend', points: 1000, icon: '/images/ranks/errorless-legend.png' },
] as const

export type RankName = (typeof RANKS)[number]['name']

export const RANK_VALUES: Record<RankName, number> = Object.fromEntries(
  RANKS.map((rank) => [rank.name, rank.points])
) as Record<RankName, number>

export function getRankForExperience(experience: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (experience >= RANKS[i].points) {
      return RANKS[i]
    }
  }
  return RANKS[0]
}
