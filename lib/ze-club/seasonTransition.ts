import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Season, { type ISeason } from '@/models/season'
import SeasonArchive from '@/models/seasonArchive'
import User from '@/models/user'
import MissionSubmission from '@/models/missionSubmission'
import RedemptionRequest from '@/models/redemptionRequest'
import Mission from '@/models/mission'
import Reward from '@/models/reward'

export interface SeasonTransitionResult {
  success: boolean
  seasonNumber: number
  totalArchived: number
  pendingSubmissionsRejected: number
  pendingRedemptionsCancelled: number
}

/**
 * Ends the active season and performs the full transition:
 * 1. Marks season as completed
 * 2. Auto-rejects pending submissions
 * 3. Cancels pending redemptions (refunds coins, restocks rewards)
 * 4. Archives all user stats into SeasonArchive
 * 5. Resets all user progression stats
 * 6. Clears MissionSubmission and RedemptionRequest collections
 * 7. Resets mission completion counters
 */
export async function endSeason(
  seasonId: string,
  endedByUserId: string,
  reason: 'scheduled' | 'manual_early'
): Promise<SeasonTransitionResult> {
  await dbConnect()

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // STEP 1: Lock the season by setting status to 'completed'
    // The partial unique index on status:'active' prevents race conditions
    const season = await Season.findOneAndUpdate(
      { _id: seasonId, status: 'active' },
      {
        status: 'completed',
        actualEndDate: new Date(),
        endedBy: endedByUserId,
        endReason: reason,
      },
      { new: true, session }
    )

    if (!season) {
      await session.abortTransaction()
      session.endSession()
      throw new Error('Season not found or already ended')
    }

    // STEP 2: Auto-reject all pending mission submissions
    const pendingResult = await MissionSubmission.updateMany(
      { status: 'pending' },
      {
        $set: {
          status: 'rejected',
          remarks: `Auto-rejected: Season ${season.seasonNumber} ended`,
        },
      },
      { session }
    )

    // STEP 3: Cancel pending/processing redemptions, refund coins, restock rewards
    const pendingRedemptions = await RedemptionRequest.find(
      { status: { $in: ['pending', 'processing'] } }
    ).session(session)

    for (const redemption of pendingRedemptions) {
      // Refund ZE Coins to user (before the reset in step 7, so archive captures correct final state)
      await User.findByIdAndUpdate(
        redemption.userId,
        { $inc: { zeCoins: redemption.rewardCost } },
        { session }
      )
      // Restock the reward
      await Reward.findByIdAndUpdate(
        redemption.rewardId,
        { $inc: { stock: 1 } },
        { session }
      )
      // Mark as cancelled
      redemption.status = 'cancelled'
      redemption.adminNotes = `Auto-cancelled: Season ${season.seasonNumber} ended. ZE Coins refunded.`
      await redemption.save({ session })
    }

    // STEP 4: Build leaderboard snapshot (all users sorted by experience)
    const allUsers = await User.find(
      { email: { $exists: true, $ne: null } },
      'experience zeCoins rank rankIcon zeTag profilePhotoUrl'
    )
      .sort({ experience: -1 })
      .session(session)
      .lean()

    // STEP 5: Count completed missions and redemptions per user
    const missionCounts = await MissionSubmission.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]).session(session)
    const missionCountMap = new Map(
      missionCounts.map((m: any) => [m._id.toString(), m.count])
    )

    const redemptionCounts = await RedemptionRequest.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]).session(session)
    const redemptionCountMap = new Map(
      redemptionCounts.map((r: any) => [r._id.toString(), r.count])
    )

    // STEP 6: Create SeasonArchive documents
    const archiveDocs = allUsers.map((user: any, index: number) => ({
      season: season._id,
      seasonNumber: season.seasonNumber,
      user: user._id,
      finalExperience: user.experience || 0,
      finalZeCoins: user.zeCoins || 0,
      finalRank: user.rank || 'Rookie',
      finalRankIcon: user.rankIcon || '/images/ranks/rookie.png',
      leaderboardPosition: index + 1,
      zeTag: user.zeTag || 'Unknown',
      profilePhotoUrl: user.profilePhotoUrl,
      totalMissionsCompleted: missionCountMap.get(user._id.toString()) || 0,
      totalRedemptions: redemptionCountMap.get(user._id.toString()) || 0,
      isSeasonWinner: index === 0,
      isTopThree: index < 3,
      archivedAt: new Date(),
    }))

    if (archiveDocs.length > 0) {
      await SeasonArchive.insertMany(archiveDocs, { session })
    }

    // STEP 7: Update season totalParticipants
    const participantsWithXP = allUsers.filter(
      (u: any) => (u.experience || 0) > 0
    ).length
    await Season.findByIdAndUpdate(
      season._id,
      { totalParticipants: participantsWithXP },
      { session }
    )

    // STEP 8: Reset all user stats
    await User.updateMany(
      {},
      {
        $set: {
          experience: 0,
          zeCoins: 0,
          points: 0,
          rank: 'Rookie',
          rankIcon: '/images/ranks/rookie.png',
          progressToNextRank: 0,
          nextRankPoints: 100,
          currentRankPoints: 0,
          progress: 0,
          badge: '',
        },
      },
      { session }
    )

    // STEP 9: Delete all mission submissions
    await MissionSubmission.deleteMany({}, { session })

    // STEP 10: Reset mission completion counters
    await Mission.updateMany(
      {},
      { $set: { currentCompletions: 0 } },
      { session }
    )

    // STEP 11: Delete all redemption requests
    await RedemptionRequest.deleteMany({}, { session })

    // Commit the transaction
    await session.commitTransaction()
    session.endSession()

    return {
      success: true,
      seasonNumber: season.seasonNumber,
      totalArchived: archiveDocs.length,
      pendingSubmissionsRejected: pendingResult.modifiedCount,
      pendingRedemptionsCancelled: pendingRedemptions.length,
    }
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}

/**
 * Checks if the current active season has passed its scheduledEndDate.
 * If so, triggers the season end automatically.
 * Returns the season info if auto-ended, or null.
 */
export async function checkAndAutoEndSeason(): Promise<SeasonTransitionResult | null> {
  await dbConnect()

  const expiredSeason = await Season.findOne({
    status: 'active',
    scheduledEndDate: { $lte: new Date() },
  })

  if (!expiredSeason) {
    return null
  }

  try {
    return await endSeason(
      expiredSeason._id.toString(),
      'system',
      'scheduled'
    )
  } catch (error) {
    // If the error is because another request already ended it, that's fine
    if (
      error instanceof Error &&
      error.message === 'Season not found or already ended'
    ) {
      return null
    }
    throw error
  }
}

/**
 * Gets the current active season, if any.
 */
export async function getCurrentSeason(): Promise<ISeason | null> {
  await dbConnect()
  return Season.findOne({ status: 'active' }).lean() as Promise<ISeason | null>
}
