'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, User, Mail, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterView() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('donor')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await api.auth.register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
        password,
        role,
      })
      toast.success('Registration successful! Please check your email for OTP verification.')
      router.push('/auth/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Check password requirements.')
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
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Join CharityAI</h1>
          <p className="text-white/60 text-xs mt-1">Start making an impact today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-400">
              <option value="donor">Donor (Individual)</option>
              <option value="volunteer">Volunteer</option>
              <option value="ngo_admin">NGO Organization</option>
              <option value="corporate_user">Corporate CSR</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Min 8 chars, 1 upper, 1 special" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400" />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Create Account
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/60">
          Already have an account? <Link href="/auth/login" className="text-primary-300 font-semibold hover:underline">Log in</Link>
        </div>
      </motion.div>
    </div>
  )
}
