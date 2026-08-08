'use client'

import React from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6 text-center">
        <div className="p-8 max-w-md w-full border border-slate-800 rounded-2xl bg-slate-950">
          <h2 className="text-xl font-bold mb-3 text-red-400">Application Error</h2>
          <p className="text-sm text-slate-300 mb-6">{error?.message || 'A global error occurred.'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium text-sm"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  )
}
