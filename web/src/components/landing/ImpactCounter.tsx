'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import CountUp from 'react-countup'
import {
  Heart,
  Building2,
  Users,
  HandHeart,
  Globe,
  Zap,
} from 'lucide-react'

const counters = [
  { value: 48200, label: 'Active Donors', suffix: '+', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { value: 1240, label: 'Verified NGOs', suffix: '+', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { value: 32800, label: 'Volunteers', suffix: '+', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { value: 284000, label: 'Donations Made', suffix: '+', icon: HandHeart, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  { value: 120, label: 'Cities Covered', suffix: '+', icon: Globe, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { value: 9.8, label: 'Crore Raised', prefix: '₹', suffix: 'Cr', decimals: 1, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
]

export function ImpactCounter() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-16 bg-background" ref={ref}>
      <div className="container-app">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4 border border-primary-100 dark:border-primary-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
            </span>
            Real-time Impact
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Our Impact in <span className="gradient-text">Numbers</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every number represents a life touched, a meal shared, and a future changed.
          </p>
        </motion.div>

        {/* Counter Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {counters.map((counter, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="card p-5 text-center flex flex-col items-center gap-3 cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl ${counter.bg} flex items-center justify-center`}>
                <counter.icon className={`w-6 h-6 ${counter.color}`} />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">
                  {isInView ? (
                    <CountUp
                      start={0}
                      end={counter.value}
                      duration={2.5}
                      delay={i * 0.1}
                      prefix={counter.prefix || ''}
                      suffix={counter.suffix || ''}
                      decimals={counter.decimals || 0}
                      separator=","
                    />
                  ) : (
                    '0'
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">{counter.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
