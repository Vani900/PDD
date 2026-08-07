'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Sparkles, Building2, MapPin, Star, ArrowUpRight } from 'lucide-react'
import { api } from '@/lib/api'
import Link from 'next/link'

export function NGOsView() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['ngos', search, city],
    queryFn: () => api.ngos.list({ search: search || undefined, city: city || undefined }).then(r => r.data),
    enabled: mounted,
  })

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Discover Verified NGOs</h1>
            <p className="text-muted-foreground text-sm">Partner organizations verified by CharityAI for maximum impact and transparency.</p>
          </div>
          <Link href="/auth/register" className="btn-secondary">+ Register an NGO</Link>
        </div>

        {/* Search */}
        <div className="card p-4 mb-8 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-muted px-4 py-2.5 rounded-xl text-sm flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search NGOs by name, cause, category..." className="bg-transparent outline-none w-full" />
          </div>
          <div className="flex items-center gap-2 bg-muted px-4 py-2.5 rounded-xl text-sm w-full sm:w-48">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="bg-transparent outline-none w-full" />
          </div>
        </div>

        {/* Grid */}
        {isLoading || !mounted ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-60 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(data?.items || []).map((ngo: any) => (
              <motion.div key={ngo.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} className="card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                      🏢
                    </div>
                    <span className="badge badge-success flex items-center gap-1 text-xs">
                      <Sparkles className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-1">{ngo.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{ngo.description || ngo.tagline}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1 text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-400" /> {ngo.rating || '4.9'}</span>
                    <span>📍 {ngo.city || 'India'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary-600">₹{(ngo.total_received || 0).toLocaleString()} Raised</span>
                  <Link href={`/ngos/${ngo.id}`} className="btn-primary text-xs px-4 py-2">View Profile <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
