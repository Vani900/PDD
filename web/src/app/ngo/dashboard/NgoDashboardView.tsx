'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Package, CheckCircle2, Clock, Plus, ArrowUpRight, Search, Send, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

export function NgoDashboardView() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const queryClient = useQueryClient()
  const user = useSelector((state: RootState) => state.auth.user)

  // Fetch NGO's own requirements
  const { data: requirements, isLoading: reqsLoading } = useQuery({
    queryKey: ['ngo-my-requirements'],
    queryFn: () => api.ngoRequirements.my().then(r => r.data),
    enabled: mounted,
  })

  // Fetch available public donations to request
  const { data: availableDonations, isLoading: donationsLoading } = useQuery({
    queryKey: ['available-donations'],
    queryFn: () => api.donations.list({ status: 'pending', page_size: 10 }).then(r => r.data),
    enabled: mounted,
  })

  // Fetch NGO's sent match requests & acceptance tracker
  const { data: myMatches } = useQuery({
    queryKey: ['ngo-sent-matches'],
    queryFn: () => api.ngoRequirements.myMatches().then(r => r.data).catch(() => ({ items: [] })),
    enabled: mounted,
    refetchInterval: 10_000,
  })

  // State for request modal
  const [selectedDonation, setSelectedDonation] = useState<any>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [selectedReqId, setSelectedReqId] = useState('')
  const [chatMatch, setChatMatch] = useState<any>(null)
  const [chatMessageText, setChatMessageText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  const requestMutation = useMutation({
    mutationFn: ({ reqId, donationId, message }: { reqId: string; donationId: string; message: string }) =>
      api.ngoRequirements.requestDonation(reqId, donationId, { message }),
    onSuccess: () => {
      toast.success('Donation match request sent to donor!')
      setSelectedDonation(null)
      setRequestMessage('')
      queryClient.invalidateQueries({ queryKey: ['available-donations'] })
      queryClient.invalidateQueries({ queryKey: ['ngo-my-requirements'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to request donation.')
    },
  })

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDonation || !selectedReqId) {
      toast.error('Please select one of your requirements.')
      return
    }
    requestMutation.mutate({
      reqId: selectedReqId,
      donationId: selectedDonation.id,
      message: requestMessage || 'Our NGO urgently requires this item for beneficiary support.',
    })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-16">
      <div className="container-app py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-primary text-xs uppercase">NGO Organization Portal</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">NGO Operations Hub</h1>
            <p className="text-muted-foreground text-sm">Post requirements and connect with active donors near you.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ngo/requirements" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Post Requirement
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{requirements?.total ?? 0}</div>
            <div className="text-xs text-muted-foreground">Active Requirements</div>
          </div>
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{availableDonations?.total ?? 0}</div>
            <div className="text-xs text-muted-foreground">Donations Available</div>
          </div>
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {(requirements?.items || []).filter((r: any) => r.status === 'matched').length}
            </div>
            <div className="text-xs text-muted-foreground">Pending Pickups</div>
          </div>
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {(requirements?.items || []).filter((r: any) => r.status === 'fulfilled').length}
            </div>
            <div className="text-xs text-muted-foreground">Fulfilled Demands</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Section 1: Available Donor Donations */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg text-foreground">Available Donor Donations</h2>
                <p className="text-xs text-muted-foreground">Recent unassigned donations you can request</p>
              </div>
            </div>

            {donationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
              </div>
            ) : (availableDonations?.items || []).length > 0 ? (
              <div className="space-y-3">
                {(availableDonations.items as any[]).map((d: any) => (
                  <div key={d.id} className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{d.title || d.donation_type}</span>
                        <span className="text-[10px] font-mono bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 px-2 py-0.5 rounded-full capitalize">{d.donation_type}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        📍 {d.pickup_city || 'City N/A'} · Created {formatDate(d.created_at, 'relative')}
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedDonation(d); setSelectedReqId(requirements?.items?.[0]?.id || '') }}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0"
                    >
                      <Send className="w-3 h-3" /> Request
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No open donations available to request at this time.
              </div>
            )}
          </div>

          {/* Section 2: NGO Requirements List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg text-foreground">Your Requirements</h2>
                <p className="text-xs text-muted-foreground">Stated needs for your organization</p>
              </div>
              <Link href="/ngo/requirements" className="text-xs text-primary-600 font-semibold hover:underline">View all →</Link>
            </div>

            {reqsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
              </div>
            ) : (requirements?.items || []).length > 0 ? (
              <div className="space-y-3">
                {(requirements.items as any[]).map((r: any) => (
                  <div key={r.id} className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{r.item_name}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${r.urgency === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{r.urgency}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Category: <span className="capitalize">{r.category}</span> · {r.quantity ? `${r.quantity} ${r.unit || ''}` : 'Any qty'} · 📍 {r.city}
                      </div>
                    </div>
                    <span className="badge badge-primary text-[10px] uppercase capitalize">{r.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <AlertCircle className="w-8 h-8 opacity-30 mx-auto mb-2" />
                <p>No requirements posted yet.</p>
                <Link href="/ngo/requirements" className="text-primary-600 font-semibold text-xs hover:underline mt-1 inline-block">+ Create your first requirement</Link>
              </div>
            )}
          </div>
        </div>

        {/* Sent Match Requests & Acceptance Tracker */}
        <div className="card p-6 mb-8 border-emerald-500/30 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <h2 className="text-lg font-bold text-foreground">Sent Match Requests & Acceptance Tracker</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              {(myMatches?.items || []).length} Total Requests
            </span>
          </div>

          {(myMatches?.items || []).length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {(myMatches.items as any[]).map((match: any) => (
                <div key={match.match_id} className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-foreground">{match.donation_title || match.donation_type}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Target NGO: {match.ngo_name || 'Your NGO'}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      match.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : match.status === 'rejected'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {match.status}
                    </span>
                  </div>

                  {match.request_message && (
                    <p className="text-xs text-muted-foreground italic">&quot;{match.request_message}&quot;</p>
                  )}
                  {match.response_message && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Donor response: &quot;{match.response_message}&quot;</p>
                  )}

                  <div className="mt-2 pt-2 border-t border-border/50 flex justify-end">
                    <button
                      onClick={() => setChatMatch(match)}
                      className="px-3 py-1 text-xs rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/20 transition flex items-center gap-1"
                    >
                      💬 Chat / Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs">
              No match requests sent yet. Browse available donor contributions above and click Request!
            </div>
          )}
        </div>

        {/* Modal for requesting a donation */}
        {selectedDonation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-2">Request Donation Match</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Requesting: <strong className="text-foreground">{selectedDonation.title || selectedDonation.donation_type}</strong>
              </p>

              <form onSubmit={handleSendRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Select your matching requirement</label>
                  {(requirements?.items || []).length > 0 ? (
                    <select
                      value={selectedReqId}
                      onChange={(e) => setSelectedReqId(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                      required
                    >
                      {(requirements.items as any[]).map((r: any) => (
                        <option key={r.id} value={r.id}>{r.item_name} ({r.category} · {r.city})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-red-500">You must create a requirement first before requesting donations.</div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Message to Donor</label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={3}
                    placeholder="Describe why your NGO needs this donation and how it will be picked up..."
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setSelectedDonation(null)} className="btn-secondary text-xs">Cancel</button>
                  <button type="submit" disabled={requestMutation.isPending} className="btn-primary text-xs">
                    {requestMutation.isPending ? 'Sending...' : 'Send Match Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* NGO Direct Match Communication Modal */}
        {chatMatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                💬 Coordinate Pickup with Donor
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Donation: <strong className="text-foreground">{chatMatch.donation_title || chatMatch.donation_type}</strong>
              </p>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto p-3 rounded-xl bg-muted/40 border border-border">
                {chatMatch.request_message && (
                  <div className="p-2.5 rounded-lg bg-card border border-border text-xs">
                    <div className="font-semibold text-muted-foreground mb-0.5">Your NGO Message:</div>
                    <p className="text-foreground">&quot;{chatMatch.request_message}&quot;</p>
                  </div>
                )}
                {chatMatch.response_message && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">Donor Message:</div>
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
                  toast.success('Message sent to Donor!')
                  setChatMessageText('')
                  setChatMatch(null)
                  queryClient.invalidateQueries({ queryKey: ['ngo-sent-matches'] })
                } catch (err: any) {
                  toast.error('Failed to send message.')
                } finally {
                  setSendingMsg(false)
                }
              }} className="space-y-3">
                <textarea
                  value={chatMessageText}
                  onChange={(e) => setChatMessageText(e.target.value)}
                  placeholder="Type pickup time, vehicle number, or driver contact info..."
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
