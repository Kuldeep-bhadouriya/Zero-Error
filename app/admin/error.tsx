'use client'

import { useEffect } from 'react'
import logger from '@/lib/browser-logger'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Admin route error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full p-6 bg-red-900/20 border border-red-700 rounded-lg">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Admin panel error</h2>
        <p className="text-zinc-300 mb-4">
          The admin section encountered an unexpected error.
        </p>
        <button
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
        >
          Retry Admin
        </button>
      </div>
    </div>
  )
}
