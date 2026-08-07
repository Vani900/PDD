'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, MapPin, Mail, Phone, Globe, Star, Heart, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

function NGODetailContent({ ngoId }: { ngoId: string }) {
  const { data: ngo, isLoading } = useQuery({
    queryKey: ['ngo', ngoId],
    queryFn: () => api.ngos.get(ngoId).then(r => r.data),
    enabled: Boolean(ngoId),
  })

  const fallbackNGO = {
    id: ngoId || '1',
    name: 'Smile Foundation India',
    tagline: 'Restoring children rights to health, education, and protection',
    description: 'Smile Foundation is a national level development organization directly benefitting over 1.5 million children and their families every year, through live welfare projects on education, healthcare, and livelihood.',
    mission: 'To empower underprivileged children, youth and women through relevant education, innovative healthcare and market-focused livelihood programmes.',
    rating: '4.9',
    city: 'New Delhi',
    country: 'India',
    email: 'contact@smilefoundation.org',
    total_received: 24500000,
    impact_score: 940,
    followers_count: 8500,
  }

  const displayNGO = ngo || fallbackNGO

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app max-w-4xl">
        <Link href="/ngos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to NGOs
        </Link>

        {/* Hero Card */}
        <div className="card p-6 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center text-4xl font-bold flex-shrink-0">🏢</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-foreground">{displayNGO.name}</h1>
                <span className="badge badge-success flex items-center gap-1 text-xs"><Sparkles className="w-3 h-3" /> Verified</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{displayNGO.tagline || displayNGO.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
                <span className="flex items-center gap-1 text-amber-500 font-bold"><Star className="w-3.5 h-3.5 fill-amber-400" /> {displayNGO.rating || '4.9'}</span>
                <span>📍 {displayNGO.city}, {displayNGO.country}</span>
                {displayNGO.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {displayNGO.email}</span>}
              </div>
            </div>
            <Link href={`/donate?ngo=${displayNGO.id}`} className="btn-primary flex-shrink-0"><Heart className="w-4 h-4 fill-white" /> Donate to NGO</Link>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/50 text-center">
            <div><div className="text-lg font-bold text-foreground">{formatCurrency(displayNGO.total_received || 0)}</div><div className="text-xs text-muted-foreground">Total Raised</div></div>
            <div><div className="text-lg font-bold text-foreground">{displayNGO.impact_score || 850}</div><div className="text-xs text-muted-foreground">Impact Score</div></div>
            <div><div className="text-lg font-bold text-foreground">{displayNGO.followers_count || 1240}</div><div className="text-xs text-muted-foreground">Supporters</div></div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="card p-6 md:p-8 space-y-4">
          <h2 className="font-display font-bold text-lg text-foreground">About the Organization</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{displayNGO.description}</p>

          {displayNGO.mission && (
            <div>
              <h3 className="font-semibold text-sm text-foreground">Mission</h3>
              <p className="text-sm text-muted-foreground">{displayNGO.mission}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NGODetailView({ ngoId }: { ngoId?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !ngoId) return null
  return <NGODetailContent ngoId={ngoId} />
}
