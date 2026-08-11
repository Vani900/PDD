'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Package, Droplets, BookOpen, Pill, Shirt, GraduationCap, Home, AlertTriangle, Armchair, Laptop,
  ArrowRight, ArrowLeft, Check, Loader2, Lock
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

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

import { useQuery } from '@tanstack/react-query'

export function DonateView() {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('food')
  const [selectedNgoReq, setSelectedNgoReq] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('1000')
  const [pickupCity, setPickupCity] = useState('Bangalore')
  const [pickupAddress, setPickupAddress] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdDonation, setCreatedDonation] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams) {
      const reqId = searchParams.get('requirement_id')
      const cat = searchParams.get('category')
      const t = searchParams.get('title')
      const city = searchParams.get('city')
      const ngoName = searchParams.get('ngo_name')
      const ngoId = searchParams.get('ngo_id')

      if (cat && CATEGORIES.some(c => c.id === cat)) {
        setCategory(cat)
      }
      if (t) setTitle(t)
      if (city) setPickupCity(city)
      if (reqId) {
        setSelectedNgoReq({ id: reqId, ngo_id: ngoId, ngo_name: ngoName || 'Partner NGO', item_name: t || 'Requested Item' })
      }
    }
  }, [searchParams])

  // Auth guard
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  // Real matching query: Fetch open NGO requirements matching selected category
  const { data: matchingNgoReqs, isLoading: matchingLoading } = useQuery({
    queryKey: ['matching-ngo-reqs', category],
    queryFn: () => api.ngoRequirements.list({ category, status: 'open', page_size: 5 }).then(r => r.data),
    enabled: isAuthenticated,
  })

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/30 pt-24 flex items-center justify-center">
        <div className="card p-10 text-center max-w-sm mx-auto">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Login Required</h2>
          <p className="text-muted-foreground text-sm mb-6">Please log in to make a donation.</p>
          <Link href="/auth/login" className="btn-primary w-full">Go to Login</Link>
          <Link href="/auth/register" className="btn-secondary w-full mt-2">Create Account</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload: any = {
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
      if (selectedNgoReq?.id) {
        payload.requirement_id = selectedNgoReq.id
        if (selectedNgoReq.ngo_id) payload.ngo_id = selectedNgoReq.ngo_id
      }
      const { data } = await api.donations.create(payload)
      setCreatedDonation(data)
      setStep(4)
      toast.success('Donation submitted successfully!')
    } catch (err: any) {
      const response = err.response?.data
      const message = response?.detail?.message || response?.message ||
        (typeof response?.detail === 'string' ? response.detail : null) ||
        'Failed to submit donation. Please make sure you are logged in.'
      toast.error(message)
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

              {/* Real PostgreSQL NGO Matching Section */}
              <div className="mb-8 p-4 rounded-2xl bg-muted/40 border border-border">
                <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                  <span>🏢</span> Verified NGOs Requesting {CATEGORIES.find(c => c.id === category)?.name}
                </h3>
                {matchingLoading ? (
                  <div className="text-xs text-muted-foreground">Searching database for active NGO requests...</div>
                ) : (matchingNgoReqs?.items || []).length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {(matchingNgoReqs.items as any[]).map((req: any) => (
                      <div
                        key={req.id}
                        onClick={() => {
                          setSelectedNgoReq(req)
                          setTitle(`${req.item_name} (${req.quantity ? req.quantity + ' ' + (req.unit || '') : 'Requested'})`)
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          selectedNgoReq?.id === req.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-border bg-card hover:bg-muted/60'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-foreground">{req.ngo_name}</div>
                          <div className="text-muted-foreground mt-0.5">
                            Requesting: <strong className="text-foreground">{req.item_name}</strong> {req.quantity ? `(${req.quantity} ${req.unit || ''})` : ''} · 📍 {req.city}
                          </div>
                        </div>
                        <span className="badge badge-primary text-[10px] uppercase">{selectedNgoReq?.id === req.id ? 'Selected' : 'Select'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    No active NGO requests found for this category currently. Your donation will be listed publicly for any verified NGO to claim.
                  </div>
                )}
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
                {/* 1. MONEY CATEGORY */}
                {category === 'money' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Contribution Amount (INR)</label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {['500', '1000', '2500', '5000'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(val)}
                          className={`py-2.5 text-sm font-bold rounded-xl border transition-all ${
                            amount === val
                              ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                              : 'bg-background border-border text-foreground hover:bg-muted/50'
                          }`}
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground text-sm font-bold">₹</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input-field pl-8"
                        placeholder="Enter custom amount"
                      />
                    </div>
                  </div>
                )}

                {/* 2. BLOOD CATEGORY */}
                {category === 'blood' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Blood Group</label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => setTitle(`Blood Group ${bg}`)}
                            className={`py-2 text-xs font-bold rounded-xl border ${
                              title.includes(bg)
                                ? 'bg-red-500 text-white border-red-500 shadow-md'
                                : 'bg-background border-border text-foreground hover:bg-muted/50'
                            }`}
                          >
                            🩸 {bg}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Units Available / Hospital Name</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. 2 Units O+ at Manipal Hospital"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Medical Notes / Urgency</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Donor availability, recent health clearance, hospital contact person..."
                        className="input-field resize-none"
                      />
                    </div>
                  </>
                )}

                {/* 3. FOOD CATEGORY */}
                {category === 'food' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Food Item & Quantity</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. 50 kg Rice, 20 kg Pulses or 100 Cooked Meal Packets"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Food Details (Type, Cooked Date / Expiry)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="State if raw ration, packaged dry food, or freshly cooked meals with prepared time..."
                        className="input-field resize-none"
                      />
                    </div>
                  </>
                )}

                {/* 4. CLOTHES CATEGORY */}
                {category === 'clothes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Apparel Type & Quantity</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. 15 Pair Men's Shirts & 10 Winter Blankets"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Sizes, Age Group & Condition</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Gently used, washed, folded. Suitable for kids age 5-12 or adults..."
                        className="input-field resize-none"
                      />
                    </div>
                  </>
                )}

                {/* 5. MEDICINE CATEGORY */}
                {category === 'medicine' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Medicine Name & Strips/Quantity</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Paracetamol 500mg (10 Strips) & Insulin Vials"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Date & Storage Instructions</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Expiry date (must be > 3 months), sealed packaging, refrigeration requirements..."
                        className="input-field resize-none"
                      />
                    </div>
                  </>
                )}

                {/* 6. BOOKS CATEGORY */}
                {category === 'books' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Book Title / Grade Level & Quantity</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Class 10 NCERT Science & Math Sets (25 Books)"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subject & Educational Level</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Primary school, high school, competitive exams (JEE/NEET), or storybooks..."
                        className="input-field resize-none"
                      />
                    </div>
                  </>
                )}

                {/* 7. ELECTRONICS & OTHER CATEGORIES */}
                {category !== 'money' && category !== 'blood' && category !== 'food' && category !== 'clothes' && category !== 'medicine' && category !== 'books' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Device / Item Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Dell Core i5 Laptop for online learning"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Working Condition & Specifications</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Describe device specs, chargers included, battery health, and working status..."
                        className="input-field resize-none"
                      />
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
