import { describe, expect, it } from 'vitest'
import { applyRankFromExperience, calculateRankProgress } from '../../lib/services/rankService'
import { getRankForExperience } from '../../lib/ranks'

describe('rankService', () => {
  it('gets rank by experience threshold', () => {
    expect(getRankForExperience(0).name).toBe('Rookie')
    expect(getRankForExperience(250).name).toBe('Gladiator')
    expect(getRankForExperience(1500).name).toBe('Errorless Legend')
  })

  it('calculates progress for normal rank window', () => {
    const progress = calculateRankProgress(175, 'Contender')
    expect(progress).toEqual({
      progressToNextRank: 50,
      currentRankPoints: 100,
      nextRankPoints: 250,
    })
  })

  it('caps progress at 100 for top rank', () => {
    const progress = calculateRankProgress(1200, 'Errorless Legend')
    expect(progress.progressToNextRank).toBe(100)
    expect(progress.currentRankPoints).toBe(1000)
    expect(progress.nextRankPoints).toBe(1000)
  })

  it('falls back when current rank name is invalid', () => {
    const progress = calculateRankProgress(320, 'Unknown Rank')
    expect(progress.progressToNextRank).toBe(0)
    expect(progress.currentRankPoints).toBe(250)
    expect(progress.nextRankPoints).toBe(250)
  })

  it('applies rank fields to user object', () => {
    const user = { experience: 520 }
    const updated = applyRankFromExperience(user)

    expect(updated.rank).toBe('Vanguard')
    expect(updated.currentRankPoints).toBe(500)
    expect(updated.nextRankPoints).toBe(1000)
    expect(updated.progressToNextRank).toBe(4)
  })
})
