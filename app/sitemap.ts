import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'

/**
 * Only include routes that are meant to be indexed.
 * Excludes: /admin, /api, /profile, /join-us, /signup, /ze-club (authenticated dashboard)
 */
const staticPublicRoutes = [
  '/',
  '/about',
  '/contact',
  '/events',
  '/services',
  '/teams',
  '/ze-club/leaderboard',
  '/ze-club/seasons',
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. Generate static route entries
  const staticEntries: MetadataRoute.Sitemap = staticPublicRoutes.map((route) => ({
    url: absoluteUrl(route === '/' ? '' : route),
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route.startsWith('/ze-club') ? 0.7 : 0.8,
  }))

  const seasonEntries: MetadataRoute.Sitemap = []

  // 2. Generate dynamic season entries
  try {
    const [{ default: dbConnect }, { default: Season }] = await Promise.all([
      import('@/lib/mongodb'),
      import('@/models/season'),
    ])

    await dbConnect()

    /**
     * Filter: 
     * - Only seasons that are NOT hidden from history.
     * - Completed seasons are high value.
     * - Active/Upcoming seasons are also included as they are reachable.
     */
    const seasons = (await Season.find(
      { hideFromHistory: { $ne: true } }, 
      { seasonNumber: 1, updatedAt: 1, _id: 0 }
    )
      .sort({ seasonNumber: -1 })
      .lean()) as unknown as Array<{ seasonNumber: number; updatedAt?: Date }>

    for (const season of seasons) {
      seasonEntries.push({
        url: absoluteUrl(`/ze-club/seasons/${season.seasonNumber}`),
        lastModified: season.updatedAt ?? now,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  } catch (error) {
    // If DB fails during build/ISR, we still return the static routes
    // to prevent the entire sitemap from being empty.
  }

  return [...staticEntries, ...seasonEntries]
}
