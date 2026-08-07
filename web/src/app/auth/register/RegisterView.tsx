'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, User, Mail, Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /\d/.test(p), label: 'One number' },
  { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'One special character' },
]

export default function RegisterView() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('donor')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPasswordRules, setShowPasswordRules] = useState(false)
  const router = useRouter()

  const validatePassword = (p: string) => PASSWORD_RULES.every(r => r.test(p))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Frontend validation
    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.first_name = 'First name is required.'
    if (!lastName.trim()) newErrors.last_name = 'Last name is required.'
    if (!email.includes('@')) newErrors.email = 'Enter a valid email address.'
    if (!validatePassword(password)) {
      const failed = PASSWORD_RULES.filter(r => !r.test(password)).map(r => r.label)
      newErrors.password = `Password needs: ${failed.join(', ')}.`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstError = Object.values(newErrors)[0]
      toast.error(firstError)
      return
    }

    setIsLoading(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      const { data } = await api.auth.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: cleanEmail,
        password,
        role,
      })
      toast.success(data.message || 'Registration successful!')
      if (data.requires_verification) {
        router.push(`/auth/verify?user_id=${data.user_id}&email=${encodeURIComponent(cleanEmail)}`)
      } else {
        router.push('/auth/login?registered=1')
      }
    } catch (err: any) {
      const data = err.response?.data
      const status = err.response?.status

      if (status === 409 || data?.error_code === 'EMAIL_ALREADY_EXISTS') {
        toast.error('An account with this email already exists. Please log in!')
        setTimeout(() => router.push('/auth/login'), 2000)
      } else if (data?.detail && Array.isArray(data.detail)) {
        const fieldErrors: Record<string, string> = {}
        data.detail.forEach((d: any) => {
          const field = d.loc?.[d.loc.length - 1] || 'general'
          fieldErrors[field] = d.msg
        })
        setErrors(fieldErrors)
        const firstMsg = data.detail[0]?.msg || 'Please check field validation errors.'
        toast.error(`Validation Error: ${firstMsg}`)
      } else {
        const msg = data?.message || (typeof data?.detail === 'string' ? data.detail : data?.detail?.message) || 'Registration failed. Please try again.'
        toast.error(msg)
      }
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
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={`w-full bg-white/10 border rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400 ${errors.first_name ? 'border-red-400' : 'border-white/20'}`}
              />
              {errors.first_name && <p className="text-red-400 text-xs mt-0.5">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={`w-full bg-white/10 border rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400 ${errors.last_name ? 'border-red-400' : 'border-white/20'}`}
              />
              {errors.last_name && <p className="text-red-400 text-xs mt-0.5">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full bg-white/10 border rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400 ${errors.email ? 'border-red-400' : 'border-white/20'}`}
            />
            {errors.email && <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-400">
              <option value="donor">Donor (Individual)</option>
              <option value="volunteer">Volunteer</option>
              <option value="ngo_admin">NGO Organization</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setShowPasswordRules(true) }}
              required
              placeholder="Min 8 chars, uppercase, number, symbol"
              className={`w-full bg-white/10 border rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400 ${errors.password ? 'border-red-400' : 'border-white/20'}`}
            />
            {errors.password && <p className="text-red-400 text-xs mt-0.5">{errors.password}</p>}
            {showPasswordRules && password.length > 0 && (
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {rule.test(password)
                      ? <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                      : <AlertCircle className="w-3 h-3 text-white/40 flex-shrink-0" />}
                    <span className={`text-xs ${rule.test(password) ? 'text-green-400' : 'text-white/40'}`}>{rule.label}</span>
                  </div>
                ))}
              </div>
            )}
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
