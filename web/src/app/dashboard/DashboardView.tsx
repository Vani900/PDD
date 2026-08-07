'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Heart, Users, Award, ArrowUpRight, Package, Bell, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const chartData = [
  { date: 'Jan', amount: 24000, count: 12 },
  { date: 'Feb', amount: 36000, count: 18 },
  { date: 'Mar', amount: 28000, count: 15 },
  { date: 'Apr', amount: 52000, count: 26 },
  { date: 'May', amount: 48000, count: 24 },
  { date: 'Jun', amount: 68000, count: 34 },
  { date: 'Jul', amount: 82000, count: 41 },
]

export function DashboardView() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { data: impact } = useQuery({ queryKey: ['impact'], queryFn: () => api.users.impact().then((r: any) => r.data) })
  const { data: donationsData } = useQuery({ queryKey: ['donations'], queryFn: () => api.donations.list({ page_size: 5 }).then((r: any) => r.data) })
  const { data: notifications } = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications.list({ page_size: 5 }).then((r: any) => r.data) })

  const statCards = [
    { label: 'Total Donated', value: formatCurrency(impact?.total_amount || 0), icon: TrendingUp, color: 'text-green-500 bg-green-50 dark:bg-green-900/20', trend: '+12.5%' },
    { label: 'Donations Made', value: impact?.total_donations || 0, icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20', trend: '+3 this month' },
    { label: 'Impact Score', value: impact?.impact_score || 0, icon: Star, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', trend: 'Level ' + (impact?.level || 1) },
    { label: 'Volunteer Hours', value: `${impact?.volunteer_hours || 0}h`, icon: Users, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', trend: 'Top 10%' },
  ]

  return (
    <div className="min-h-screen bg-muted/30 pt-20">
      <div className="container-app py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Your Impact Dashboard</h1>
          <p className="text-muted-foreground">Track your donations and see the difference you&apos;re making.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{card.trend}</span>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{card.value}</div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Donation Trend</h2>
              <span className="text-xs text-muted-foreground">Last 7 months</span>
            </div>
            {mounted && (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#25a47e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#25a47e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="amount" stroke="#25a47e" strokeWidth={2} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Recent Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
            <h2 className="font-semibold text-foreground mb-4">Activity Stream</h2>
            <div className="space-y-3">
              {(notifications?.items || []).slice(0, 4).map((n: any) => (
                <div key={n.id} className="text-xs p-2.5 rounded-xl bg-muted/50 border border-border/50">
                  <div className="font-semibold text-foreground">{n.title}</div>
                  <div className="text-muted-foreground mt-0.5">{n.message}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">{formatDate(n.created_at, 'relative')}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Donations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Donations</h2>
            <Link href="/donations" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">View all <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
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
                {(donationsData?.items || []).slice(0, 5).map((d: any, i: number) => (
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
        </motion.div>
      </div>
    </div>
  )
}
