'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyForm() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const searchParams = useSearchParams()
  const userId = searchParams?.get('user_id') || ''
  const initialEmail = searchParams?.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) {
      toast.error('Please enter a 6-digit OTP code.')
      return
    }

    setIsLoading(true)
    try {
      await api.auth.verifyEmail({
        user_id: userId,
        email,
        otp_code: otpCode,
      })
      toast.success('Email verified successfully! Please log in.')
      router.push('/auth/login?registered=1')
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || 'Invalid or expired OTP.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 pt-20">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-3 shadow-glow-primary">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Verify Your Email</h1>
          <p className="text-white/60 text-xs mt-1">Enter the 6-digit code sent to {email || 'your email'}</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">OTP Code</label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              required
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-white outline-none focus:ring-2 focus:ring-primary-400"
            />
            <p className="text-[10px] text-white/40 mt-1 text-center">Development OTP: 123456</p>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Verify & Activate
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/60">
          Already verified? <Link href="/auth/login" className="text-primary-300 font-semibold hover:underline">Log in</Link>
        </div>
      </motion.div>
    </div>
  )
}

export function VerifyView() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-hero" />}>
      <VerifyForm />
    </Suspense>
  )
}
