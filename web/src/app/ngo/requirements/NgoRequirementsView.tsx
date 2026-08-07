'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Building2, MapPin, AlertTriangle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const CATEGORIES = [
  { id: 'food', name: 'Food & Meals' },
  { id: 'money', name: 'Monetary Support' },
  { id: 'blood', name: 'Blood Donation' },
  { id: 'clothes', name: 'Clothing' },
  { id: 'medicine', name: 'Medicine & Health' },
  { id: 'books', name: 'Books & Educational' },
  { id: 'shelter', name: 'Shelter Kits' },
  { id: 'emergency', name: 'Disaster SOS' },
]

export function NgoRequirementsView() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  // Form fields
  const [category, setCategory] = useState('food')
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('kg')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Bangalore')
  const [urgency, setUrgency] = useState('medium')

  // Fetch NGO requirements
  const { data, isLoading } = useQuery({
    queryKey: ['ngo-my-requirements'],
    queryFn: () => api.ngoRequirements.my().then(r => r.data),
    enabled: mounted,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.ngoRequirements.create(payload),
    onSuccess: () => {
      toast.success('Requirement posted successfully!')
      setShowForm(false)
      setItemName('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['ngo-my-requirements'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to post requirement.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) {
      toast.error('Item name is required.')
      return
    }
    createMutation.mutate({
      category,
      item_name: itemName.trim(),
      quantity: quantity ? parseFloat(quantity) : null,
      unit,
      description,
      city,
      urgency,
    })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-16">
      <div className="container-app py-8 max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/ngo/dashboard" className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to NGO Hub
            </Link>
            <h1 className="text-2xl font-display font-bold">NGO Requirements Directory</h1>
            <p className="text-muted-foreground text-sm">Post demands for supplies, funds, or emergency items.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'New Requirement'}
          </button>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="card p-6 mb-8 space-y-4 border-2 border-primary-500/30"
            >
              <h2 className="text-lg font-bold text-foreground">Post New Requirement</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Item / Requirement Name</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    placeholder="e.g. 50 kg Rice or 10 Blankets"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="50"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg, packs, items, INR"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Urgency</label>
                  <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Emergency)</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Description / Details</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional notes for donors..."
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary text-xs">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Requirement'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Requirements List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
          </div>
        ) : (data?.items || []).length > 0 ? (
          <div className="space-y-3">
            {(data.items as any[]).map((r: any) => (
              <div key={r.id} className="card p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-base">{r.item_name}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${r.urgency === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{r.urgency}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Category: <span className="capitalize">{r.category}</span> · Quantity: {r.quantity ? `${r.quantity} ${r.unit || ''}` : 'Flexible'} · 📍 {r.city}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">
                    Posted {formatDate(r.created_at, 'relative')}
                  </div>
                </div>
                <span className="badge badge-primary text-xs uppercase capitalize">{r.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-muted-foreground">
            <Building2 className="w-10 h-10 opacity-30 mx-auto mb-2" />
            <p className="font-medium text-foreground">No requirements posted yet</p>
            <p className="text-xs mt-1">Create a requirement to notify donors what your NGO needs.</p>
          </div>
        )}
      </div>
    </div>
  )
}
