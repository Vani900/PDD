'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Briefcase, Download, TrendingUp, Users, Award, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function CorporateView() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const { data: dashboard } = useQuery({
    queryKey: ['csr-dashboard'],
    queryFn: () => (api as any).donations.list({ is_corporate: true }).then((res: any) => res.data),
    enabled: mounted,
  })

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="badge badge-accent mb-2">Enterprise Portal</span>
            <h1 className="text-3xl font-display font-bold">Corporate CSR Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage annual CSR budgets, employee volunteering, and automated tax compliance.</p>
          </div>
          <button className="btn-primary flex items-center gap-2"><Download className="w-4 h-4" /> Download Annual CSR Report (PDF)</button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="text-xs text-muted-foreground mb-1">Total CSR Donated</div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(dashboard?.total_donated || 5000000)}</div>
            <div className="text-xs text-green-600 font-medium mt-1">100% Tax Compliant</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground mb-1">Tax Saved (Est.)</div>
            <div className="text-2xl font-bold text-primary-600">{formatCurrency(dashboard?.tax_saved_estimate || 1500000)}</div>
            <div className="text-xs text-muted-foreground mt-1">Section 80G Deductible</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground mb-1">Employee Volunteers</div>
            <div className="text-2xl font-bold text-foreground">1,240</div>
            <div className="text-xs text-accent-600 font-medium mt-1">3,400 Total Hours</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground mb-1">SDG Goals Supported</div>
            <div className="text-2xl font-bold text-foreground">5 / 17</div>
            <div className="text-xs text-muted-foreground mt-1">UN SDG Aligned</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg mb-4">CSR Campaign Allocations</h2>
            <div className="space-y-3">
              {[
                { name: 'Clean Drinking Water Initiative', allocated: '₹20,000,000', percentage: '40%' },
                { name: 'Digital Education for Rural Schools', allocated: '₹15,000,000', percentage: '30%' },
                { name: 'Emergency Disaster Relief Fund', allocated: '₹15,000,000', percentage: '30%' },
              ].map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <div className="flex justify-between text-sm font-semibold mb-1"><span>{c.name}</span><span className="text-primary-600">{c.allocated}</span></div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-primary-500" style={{ width: c.percentage }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display font-bold text-lg mb-4">CSR Verification & Audit Trail</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Audited by Statutory Auditors</div>
                  <div className="text-xs">Form 10BD tax certificates auto-generated.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
