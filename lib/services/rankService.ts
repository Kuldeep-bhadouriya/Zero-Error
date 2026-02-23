import { RANKS, getRankForExperience } from '@/lib/ranks'

export function calculateRankProgress(experience: number, currentRank: string) {
  const currentRankIndex = RANKS.findIndex((rank) => rank.name === currentRank)

  if (currentRankIndex === -1) {
    const baseRank = getRankForExperience(experience)
    return {
      progressToNextRank: 0,
      nextRankPoints: baseRank.points,
      currentRankPoints: baseRank.points,
    }
  }

  if (currentRankIndex === RANKS.length - 1) {
    return {
      progressToNextRank: 100,
      nextRankPoints: RANKS[currentRankIndex].points,
      currentRankPoints: RANKS[currentRankIndex].points,
    }
  }

  const currentRankThreshold = RANKS[currentRankIndex].points
  const nextRankThreshold = RANKS[currentRankIndex + 1].points
  const pointsInCurrentRank = experience - currentRankThreshold
  const pointsNeededForNextRank = nextRankThreshold - currentRankThreshold
  const progressToNextRank = Math.min(
    Math.floor((pointsInCurrentRank / pointsNeededForNextRank) * 100),
    100
  )

  return {
    progressToNextRank,
    nextRankPoints: nextRankThreshold,
    currentRankPoints: currentRankThreshold,
  }
}

export function applyRankFromExperience(user: any) {
  const rankData = getRankForExperience(user.experience)
  const progress = calculateRankProgress(user.experience, rankData.name)

  user.rank = rankData.name
  user.rankIcon = rankData.icon
  user.progressToNextRank = progress.progressToNextRank
  user.nextRankPoints = progress.nextRankPoints
  user.currentRankPoints = progress.currentRankPoints

  return {
    rank: user.rank,
    rankIcon: user.rankIcon,
    progressToNextRank: user.progressToNextRank,
    nextRankPoints: user.nextRankPoints,
    currentRankPoints: user.currentRankPoints,
  }
}
