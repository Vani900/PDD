'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Play,
  Sparkles,
  Heart,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react'

const floatingCards = [
  { icon: '🍱', label: 'Food Donated', value: '2.4M kg', color: 'from-orange-400 to-red-400', delay: 0 },
  { icon: '💉', label: 'Blood Units', value: '89,400', color: 'from-red-400 to-pink-400', delay: 0.2 },
  { icon: '📚', label: 'Books Shared', value: '1.2M', color: 'from-blue-400 to-indigo-400', delay: 0.4 },
  { icon: '💊', label: 'Medicines', value: '340K+', color: 'from-green-400 to-teal-400', delay: 0.6 },
]

const stats = [
  { value: '₹12.4Cr', label: 'Raised', icon: TrendingUp },
  { value: '48,200', label: 'Donors', icon: Heart },
  { value: '1,240', label: 'NGOs', icon: Zap },
  { value: '99.9%', label: 'Uptime', icon: Shield },
]

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-hero"
    >
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary-500/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/20 blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary-600/5 blur-[80px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating particles (Deterministic to prevent SSR hydration mismatches) */}
        {Array.from({ length: 20 }).map((_, i) => {
          const left = `${(i * 17 + 7) % 95}%`
          const top = `${(i * 23 + 13) % 95}%`
          const duration = 3 + (i % 3)
          const delay = (i % 5) * 0.4
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/30 pointer-events-none"
              style={{ left, top }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration,
                repeat: Infinity,
                delay,
              }}
            />
          )
        })}
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative container-app pt-24 pb-16"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* ── Left: Copy ── */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary-300" />
                AI-Powered Donation Platform
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-300">Live</span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[1.1] text-balance">
                <span className="gradient-text-hero">Give Smarter.</span>
                <br />
                <span className="text-white">Impact</span>
                <br />
                <span className="gradient-text-hero">Deeper.</span>
              </h1>
            </motion.div>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-white/70 leading-relaxed max-w-lg"
            >
              India&apos;s most intelligent donation ecosystem connecting{' '}
              <span className="text-white font-medium">Donors, NGOs, Volunteers</span> and{' '}
              <span className="text-white font-medium">those in need</span> through the power of AI.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-primary-500 text-white font-semibold text-base
                           hover:bg-primary-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-primary group"
              >
                <Heart className="w-5 h-5 fill-white" />
                Start Donating
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/ngos"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-base
                           hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <Play className="w-4 h-4 fill-white" />
                Explore NGOs
              </Link>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid grid-cols-4 gap-4 pt-4"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl md:text-2xl font-display font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Visual ── */}
          <div className="hidden lg:block relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, type: 'spring' }}
              className="relative"
            >
              {/* Central circle */}
              <div className="relative w-96 h-96 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-white/10 backdrop-blur-sm" />
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-white/10" />
                <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-white/20 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Heart className="w-20 h-20 text-primary-300 fill-primary-400/50" />
                  </motion.div>
                </div>

                {/* Rotating ring */}
                <motion.div
                  className="absolute inset-4 rounded-full border border-dashed border-white/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              {/* Floating stat cards */}
              {floatingCards.map((card, i) => {
                const positions = [
                  { top: '0%', left: '-10%' },
                  { top: '15%', right: '-15%' },
                  { bottom: '15%', left: '-15%' },
                  { bottom: '0%', right: '-10%' },
                ]
                const pos = positions[i]
                return (
                  <motion.div
                    key={i}
                    className="absolute glass-card px-4 py-3 flex items-center gap-3 min-w-[160px]"
                    style={pos}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: [0, -8, 0],
                    }}
                    transition={{
                      opacity: { delay: card.delay + 0.8, duration: 0.5 },
                      scale: { delay: card.delay + 0.8, duration: 0.5 },
                      y: { duration: 3 + i * 0.5, repeat: Infinity, delay: card.delay },
                    }}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl flex-shrink-0`}>
                      {card.icon}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{card.value}</div>
                      <div className="text-xs text-white/60">{card.label}</div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>

        {/* ── Scroll indicator ── */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs">Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </motion.div>

      {/* ── Wave divider ── */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path d="M0 80V40C240 0 480 80 720 40C960 0 1200 80 1440 40V80H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  )
}
