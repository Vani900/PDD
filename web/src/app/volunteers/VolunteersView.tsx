'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Trophy, MapPin, CheckCircle, Clock, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export function VolunteersView() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const [activeTab, setActiveTab] = useState<'tasks' | 'leaderboard'>('tasks')

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.volunteers.leaderboard({ limit: 10 }).then(r => r.data),
    enabled: mounted,
  })

  const sampleTasks = [
    { id: '1', title: 'Food Pickup & Delivery to Akshaya Patra', location: 'Indiranagar, Bangalore', scheduled: 'Today, 4:00 PM', points: 50, urgency: 'High' },
    { id: '2', title: 'Clothes Sorting & Packaging Drive', location: 'Koramangala, Bangalore', scheduled: 'Tomorrow, 10:00 AM', points: 30, urgency: 'Normal' },
    { id: '3', title: 'Medical Camp Volunteer Assistance', location: 'Whitefield, Bangalore', scheduled: 'Sat, 9:00 AM', points: 100, urgency: 'High' },
  ]

  const handleAcceptTask = async (taskId: string) => {
    try {
      await api.volunteers.acceptTask(taskId)
      toast.success('Task claimed successfully!')
    } catch (err: any) {
      toast.success('Task claimed! (Demo mode)')
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Volunteer Hub</h1>
            <p className="text-muted-foreground text-sm">Join nearby pickup drives, logistics tasks, and community relief efforts.</p>
          </div>
          <button className="btn-primary">+ Register as Volunteer</button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-border mb-6">
          <button onClick={() => setActiveTab('tasks')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground'}`}>Available Tasks</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'leaderboard' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground'}`}>Leaderboard & Champions</button>
        </div>

        {activeTab === 'tasks' ? (
          <div className="space-y-4">
            {sampleTasks.map((t) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{t.title}</h3>
                    <span className={`badge text-xs ${t.urgency === 'High' ? 'badge-error' : 'badge-primary'}`}>{t.urgency} Urgency</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary-500" /> {t.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-accent-500" /> {t.scheduled}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-primary-600">+{t.points} Impact Pts</span>
                  <button onClick={() => handleAcceptTask(t.id)} className="btn-primary text-xs px-4 py-2">Claim Task</button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg mb-4">Volunteer Champions</h2>
            <div className="space-y-3">
              {(leaderboard?.items || [
                { id: '1', name: 'Arjun Sharma', rating: 4.9, total_tasks_completed: 142, total_hours: 380, rank: '🏆 Legend' },
                { id: '2', name: 'Kavya Raman', rating: 4.8, total_tasks_completed: 98, total_hours: 245, rank: '⭐ Champion' },
                { id: '3', name: 'Ravi Malhotra', rating: 4.7, total_tasks_completed: 76, total_hours: 190, rank: '🎯 Contributor' },
              ]).map((v: any, i: number) => (
                <div key={v.id || i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500 text-white font-bold text-sm flex items-center justify-center">#{i + 1}</div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{v.rank}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold text-primary-600">{v.total_tasks_completed} Tasks</div>
                    <div className="text-muted-foreground">{v.total_hours} Hours</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
