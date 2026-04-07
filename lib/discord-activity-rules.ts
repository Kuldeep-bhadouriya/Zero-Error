import type { DiscordActivityType } from '@/models/discordActivityLedger'

export type DiscordActivityRule = {
  pointsPerUnit: number
  cooldownSeconds: number
  dailyCapPoints: number
}

export const DISCORD_ACTIVITY_RULES: Record<DiscordActivityType, DiscordActivityRule> = {
  message_post: {
    pointsPerUnit: 2,
    cooldownSeconds: 60,
    dailyCapPoints: 80,
  },
  helpful_reply: {
    pointsPerUnit: 5,
    cooldownSeconds: 180,
    dailyCapPoints: 60,
  },
  voice_participation: {
    pointsPerUnit: 3,
    cooldownSeconds: 300,
    dailyCapPoints: 90,
  },
}

export function getDiscordActivityRule(activityType: DiscordActivityType) {
  return DISCORD_ACTIVITY_RULES[activityType]
}
