import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'
import RedemptionRequest from '@/models/redemptionRequest'
import User from '@/models/user'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/userService', () => ({
  clearUserCache: vi.fn().mockResolvedValue(undefined),
}))

describe('missionService DB integration', () => {
  beforeAll(async () => {
    await startTestDatabase()
  }, 120_000)

  afterEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await stopTestDatabase()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approves submission and updates user coins/experience and mission completions', async () => {
    const { verifyMissionSubmission } = await import('@/lib/services/missionService')

    const user = await User.create({
      email: 'verify-user@test.com',
      zeCoins: 10,
      experience: 20,
      points: 20,
      rank: 'Rookie',
    })

    const mission = await Mission.create({
      name: 'Capture bug repro',
      description: 'Upload a reproducible bug report',
      points: 75,
      category: 'QA',
      instructions: 'Attach screenshots',
      active: true,
      currentCompletions: 0,
    })

    const submission = await MissionSubmission.create({
      user: user._id,
      mission: mission._id,
      proof: 'https://example.com/proof.png',
      status: 'pending',
    })

    const adminUserId = new mongoose.Types.ObjectId().toString()

    const result = await verifyMissionSubmission({
      submissionId: submission._id.toString(),
      status: 'approved',
      adminUserId,
    })

    expect(result.status).toBe(200)

    const updatedUser = (await User.findById(user._id).lean()) as any
    const updatedMission = (await Mission.findById(mission._id).lean()) as any
    const updatedSubmission = (await MissionSubmission.findById(submission._id).lean()) as any

    expect(updatedUser?.zeCoins).toBe(85)
    expect(updatedUser?.experience).toBe(95)
    expect(updatedUser?.points).toBe(95)
    expect(updatedMission?.currentCompletions).toBe(1)
    expect(updatedSubmission?.status).toBe('approved')
    expect(updatedSubmission?.approvedBy?.toString()).toBe(adminUserId)
    expect(updatedSubmission?.approvedAt).toBeTruthy()
  })

  it('reverts approved submission and restores accounting + mission count', async () => {
    const { revertMissionSubmission } = await import('@/lib/services/missionService')

    const user = await User.create({
      email: 'revert-user@test.com',
      zeCoins: 180,
      experience: 240,
      points: 240,
      rank: 'Contender',
    })

    const mission = await Mission.create({
      name: 'Fix one production bug',
      description: 'Submit PR with fix',
      points: 80,
      category: 'Engineering',
      instructions: 'Link PR',
      active: true,
      currentCompletions: 1,
    })

    const submission = await MissionSubmission.create({
      user: user._id,
      mission: mission._id,
      proof: 'https://example.com/pr-link.png',
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: new mongoose.Types.ObjectId(),
    })

    const adminUserId = new mongoose.Types.ObjectId().toString()

    const result = await revertMissionSubmission({
      submissionId: submission._id.toString(),
      adminUserId,
      revertReason: 'Evidence invalidated',
    })

    expect(result.status).toBe(200)

    const updatedUser = (await User.findById(user._id).lean()) as any
    const updatedMission = (await Mission.findById(mission._id).lean()) as any
    const updatedSubmission = (await MissionSubmission.findById(submission._id).lean()) as any

    expect(updatedUser?.zeCoins).toBe(100)
    expect(updatedUser?.experience).toBe(160)
    expect(updatedUser?.points).toBe(160)
    expect(updatedMission?.currentCompletions).toBe(0)
    expect(updatedSubmission?.status).toBe('rejected')
    expect(updatedSubmission?.revertedBy?.toString()).toBe(adminUserId)
    expect(updatedSubmission?.revertReason).toBe('Evidence invalidated')
  })

  it('blocks revert when balance would go negative with active redemptions', async () => {
    const { revertMissionSubmission } = await import('@/lib/services/missionService')

    const user = await User.create({
      email: 'blocked-revert@test.com',
      zeCoins: 20,
      experience: 150,
      points: 150,
      rank: 'Contender',
    })

    const mission = await Mission.create({
      name: 'Major mission',
      description: 'Big points mission',
      points: 100,
      category: 'Engineering',
      instructions: 'Provide proof',
      active: true,
      currentCompletions: 1,
    })

    const rewardId = new mongoose.Types.ObjectId()

    await RedemptionRequest.create({
      userId: user._id,
      userName: 'Blocked User',
      userEmail: 'blocked-revert@test.com',
      rewardId,
      rewardName: 'Keyboard',
      rewardCost: 50,
      contactName: 'Blocked User',
      contactEmail: 'blocked-revert@test.com',
      contactPhone: '9999999999',
      address: 'Test Address',
      status: 'pending',
    })

    const submission = await MissionSubmission.create({
      user: user._id,
      mission: mission._id,
      proof: 'https://example.com/proof.png',
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: new mongoose.Types.ObjectId(),
    })

    const result = await revertMissionSubmission({
      submissionId: submission._id.toString(),
      adminUserId: new mongoose.Types.ObjectId().toString(),
      revertReason: 'Fraudulent submission',
    })

    expect(result.status).toBe(400)
    expect(result.data).toMatchObject({
      error: 'Cannot revert: User has active redemption requests and insufficient balance',
    })

    const unchangedUser = (await User.findById(user._id).lean()) as any
    const unchangedSubmission = (await MissionSubmission.findById(submission._id).lean()) as any

    expect(unchangedUser?.zeCoins).toBe(20)
    expect(unchangedSubmission?.status).toBe('approved')
  })
})
