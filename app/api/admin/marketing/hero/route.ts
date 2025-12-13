import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import SiteSetting from '@/models/siteSetting'
import { revalidatePath } from 'next/cache'

/**
 * GET /api/admin/marketing/hero
 * Get current hero video and poster URLs (public access)
 */
export async function GET() {
  try {
    await dbConnect()

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
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    })
  } catch (error) {
    console.error('Error fetching hero settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

/**
 * PATCH /api/admin/marketing/hero
 * Update hero video and/or poster URLs
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user.roles.includes('admin')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

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
  } catch (error) {
    console.error('Error updating hero settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
