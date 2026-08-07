'use client'

import React, { useState, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Filter, HandHeart, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

function DonationsList() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const searchParams = useSearchParams()
  const initialQuery = searchParams ? (searchParams.get('query') || '') : ''
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState(initialQuery)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['donations', type, status, page, search],
    queryFn: () => api.donations.list({ donation_type: type || undefined, status: status || undefined, page, page_size: 10 }).then(r => r.data),
    enabled: mounted,
  })

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Donations Directory</h1>
            <p className="text-muted-foreground text-sm">Track active donations across India in real time.</p>
          </div>
          <Link href="/donate" className="btn-primary">+ Make New Donation</Link>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-xl text-sm min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none w-full"
            />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-background border border-border px-3 py-2 rounded-xl text-sm">
            <option value="">All Categories</option>
            <option value="food">Food</option>
            <option value="money">Money</option>
            <option value="blood">Blood</option>
            <option value="clothes">Clothes</option>
            <option value="books">Books</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-background border border-border px-3 py-2 rounded-xl text-sm">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Donations Table / Grid */}
        {isLoading || !mounted ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.items || []).map((d: any) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {d.donation_type === 'money' ? '💰' : d.donation_type === 'food' ? '🍱' : '❤️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{d.title || d.donation_type}</span>
                      <span className="text-xs font-mono text-muted-foreground">{d.tracking_number}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{d.pickup_city || 'India'} · Created {formatDate(d.created_at, 'relative')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">{d.amount ? formatCurrency(d.amount) : 'Item Donation'}</div>
                    <span className={`badge text-xs capitalize ${d.status === 'delivered' ? 'badge-success' : 'badge-primary'}`}>{d.status}</span>
                  </div>
                  <Link href={`/donations/${d.id}`} className="btn-secondary text-xs px-3 py-2">Details <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function DonationsView() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 container-app text-center">Loading donations directory...</div>}>
      <DonationsList />
    </Suspense>
  )
}
