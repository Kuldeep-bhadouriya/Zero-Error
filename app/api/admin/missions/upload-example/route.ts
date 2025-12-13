// This endpoint is no longer needed - mission example images are uploaded via UploadThing
// See: app/api/uploadthing/core.ts - missionExampleUploader endpoint
// Client-side usage: Use useUploadThing('missionExampleUploader') hook

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Use UploadThing instead.',
      message: 'Mission example images should be uploaded using the missionExampleUploader endpoint via UploadThing'
    },
    { status: 410 }
  )
}
