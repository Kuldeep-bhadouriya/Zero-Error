import { describe, expect, it } from 'vitest'
import { evaluateRoleDrift } from '@/bot/src/reconcileDrift'

describe('evaluateRoleDrift', () => {
  it('returns no drift when expected role exists and no other rank roles are present', () => {
    const result = evaluateRoleDrift({
      expectedRoleId: 'role-contender',
      rankRoleIds: ['role-rookie', 'role-contender', 'role-veteran'],
      actualRoleIds: ['role-contender', 'role-community'],
    })

    expect(result).toEqual({
      hasDrift: false,
      expectedRoleMissing: false,
      unexpectedRankRoles: [],
    })
  })

  it('detects drift when expected role is missing', () => {
    const result = evaluateRoleDrift({
      expectedRoleId: 'role-contender',
      rankRoleIds: ['role-rookie', 'role-contender', 'role-veteran'],
      actualRoleIds: ['role-rookie'],
    })

    expect(result.hasDrift).toBe(true)
    expect(result.expectedRoleMissing).toBe(true)
    expect(result.unexpectedRankRoles).toEqual(['role-rookie'])
  })

  it('detects drift when extra rank roles are present', () => {
    const result = evaluateRoleDrift({
      expectedRoleId: 'role-veteran',
      rankRoleIds: ['role-rookie', 'role-contender', 'role-veteran'],
      actualRoleIds: ['role-veteran', 'role-rookie', 'role-announcements'],
    })

    expect(result.hasDrift).toBe(true)
    expect(result.expectedRoleMissing).toBe(false)
    expect(result.unexpectedRankRoles).toEqual(['role-rookie'])
  })
})
