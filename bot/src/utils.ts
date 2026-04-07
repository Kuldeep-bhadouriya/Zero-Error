import crypto from 'crypto'

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function calculateRetryDelaySeconds(
  attemptCount: number,
  baseSeconds: number,
  maxSeconds: number
) {
  const normalizedAttempt = Math.max(1, attemptCount)
  const candidate = baseSeconds * 2 ** (normalizedAttempt - 1)
  return Math.min(maxSeconds, candidate)
}

export function createCorrelationId(prefix: string) {
  return `${prefix}:${crypto.randomUUID()}`
}
