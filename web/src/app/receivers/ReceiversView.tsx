'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, Check, Loader2, HeartHandshake } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export function ReceiversView() {
  const [needType, setNeedType] = useState('food')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [familySize, setFamilySize] = useState('4')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      try { await api.receivers.createProfile({ family_size: parseInt(familySize), monthly_income: 0 }) } catch {}
      const { data } = await api.receivers.createRequest({
        need_type: needType,
        title,
        description,
        urgency_level: urgency,
        quantity_needed: 1,
      })
      setSubmittedId(data.request_id)
      toast.success('Help request submitted! Local NGOs notified.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <div className="container-app max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent-50 dark:bg-accent-900/20 text-accent-600 flex items-center justify-center mx-auto mb-3 text-3xl">🤝</div>
          <h1 className="text-3xl font-display font-bold">Request Assistance</h1>
          <p className="text-muted-foreground text-sm mt-1">If you or your family are in need of food, clothing, shelter, or medical support, CharityAI connects you with verified NGOs.</p>
        </div>

        {submittedId ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
            <p className="text-muted-foreground text-sm mb-4">Your application has been prioritized by our AI matching engine. Verified NGOs in your city will review your request shortly.</p>
            <div className="p-3 bg-muted rounded-xl font-mono text-xs mb-6">Request ID: {submittedId}</div>
            <button onClick={() => setSubmittedId(null)} className="btn-primary">Submit Another Request</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">What do you need help with?</label>
              <select value={needType} onChange={(e) => setNeedType(e.target.value)} className="input-field">
                <option value="food">Food & Rations</option>
                <option value="clothes">Clothing & Blankets</option>
                <option value="medicine">Medical Supplies & Medicine</option>
                <option value="shelter">Emergency Shelter</option>
                <option value="education">School & Education Support</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title of Request</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Monthly Ration Support for Family" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Describe Your Situation</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} placeholder="Provide details about your current need..." className="input-field resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Family Members</label>
                <input type="number" value={familySize} onChange={(e) => setFamilySize(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Urgency</label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="input-field">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical Emergency (SOS)</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 mt-4">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartHandshake className="w-4 h-4" />} Submit Help Application
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
