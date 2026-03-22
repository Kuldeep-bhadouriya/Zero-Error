import type { MetadataRoute } from 'next'

const BASE_URL = 'https://zeroerroresports.com'

const staticPublicRoutes = [
  '/',
  '/about',
  '/contact',
  '/events',
  '/join-us',
  '/services',
  '/signup',
  '/teams',
  '/ze-club',
  '/ze-club/leaderboard',
  '/ze-club/missions',
  '/ze-club/missions/submit',
  '/ze-club/rewards',
  '/ze-club/seasons',
  '/ze-club/support',
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = staticPublicRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route.startsWith('/ze-club') ? 0.7 : 0.8,
  }))

  const seasonEntries: MetadataRoute.Sitemap = []

  try {
    const [{ default: dbConnect }, { default: Season }] = await Promise.all([
      import('@/lib/mongodb'),
      import('@/models/season'),
    ])

    await dbConnect()

    const seasons = (await Season.find({}, { seasonNumber: 1, updatedAt: 1, _id: 0 })
      .sort({ seasonNumber: -1 })
      .lean()) as unknown as Array<{ seasonNumber: number; updatedAt?: Date }>

    for (const season of seasons) {
      seasonEntries.push({
        url: `${BASE_URL}/ze-club/seasons/${season.seasonNumber}`,
        lastModified: season.updatedAt ?? now,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  } catch {
    // Return static routes even when DB/env is unavailable during generation.
  }

  return [...staticEntries, ...seasonEntries]
}
