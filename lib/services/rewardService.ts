import dbConnect from '@/lib/mongodb'
import Reward from '@/models/reward'
import { RANK_VALUES, type RankName } from '@/lib/ranks'
import { countUsersWithHigherExperience, findUserByEmail } from '@/lib/repositories/userRepository'

export async function listRewardsForUserEmail(email?: string) {
  await dbConnect()

  let user = null
  let userRankValue = -1
  let isTop3 = false

  if (email) {
    user = await findUserByEmail(email)
    if (user) {
      const rankName = (user.rank || 'Rookie') as RankName
      userRankValue = RANK_VALUES[rankName] || 0
      const betterPlayersCount = await countUsersWithHigherExperience(user.experience)
      isTop3 = betterPlayersCount < 3
    }
  }

  const rewards = await Reward.find({ stock: { $gt: 0 } }).sort({ cost: -1 })

  return rewards.map((reward) => {
    const requiredRank = (reward.requiredRank || 'Rookie') as RankName
    const rewardRankValue = RANK_VALUES[requiredRank] || 0
    let isLocked = false
    let lockedReason = ''
    let finalCost = reward.cost

    if (!user) {
      isLocked = true
      lockedReason = 'Sign in to claim'
    } else if (userRankValue < rewardRankValue) {
      isLocked = true
      lockedReason = `Requires ${reward.requiredRank} rank or higher`
    } else if (reward.exclusiveToTop3) {
      if (user.rank !== 'Errorless Legend') {
        isLocked = true
        lockedReason = 'Exclusive to Errorless Legends only'
      } else if (!isTop3) {
        isLocked = true
        lockedReason = 'Exclusive to Top 3 Errorless Legends'
      }
    }

    if (user && userRankValue >= RANK_VALUES.Vanguard && reward.discountable) {
      finalCost = Math.floor(reward.cost * 0.9)
    }

    return {
      ...reward.toObject(),
      isLocked,
      lockedReason,
      originalCost: reward.cost,
      finalCost,
      userEligible: !isLocked,
    }
  })
}
