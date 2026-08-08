'use client'

import React from 'react'
import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'

const DashboardView = dynamicImport(
  () => import('./DashboardView').then((mod) => mod.DashboardView),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-muted/30 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    ),
  }
)

export default function DashboardPage() {
  return <DashboardView />
}
