'use client'

import React, { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CharityAI Dashboard Error Boundary]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-muted/30 pt-20 flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Dashboard Temporarily Unavailable</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || 'We could not render your dashboard widget at this time. Your session is active.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="btn-primary text-xs px-4 py-2"
          >
            Retry Loading
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-border text-xs text-foreground hover:bg-accent"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  )
}
