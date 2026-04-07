export type RoleDriftCheckInput = {
  expectedRoleId: string
  rankRoleIds: string[]
  actualRoleIds: string[]
}

export type RoleDriftCheckResult = {
  hasDrift: boolean
  expectedRoleMissing: boolean
  unexpectedRankRoles: string[]
}

export function evaluateRoleDrift(input: RoleDriftCheckInput): RoleDriftCheckResult {
  const rankRoleSet = new Set(input.rankRoleIds)
  const actualRoleSet = new Set(input.actualRoleIds)

  const expectedRoleMissing = !actualRoleSet.has(input.expectedRoleId)
  const unexpectedRankRoles = input.actualRoleIds.filter(
    (roleId) => roleId !== input.expectedRoleId && rankRoleSet.has(roleId)
  )

  return {
    hasDrift: expectedRoleMissing || unexpectedRankRoles.length > 0,
    expectedRoleMissing,
    unexpectedRankRoles,
  }
}
