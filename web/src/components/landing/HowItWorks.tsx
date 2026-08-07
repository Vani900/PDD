'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, UserPlus, Search, Heart, Truck, CheckCircle, Sparkles } from 'lucide-react'

const steps = [
  { step: '01', icon: UserPlus, title: 'Create Account', description: 'Sign up as a Donor, NGO, Volunteer, or Receiver. Our AI personalizes your experience instantly.', color: 'from-blue-500 to-indigo-600' },
  { step: '02', icon: Search, title: 'AI Matches You', description: 'Our AI engine analyzes your location, preferences, and history to find the perfect NGOs and donation opportunities.', color: 'from-purple-500 to-violet-600' },
  { step: '03', icon: Heart, title: 'Choose & Donate', description: 'Select your donation type — food, money, clothes, medicine, or blood. Schedule a pickup or drop off.', color: 'from-primary-500 to-teal-600' },
  { step: '04', icon: Truck, title: 'Track in Real-Time', description: 'Follow your donation from pickup to delivery with live GPS tracking, QR verification, and status updates.', color: 'from-orange-500 to-red-600' },
  { step: '05', icon: CheckCircle, title: 'See Your Impact', description: 'Get your tax receipt, impact certificate, and see exactly how many lives your donation touched.', color: 'from-green-500 to-emerald-600' },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section className="section-padding bg-muted/30" ref={ref}>
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 text-sm font-medium mb-4 border border-accent-100 dark:border-accent-800">
            <Sparkles className="w-4 h-4" />
            Powered by AI
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            How <span className="gradient-text">CharityAI</span> Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From registration to impact — our AI-powered platform makes donating simple, transparent, and incredibly effective.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-primary-500 via-orange-500 to-green-500 opacity-30" />

          <div className="grid md:grid-cols-5 gap-8 relative">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center text-center group"
              >
                {/* Icon circle */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-elevation-2 group-hover:shadow-elevation-3 transition-shadow`}
                >
                  <step.icon className="w-9 h-9 text-white" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {step.step}
                  </div>
                </motion.div>
                <h3 className="font-display font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
