'use client'

import React, { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Router Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-card p-8 max-w-md w-full">
        <h2 className="text-xl font-bold mb-3 text-red-400">Something went wrong!</h2>
        <p className="text-sm text-slate-300 mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
