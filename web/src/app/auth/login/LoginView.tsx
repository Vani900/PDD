'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Lock, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setUser, setTokens } from '@/store/slices/authSlice'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const searchParams = useSearchParams()
  const registered = searchParams?.get('registered')

  const [loginRole, setLoginRole] = useState<'donor' | 'ngo'>('donor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data } = await api.auth.login({ email, password })

      if (data.requires_2fa) {
        toast('2FA required', { icon: '🔑' })
        return
      }

      // Save token & user in state & localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        localStorage.setItem('user_role', data.role || loginRole)
      }

      dispatch(setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token }))
      dispatch(setUser({ id: data.user_id, email: data.email, role: data.role || loginRole, account_status: 'active' }))
      toast.success(`Welcome back as ${loginRole === 'ngo' ? 'NGO Partner' : 'Donor'}!`)

      // Role-based dashboard routing
      const userRole: string = data.role || loginRole
      const targetPath = (userRole === 'ngo_admin' || userRole === 'ngo_staff' || userRole === 'ngo' || loginRole === 'ngo')
        ? '/ngo/dashboard'
        : userRole === 'admin' || userRole === 'super_admin'
        ? '/admin'
        : '/dashboard'

      router.push(targetPath)
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/auth/login') {
          window.location.href = targetPath
        }
      }, 300)
    } catch (err: any) {
      const response = err.response?.data
      if (response?.detail) {
        const detail = response.detail
        if (typeof detail === 'object' && detail.error_code === 'ACCOUNT_INACTIVE') {
          toast.error('Account not verified. Please check your email for the OTP.')
        } else if (typeof detail === 'object' && detail.message) {
          toast.error(detail.message)
        } else if (typeof detail === 'string') {
          toast.error(detail)
        } else {
          toast.error('Invalid email or password.')
        }
      } else if (response?.message) {
        toast.error(response.message)
      } else {
        toast.error('Login failed. Check your email and password.')
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
          <h1 className="text-2xl font-display font-bold text-white">Welcome Back</h1>
          <p className="text-white/60 text-xs mt-1">Select your account type to continue</p>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-white/10 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setLoginRole('donor')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                loginRole === 'donor' ? 'bg-primary-500 text-white shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              ❤️ Donor Login
            </button>
            <button
              type="button"
              onClick={() => setLoginRole('ngo')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                loginRole === 'ngo' ? 'bg-primary-500 text-white shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              🏢 NGO Partner Login
            </button>
          </div>
        </div>

        {registered && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-xs">Account created! Log in to access your dashboard.</p>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/60">
          Don&apos;t have an account? <Link href="/auth/register" className="text-primary-300 font-semibold hover:underline">Register free</Link>
        </div>
      </motion.div>
    </div>
  )
}

import { Suspense } from 'react'
export default function LoginView() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-hero" />}>
      <LoginForm />
    </Suspense>
  )
}
