'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Package, Droplets, BookOpen, Pill, Shirt, GraduationCap, Home, AlertTriangle, Armchair, Laptop,
  ArrowRight, ArrowLeft, Check, Sparkles, MapPin, Calendar, ShieldCheck, Loader2
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const CATEGORIES = [
  { id: 'food', name: 'Food & Meals', icon: Package, emoji: '🍱', desc: 'Grain packs, cooked meals, fresh produce' },
  { id: 'money', name: 'Monetary Support', icon: Heart, emoji: '💰', desc: 'Direct financial contributions to campaigns' },
  { id: 'blood', name: 'Blood Donation', icon: Droplets, emoji: '🩸', desc: 'Blood units for local hospitals & emergencies' },
  { id: 'clothes', name: 'Clothing', icon: Shirt, emoji: '👕', desc: 'Wearables for children, adults & winter wear' },
  { id: 'medicine', name: 'Medicine & Health', icon: Pill, emoji: '💊', desc: 'Unused unexpired medicines & equipment' },
  { id: 'books', name: 'Books & Stationery', icon: BookOpen, emoji: '📚', desc: 'School textbooks, notebooks, study material' },
  { id: 'education', name: 'Education Fund', icon: GraduationCap, emoji: '🎓', desc: 'Scholarship sponsorship for students' },
  { id: 'shelter', name: 'Shelter Kits', icon: Home, emoji: '🏠', desc: 'Tarpaulins, blankets & night kits' },
  { id: 'emergency', name: 'Disaster SOS', icon: AlertTriangle, emoji: '🆘', desc: 'Flood, earthquake & emergency relief' },
  { id: 'furniture', name: 'Home Furniture', icon: Armchair, emoji: '🪑', desc: 'Beds, tables, chairs for families' },
  { id: 'electronics', name: 'Digital Devices', icon: Laptop, emoji: '💻', desc: 'Laptops & tablets for online learning' },
]

export function DonateView() {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('food')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('1000')
  const [pickupCity, setPickupCity] = useState('Bangalore')
  const [pickupAddress, setPickupAddress] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdDonation, setCreatedDonation] = useState<any>(null)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        donation_type: category,
        title: title || `${CATEGORIES.find(c => c.id === category)?.name} Donation`,
        description,
        amount: category === 'money' ? parseFloat(amount) : null,
        currency: 'INR',
        is_anonymous: isAnonymous,
        pickup_address: pickupAddress,
        pickup_city: pickupCity,
        items: category !== 'money' ? [{ name: title || category, quantity: 1, unit: 'pack' }] : [],
      }
      const { data } = await api.donations.create(payload)
      setCreatedDonation(data)
      setStep(4)
      toast.success('Donation submitted successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit donation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app max-w-4xl">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Step {step} of 4</span>
            <span>{step === 1 ? 'Category' : step === 2 ? 'Details' : step === 3 ? 'Pickup & Review' : 'Confirmed'}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="card p-6 md:p-8">
              <h1 className="text-2xl font-display font-bold mb-2">What would you like to donate?</h1>
              <p className="text-muted-foreground text-sm mb-6">Select a donation category. Our AI will automatically match it with verified local NGOs.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      category === c.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/30'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{c.emoji}</div>
                    <div className="font-semibold text-sm text-foreground mb-1">{c.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{c.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="btn-primary">Next: Add Details <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="card p-6 md:p-8">
              <h1 className="text-2xl font-display font-bold mb-2">Donation Details</h1>
              <p className="text-muted-foreground text-sm mb-6">Tell us more about your {CATEGORIES.find(c => c.id === category)?.name} contribution.</p>

              <div className="space-y-4 mb-8">
                {category === 'money' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (INR)</label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {['500', '1000', '2500', '5000'].map((val) => (
                        <button key={val} onClick={() => setAmount(val)} className={`py-2 text-sm font-semibold rounded-xl border ${amount === val ? 'bg-primary-500 text-white border-primary-500' : 'bg-background border-border'}`}>₹{val}</button>
                      ))}
                    </div>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="Enter custom amount" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Title / Item Summary</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 10 kg Rice & 5 kg Pulses" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Detailed Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the item condition, quantity, expiry date..." className="input-field resize-none" />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="anon" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded border-border text-primary-600 focus:ring-primary-500" />
                  <label htmlFor="anon" className="text-sm text-muted-foreground">Donate anonymously (hide my profile from public feed)</label>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => setStep(3)} className="btn-primary">Next: Pickup Info <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="card p-6 md:p-8">
              <h1 className="text-2xl font-display font-bold mb-2">Pickup Location & Review</h1>
              <p className="text-muted-foreground text-sm mb-6">Our verified volunteer or NGO agent will pick up your donation from this address.</p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input type="text" value={pickupCity} onChange={(e) => setPickupCity(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Pickup Address</label>
                  <textarea value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} rows={2} placeholder="Flat/House No, Street, Landmark, Pincode" className="input-field resize-none" />
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Summary</div>
                  <div className="flex justify-between text-sm py-1"><span>Category</span><span className="font-semibold capitalize">{category}</span></div>
                  {category === 'money' ? (
                    <div className="flex justify-between text-sm py-1"><span>Amount</span><span className="font-semibold text-primary-600">₹{amount}</span></div>
                  ) : (
                    <div className="flex justify-between text-sm py-1"><span>Items</span><span className="font-semibold">{title || 'General Item'}</span></div>
                  )}
                  <div className="flex justify-between text-sm py-1"><span>City</span><span className="font-semibold">{pickupCity}</span></div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm & Donate
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && createdDonation && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
              <h1 className="text-2xl font-display font-bold mb-2">Thank You for Donating!</h1>
              <p className="text-muted-foreground text-sm mb-6">Your donation has been created. Live tracking number generated below:</p>

              <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 mb-6">
                <div className="text-xs text-muted-foreground">Tracking Code</div>
                <div className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-400 mt-1">{createdDonation.tracking_number}</div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href={`/donations/${createdDonation.donation_id}`} className="btn-primary w-full">Track Donation Status</Link>
                <Link href="/dashboard" className="btn-secondary w-full">Go to Dashboard</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
