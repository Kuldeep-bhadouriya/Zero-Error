import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import SiteSetting from '@/models/siteSetting'
import { revalidatePath } from 'next/cache'
import { withAdmin, withErrorHandling, withRequestLogging } from '@/lib/api/middleware'

// Prevent Next.js from caching this route at build time.
// Without this, the GET response could be cached with empty URLs during the
// build step, causing the video to revert to default after every deployment.
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/marketing/hero
 * Get current hero video and poster URLs (public access)
 * 
 * Returns:
 * - heroVideoUrl: Custom video URL (empty string if not set, will use default)
 * - heroPosterUrl: Custom poster URL (empty string if not set, will use default)
 * - defaultHeroVideoUrl: The default video path (/images/background.mp4)
 * - defaultHeroPosterUrl: The default poster path (/images/hero-background.jpg)
 * 
 * Note: When heroVideoUrl or heroPosterUrl is empty, the frontend will automatically
 * use the default media from /public/images/
 */
export const GET = withRequestLogging(
  '/api/admin/marketing/hero',
  withErrorHandling('/api/admin/marketing/hero', async () => {
    await dbConnect()

    // Default URLs that will be used if no custom media is set
    const DEFAULT_HERO_VIDEO = '/images/background.mp4'
    const DEFAULT_HERO_POSTER = '/images/hero-background.jpg'

    // Get or create site settings (singleton pattern)
    let settings = await SiteSetting.findOne()

    if (!settings) {
      settings = await SiteSetting.create({
        heroVideoUrl: '',
        heroPosterUrl: '',
        previousHeroVideoUrl: '',
        previousHeroPosterUrl: '',
      })
    }

    return NextResponse.json({
      heroVideoUrl: settings.heroVideoUrl || '',
      heroPosterUrl: settings.heroPosterUrl || '',
      previousHeroVideoUrl: settings.previousHeroVideoUrl || '',
      previousHeroPosterUrl: settings.previousHeroPosterUrl || '',
      // Include default URLs for reference
      defaultHeroVideoUrl: DEFAULT_HERO_VIDEO,
      defaultHeroPosterUrl: DEFAULT_HERO_POSTER,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    })
  })
)

/**
 * PATCH /api/admin/marketing/hero
 * Update hero video and/or poster URLs
 */
export const PATCH = withRequestLogging(
  '/api/admin/marketing/hero',
  withErrorHandling(
    '/api/admin/marketing/hero',
    withAdmin(async (req, _context, session) => {
    const body = await req.json()
    const { heroVideoUrl, heroPosterUrl } = body

    // Validate at least one field is provided
    if (heroVideoUrl === undefined && heroPosterUrl === undefined) {
      return new NextResponse('At least one URL must be provided', {
        status: 400,
      })
    }

    await dbConnect()

    // Get current settings to save as previous
    const currentSettings = await SiteSetting.findOne()

    // Update or create settings
    const updateData: any = {
      updatedBy: session.user.email || session.user.name,
    }

    // Save current values as previous before updating
    if (heroVideoUrl !== undefined) {
      if (currentSettings?.heroVideoUrl) {
        updateData.previousHeroVideoUrl = currentSettings.heroVideoUrl
      }
      updateData.heroVideoUrl = heroVideoUrl
    }

    if (heroPosterUrl !== undefined) {
      if (currentSettings?.heroPosterUrl) {
        updateData.previousHeroPosterUrl = currentSettings.heroPosterUrl
      }
      updateData.heroPosterUrl = heroPosterUrl
    }

    const settings = await SiteSetting.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
      runValidators: true,
    })

    // Revalidate home page to reflect changes immediately
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      heroVideoUrl: settings.heroVideoUrl,
      heroPosterUrl: settings.heroPosterUrl,
      previousHeroVideoUrl: settings.previousHeroVideoUrl,
      previousHeroPosterUrl: settings.previousHeroPosterUrl,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    })
    })
  )
)
