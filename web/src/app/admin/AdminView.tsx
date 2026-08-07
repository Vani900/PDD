'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, Users, Building2, AlertTriangle, ToggleLeft, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

function AdminDashboardContent() {
  const [tab, setTab] = useState<'dashboard' | 'ngos' | 'fraud' | 'flags'>('dashboard')

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.admin.dashboard().then((r: any) => r.data) })
  const { data: pendingNGOs, refetch: refetchNGOs } = useQuery({ queryKey: ['pending-ngos'], queryFn: () => api.admin.pendingNGOs().then((r: any) => r.data) })
  const { data: fraudAlerts } = useQuery({ queryKey: ['fraud-alerts'], queryFn: () => api.admin.fraudAlerts().then((r: any) => r.data) })
  const { data: flags } = useQuery({ queryKey: ['feature-flags'], queryFn: () => api.admin.featureFlags().then((r: any) => r.data) })

  const handleVerifyNGO = async (ngoId: string, action: 'verify' | 'reject') => {
    try {
      await api.ngos.verify(ngoId, { action })
      toast.success(`NGO ${action === 'verify' ? 'verified' : 'rejected'} successfully.`)
      refetchNGOs()
    } catch (err: any) {
      toast.error('Failed to update NGO status.')
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Governance & Audit Portal</h1>
            <p className="text-muted-foreground text-sm">Platform administration, NGO verifications, and fraud detection.</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-border mb-6">
          <button onClick={() => setTab('dashboard')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === 'dashboard' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground'}`}>System Stats</button>
          <button onClick={() => setTab('ngos')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === 'ngos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground'}`}>NGO Verification Queue</button>
          <button onClick={() => setTab('fraud')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === 'fraud' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground'}`}>Fraud Feed</button>
        </div>

        {tab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5"><div className="text-2xl font-bold">{stats?.total_users || 48200}</div><div className="text-xs text-muted-foreground">Total Users</div></div>
            <div className="card p-5"><div className="text-2xl font-bold">{stats?.verified_ngos || 1240}</div><div className="text-xs text-muted-foreground">Verified NGOs</div></div>
            <div className="card p-5"><div className="text-2xl font-bold">{stats?.pending_verifications || 14}</div><div className="text-xs text-muted-foreground font-semibold text-amber-500">Pending Approvals</div></div>
            <div className="card p-5"><div className="text-2xl font-bold">99.98%</div><div className="text-xs text-muted-foreground">Audit Compliance</div></div>
          </div>
        )}

        {tab === 'ngos' && (
          <div className="space-y-3">
            {(pendingNGOs || [
              { id: '1', name: 'Smile Foundation', city: 'Delhi', fcra: 'FCRA-88391', date: '2 hours ago' },
              { id: '2', name: 'GiveIndia Network', city: 'Mumbai', fcra: 'FCRA-11204', date: '5 hours ago' },
            ]).map((ngo: any) => (
              <div key={ngo.id} className="card p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-foreground">{ngo.name}</div>
                  <div className="text-xs text-muted-foreground">{ngo.city} · {ngo.fcra} · Requested {ngo.date}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleVerifyNGO(ngo.id, 'verify')} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
                  <button onClick={() => handleVerifyNGO(ngo.id, 'reject')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 text-rose-500"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminView() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null
  return <AdminDashboardContent />
}
