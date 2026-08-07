'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Heart, Users, Star, ArrowUpRight, Bell, Loader2, Package, AlertCircle, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const EMPTY_CHART = [
  { month: 'No data', amount: 0 },
]

export function DashboardView() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('access_token'))

  const { data: impact, isLoading: impactLoading, error: impactError, refetch: refetchImpact } = useQuery({
    queryKey: ['impact'],
    queryFn: () => api.users.impact().then((r: any) => r.data),
    enabled: mounted && hasToken,
    staleTime: 30_000,
    retry: 1,
  })

  const { data: myDonationsData, isLoading: donationsLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => api.donations.my({ page_size: 10 }).then((r: any) => r.data).catch(() => api.donations.list({ page_size: 10 }).then((r: any) => r.data)),
    enabled: mounted,
    staleTime: 30_000,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list({ page_size: 5 }).then((r: any) => r.data).catch(() => ({ items: [] })),
    enabled: mounted && hasToken,
    staleTime: 60_000,
  })

  // Build chart from real donation data
  const chartData = React.useMemo(() => {
    const items: any[] = myDonationsData?.items || []
    if (items.length === 0) return EMPTY_CHART

    // Group by month
    const byMonth: Record<string, { amount: number; count: number }> = {}
    items.forEach((d: any) => {
      if (!d.created_at) return
      const date = new Date(d.created_at)
      const month = date.toLocaleString('default', { month: 'short', year: '2-digit' })
      if (!byMonth[month]) byMonth[month] = { amount: 0, count: 0 }
      byMonth[month].amount += d.amount || 0
      byMonth[month].count += 1
    })

    return Object.entries(byMonth).map(([month, vals]) => ({
      month,
      amount: vals.amount,
      count: vals.count,
    }))
  }, [myDonationsData])

  const statCards = [
    {
      label: 'Total Donated',
      value: impactLoading ? '—' : formatCurrency(impact?.total_amount || 0),
      icon: TrendingUp,
      color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      trend: impact ? `${impact.completed_donations} completed` : '—'
    },
    {
      label: 'Donations Made',
      value: impactLoading ? '—' : (impact?.total_donations ?? 0),
      icon: Heart,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20',
      trend: impact ? `${impact.active_donations} active` : '—'
    },
    {
      label: 'Impact Score',
      value: impactLoading ? '—' : (impact?.impact_score ?? 0),
      icon: Star,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
      trend: impact?.rank || '—'
    },
    {
      label: 'Volunteer Hours',
      value: impactLoading ? '—' : `${impact?.volunteer_hours ?? 0}h`,
      icon: Users,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      trend: `Level ${impact?.level ?? 1}`
    },
  ]

  return (
    <div className="min-h-screen bg-muted/30 pt-20">
      <div className="container-app py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Your Impact Dashboard</h1>
            <p className="text-muted-foreground">Track your donations and see the difference you&apos;re making.</p>
          </div>
          <Link href="/donate" className="btn-primary">+ Make a Donation</Link>
        </motion.div>

        {/* Auth / Guest Banner */}
        {!hasToken ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-primary-500/20 to-blue-500/20 border border-primary-500/30 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">👋</span>
              <div>
                <p className="text-foreground text-sm font-bold">You are viewing as Guest</p>
                <p className="text-muted-foreground text-xs">Sign in to track your personal impact score and sync donations with your account.</p>
              </div>
            </div>
            <Link href="/auth/login" className="btn-primary py-2 px-4 text-xs">
              Sign In to Sync
            </Link>
          </motion.div>
        ) : impactError ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-xs">Connecting to backend PostgreSQL. Click retry if backend container is waking up.</p>
            </div>
            <button onClick={() => refetchImpact()} className="flex items-center gap-1 text-amber-300 text-xs font-bold hover:text-amber-100">
              <RefreshCw className="w-3 h-3" /> Retry Sync
            </button>
          </motion.div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  {impactLoading
                    ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    : <card.icon className="w-5 h-5" />}
                </div>
                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{card.trend}</span>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {impactLoading ? <div className="h-8 w-20 skeleton rounded" /> : card.value}
              </div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Donation Trend Chart — real data */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Donation Trend</h2>
              <span className="text-xs text-muted-foreground">
                {chartData.length === 1 && chartData[0].month === 'No data' ? 'No donations yet' : 'Your history'}
              </span>
            </div>
            {mounted && !donationsLoading ? (
              chartData.length > 0 && chartData[0].month !== 'No data' ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#25a47e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#25a47e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="amount" stroke="#25a47e" strokeWidth={2} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Package className="w-10 h-10 opacity-30" />
                  <p className="text-sm">No donations yet. Make your first donation!</p>
                  <Link href="/donate" className="btn-primary text-xs px-4 py-2">Donate Now</Link>
                </div>
              )
            ) : (
              <div className="h-[200px] skeleton rounded-xl" />
            )}
          </motion.div>

          {/* Activity Stream */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Activity Stream
            </h2>
            <div className="space-y-3">
              {(notifications?.items || []).length > 0
                ? (notifications.items as any[]).slice(0, 5).map((n: any) => (
                    <div key={n.id} className="text-xs p-2.5 rounded-xl bg-muted/50 border border-border/50">
                      <div className="font-semibold text-foreground">{n.title}</div>
                      <div className="text-muted-foreground mt-0.5">{n.body || n.message}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-1">{formatDate(n.created_at, 'relative')}</div>
                    </div>
                  ))
                : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No notifications yet. Activity will appear here as you use CharityAI.
                  </div>
                )}
            </div>
          </motion.div>
        </div>

        {/* Recent Donations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Donations</h2>
            <Link href="/donations" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {donationsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
            </div>
          ) : (myDonationsData?.items || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tracking #</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(myDonationsData.items as any[]).slice(0, 5).map((d: any, i: number) => (
                    <tr key={d.id || i} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-mono text-xs text-primary-600 font-medium">{d.tracking_number}</td>
                      <td className="py-2.5 px-3 capitalize text-foreground">{d.donation_type}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{d.amount ? formatCurrency(d.amount) : 'Item'}</td>
                      <td className="py-2.5 px-3"><span className="badge badge-primary text-[10px] uppercase">{d.status}</span></td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{formatDate(d.created_at, 'short')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="w-8 h-8 opacity-30 mx-auto mb-2" />
              <p className="text-sm">No donations yet.</p>
              <Link href="/donate" className="text-primary-600 dark:text-primary-400 text-sm hover:underline">Make your first donation →</Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
