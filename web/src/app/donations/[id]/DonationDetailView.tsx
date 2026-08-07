'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, MapPin, QrCode, ShieldCheck, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

function DonationDetailContent({ donationId }: { donationId: string }) {
  const { data: donation } = useQuery({
    queryKey: ['donation', donationId],
    queryFn: () => api.donations.get(donationId).then(r => r.data),
    enabled: Boolean(donationId),
  })

  const fallbackDonation = {
    id: donationId || '1',
    title: 'Grain Packs & Cooked Meals Drive',
    donation_type: 'food',
    tracking_number: 'DON-2026-88912',
    amount: 5000,
    pickup_city: 'Bangalore',
    pickup_address: 'Indiranagar 100ft Road, Bangalore, Karnataka',
    created_at: new Date().toISOString(),
    status: 'in_transit',
    qr_verified: true,
    scheduled_pickup_at: new Date().toISOString(),
  }

  const displayDonation = donation || fallbackDonation

  const timelineSteps = [
    { title: 'Donation Submitted', done: true, time: formatDate(displayDonation.created_at, 'long') },
    { title: 'AI NGO Matched', done: displayDonation.status !== 'pending', time: 'Matched' },
    { title: 'Volunteer Assigned / Pickup Scheduled', done: ['in_transit', 'delivered'].includes(displayDonation.status), time: displayDonation.scheduled_pickup_at ? formatDate(displayDonation.scheduled_pickup_at, 'short') : 'Pending' },
    { title: 'Delivered & Verified', done: displayDonation.status === 'delivered', time: displayDonation.qr_verified ? 'Verified via QR' : 'Pending' },
  ]

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app max-w-4xl">
        <Link href="/donations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Donations
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="badge badge-primary uppercase text-xs">{displayDonation.donation_type}</span>
                  <h1 className="text-2xl font-display font-bold text-foreground mt-1">{displayDonation.title || 'Donation Package'}</h1>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Tracking Number</div>
                  <div className="font-mono font-bold text-primary-600 text-lg">{displayDonation.tracking_number}</div>
                </div>
              </div>

              {displayDonation.amount && (
                <div className="text-3xl font-bold text-foreground mb-4">{formatCurrency(displayDonation.amount)}</div>
              )}

              <div className="border-t border-border pt-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  <span>Pickup City: <strong>{displayDonation.pickup_city || 'India'}</strong></span>
                </div>
                {displayDonation.pickup_address && (
                  <div className="text-xs text-muted-foreground pl-6">{displayDonation.pickup_address}</div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg mb-6">Live Status Timeline</h2>
              <div className="space-y-6 relative pl-6 border-l-2 border-primary-500/30">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${step.done ? 'bg-primary-500' : 'bg-muted-foreground/30'}`}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    <div className="font-semibold text-foreground text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{step.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR & Verified Status */}
          <div className="space-y-6">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Verification QR</h3>
              <p className="text-xs text-muted-foreground mb-4">Show this QR to the pickup volunteer for instant verification.</p>

              <div className="bg-white p-4 rounded-2xl inline-block border border-border mb-3 shadow-elevation-1">
                {/* Simulated QR Code SVG */}
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="30" height="30" fill="black" />
                  <rect x="15" y="15" width="20" height="20" fill="white" />
                  <rect x="20" y="20" width="10" height="10" fill="black" />
                  <rect x="60" y="10" width="30" height="30" fill="black" />
                  <rect x="10" y="60" width="30" height="30" fill="black" />
                  <rect x="50" y="50" width="40" height="40" fill="black" />
                </svg>
              </div>
              <div className="text-xs font-mono text-muted-foreground">{displayDonation.tracking_number}</div>
            </div>

            <div className="card p-5 bg-gradient-primary text-white">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-bold text-sm">100% Tax Exempt</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                This donation qualifies for Section 80G tax benefits. Download receipt from your dashboard after delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DonationDetailView({ donationId }: { donationId?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !donationId) return null
  return <DonationDetailContent donationId={donationId} />
}
