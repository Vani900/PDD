'use client'

import React from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16 flex items-center justify-center">
      <div className="container-app max-w-md text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary-500/10 text-primary-600 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-2">404 - Page Not Found</h1>
        <p className="text-muted-foreground text-sm mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    </div>
  )
}
