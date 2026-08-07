'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const donationTypes = [
  { emoji: '🍱', label: 'Food', description: 'Meals, grains, vegetables, packaged food', color: 'from-orange-400 to-red-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800', count: '84,200 donations' },
  { emoji: '💰', label: 'Money', description: 'Direct monetary contributions to NGOs', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-800', count: '₹9.8Cr raised' },
  { emoji: '👕', label: 'Clothes', description: 'Clothing for all ages and seasons', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800', count: '1.2M items' },
  { emoji: '💊', label: 'Medicine', description: 'Medications, medical supplies', color: 'from-red-400 to-pink-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800', count: '340K medicines' },
  { emoji: '🩸', label: 'Blood', description: 'Blood donation for emergencies', color: 'from-red-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-800', count: '89K units' },
  { emoji: '📚', label: 'Books', description: 'Textbooks, notebooks, stationery', color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800', count: '1.2M books' },
  { emoji: '🎓', label: 'Education', description: 'Scholarships and education support', color: 'from-teal-400 to-cyan-500', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-100 dark:border-teal-800', count: '8,400 students' },
  { emoji: '🏠', label: 'Shelter', description: 'Housing support for homeless families', color: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800', count: '2,800 families' },
  { emoji: '🆘', label: 'Emergency', description: 'Disaster relief and SOS support', color: 'from-red-500 to-orange-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800', count: 'Instant response' },
  { emoji: '🪑', label: 'Furniture', description: 'Home essentials for families in need', color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-100 dark:border-yellow-800', count: '12K items' },
  { emoji: '💻', label: 'Electronics', description: 'Devices for digital education', color: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-100 dark:border-cyan-800', count: '4,200 devices' },
  { emoji: '🌿', label: 'Events', description: 'Event-based community drives', color: 'from-green-400 to-lime-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-800', count: '480 events' },
]

export function DonationTypes() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section className="section-padding bg-muted/30" ref={ref}>
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            What Can You <span className="gradient-text">Donate?</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every type of donation makes a difference. Choose what you can give,
            and our AI will match it with those who need it most.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {donationTypes.map((type, i) => (
            <motion.a
              key={i}
              href={`/donate?type=${type.label.toLowerCase()}`}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`${type.bg} ${type.border} border rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-card-hover group`}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{type.emoji}</div>
              <div className="font-semibold text-sm text-foreground mb-1">{type.label}</div>
              <div className="text-xs text-muted-foreground line-clamp-2 hidden sm:block">{type.description}</div>
              <div className="text-xs font-medium text-primary-600 dark:text-primary-400 mt-2">{type.count}</div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
