'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Heart, Users, Star, ArrowUpRight, Bell, Loader2, Package, AlertCircle, RefreshCw, Check, X } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
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

  const queryClient = useQueryClient()
  const [actioningMatchId, setActioningMatchId] = useState<string | null>(null)
  const [chatMatch, setChatMatch] = useState<any>(null)
  const [chatMessageText, setChatMessageText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  const { data: myMatchesData } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => api.ngoRequirements.myMatches().then((r: any) => r.data).catch(() => ({ items: [] })),
    enabled: mounted && hasToken,
    staleTime: 15_000,
  })

  // Fetch Urgent NGO Demands / Requirements
  const { data: ngoRequirementsData } = useQuery({
    queryKey: ['urgent-ngo-requirements'],
    queryFn: () => api.ngoRequirements.list({ page_size: 6 }).then((r: any) => r.data).catch(() => ({ items: [] })),
    enabled: mounted,
    staleTime: 15_000,
  })

  const handleAcceptMatch = async (matchId: string) => {
    setActioningMatchId(matchId)
    try {
      await api.ngoRequirements.acceptMatch(matchId)
      queryClient.invalidateQueries({ queryKey: ['my-matches'] })
      queryClient.invalidateQueries({ queryKey: ['my-donations'] })
    } catch (err: any) {
      alert(err.response?.data?.detail?.message || 'Error accepting match request')
    } finally {
      setActioningMatchId(null)
    }
  }

  const handleRejectMatch = async (matchId: string) => {
    setActioningMatchId(matchId)
    try {
      await api.ngoRequirements.rejectMatch(matchId)
      queryClient.invalidateQueries({ queryKey: ['my-matches'] })
    } catch (err: any) {
      alert(err.response?.data?.detail?.message || 'Error declining match request')
    } finally {
      setActioningMatchId(null)
    }
  }

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

        {/* Incoming NGO Match Requests */}
        {hasToken && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-5 mt-6 border-emerald-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📩</span>
                <h2 className="font-semibold text-foreground">Incoming NGO Match Requests</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {(myMatchesData?.items || []).length} Requests
              </span>
            </div>

            {(myMatchesData?.items || []).length > 0 ? (
              <div className="space-y-3">
                {(myMatchesData.items as any[]).map((match: any) => (
                  <div key={match.match_id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{match.ngo_name || 'Partner NGO'}</span>
                        <span className="badge badge-primary text-[10px] uppercase">{match.status}</span>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        Requested contribution for: <span className="font-bold">{match.donation_title || match.donation_type}</span>
                      </p>
                      {match.request_message && (
                        <p className="text-xs text-muted-foreground italic mt-1">&quot;{match.request_message}&quot;</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {(match.status === 'pending_donor' || match.status === 'requested') && (
                        <>
                          <button
                            disabled={actioningMatchId === match.match_id}
                            onClick={() => handleAcceptMatch(match.match_id)}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Request
                          </button>
                          <button
                            disabled={actioningMatchId === match.match_id}
                            onClick={() => handleRejectMatch(match.match_id)}
                            className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground hover:bg-muted font-medium transition"
                          >
                            <X className="w-3.5 h-3.5 inline mr-1" /> Decline
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setChatMatch(match)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/20 transition flex items-center gap-1"
                      >
                        💬 Chat / Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs">
                No incoming NGO requests. When an NGO requests your donation, it will appear here in real time.
              </div>
            )}
          </motion.div>
        )}

        {/* Urgent NGO Demands & Requirements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="card p-5 mt-6 border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <div>
                <h2 className="font-semibold text-foreground">Urgent NGO Demands & Requirements</h2>
                <p className="text-xs text-muted-foreground">NGOs near you urgently requesting supplies for community support.</p>
              </div>
            </div>
            <Link href="/donate" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:underline">
              Fulfill a Demand →
            </Link>
          </div>

          {(ngoRequirementsData?.items || []).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(ngoRequirementsData.items as any[]).map((req: any) => (
                <div key={req.id} className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-foreground">{req.ngo_name || 'Partner NGO'}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        req.urgency === 'critical' || req.urgency === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {req.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-1">
                      Needs: {req.item_name} {req.quantity ? `(${req.quantity} ${req.unit || ''})` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Category: <span className="capitalize">{req.category}</span> · 📍 {req.city}
                    </p>
                  </div>
                  <Link
                    href={`/donate?requirement_id=${req.id}&category=${encodeURIComponent(req.category)}&title=${encodeURIComponent(req.item_name)}&city=${encodeURIComponent(req.city)}&ngo_name=${encodeURIComponent(req.ngo_name || 'Partner NGO')}&ngo_id=${req.ngo_id}`}
                    className="btn-primary text-xs py-1.5 text-center w-full"
                  >
                    Fulfill This Demand
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs">
              No urgent NGO demands currently posted.
            </div>
          )}
        </motion.div>

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
        {/* Direct Match Communication Modal */}
        {chatMatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                💬 Direct Donor-NGO Communication
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Coordinating with <strong className="text-foreground">{chatMatch.ngo_name || 'NGO Partner'}</strong> for &quot;{chatMatch.donation_title || chatMatch.donation_type}&quot;
              </p>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto p-3 rounded-xl bg-muted/40 border border-border">
                {chatMatch.request_message && (
                  <div className="p-2.5 rounded-lg bg-card border border-border text-xs">
                    <div className="font-semibold text-muted-foreground mb-0.5">NGO Note:</div>
                    <p className="text-foreground">&quot;{chatMatch.request_message}&quot;</p>
                  </div>
                )}
                {chatMatch.response_message && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">Your Response / Message:</div>
                    <p className="text-foreground">&quot;{chatMatch.response_message}&quot;</p>
                  </div>
                )}
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!chatMessageText.trim()) return
                setSendingMsg(true)
                try {
                  await api.ngoRequirements.sendMatchMessage(chatMatch.match_id, { message: chatMessageText })
                  toast.success('Message sent to NGO!')
                  setChatMessageText('')
                  setChatMatch(null)
                  queryClient.invalidateQueries({ queryKey: ['my-matches'] })
                } catch (err: any) {
                  toast.error('Failed to send message.')
                } finally {
                  setSendingMsg(false)
                }
              }} className="space-y-3">
                <textarea
                  value={chatMessageText}
                  onChange={(e) => setChatMessageText(e.target.value)}
                  placeholder="Type pickup instructions, address details, or message for NGO..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none"
                  required
                />

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setChatMatch(null)} className="btn-secondary text-xs">Close</button>
                  <button type="submit" disabled={sendingMsg} className="btn-primary text-xs">
                    {sendingMsg ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
