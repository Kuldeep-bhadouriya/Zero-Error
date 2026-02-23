import { NextResponse } from 'next/server'
import { checkAndAutoEndSeason } from '@/lib/ze-club/seasonTransition'
import logger from '@/lib/logger'

/**
 * GET /api/ze-club/season/check-end
 * Checks if the active season should auto-end based on scheduledEndDate.
 * Called on page loads (check-on-request pattern for serverless).
 */
export async function GET() {
  try {
    const result = await checkAndAutoEndSeason()

    if (result) {
      return NextResponse.json({
        seasonEnded: true,
        seasonNumber: result.seasonNumber,
        totalArchived: result.totalArchived,
      })
    }

    return NextResponse.json({ seasonEnded: false })
  } catch (error) {
    logger.error('Error checking season end:', error)
    return NextResponse.json({ seasonEnded: false })
  }
}
