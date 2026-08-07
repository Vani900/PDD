'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Package, Droplets, BookOpen, Pill, Shirt } from 'lucide-react'

const typeIcons: Record<string, React.ElementType> = {
  money: Heart, food: Package, blood: Droplets,
  books: BookOpen, medicine: Pill, clothes: Shirt,
}

const typeColors: Record<string, string> = {
  money: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  food: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  blood: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  books: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  medicine: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20',
  clothes: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
}

// Simulate live donation feed
const MOCK_FEED = [
  { id: '1', donor: 'Rahul M.', type: 'food', amount: null, item: '15 kg Rice', city: 'Mumbai', time: '2s ago' },
  { id: '2', donor: 'Priya K.', type: 'money', amount: '₹5,000', item: null, city: 'Bangalore', time: '8s ago' },
  { id: '3', donor: 'Anon', type: 'blood', amount: null, item: 'O+ (1 unit)', city: 'Delhi', time: '23s ago' },
  { id: '4', donor: 'Sita R.', type: 'clothes', amount: null, item: '20 garments', city: 'Chennai', time: '45s ago' },
  { id: '5', donor: 'Amit V.', type: 'books', amount: null, item: '30 textbooks', city: 'Pune', time: '1m ago' },
  { id: '6', donor: 'Corporate TCS', type: 'money', amount: '₹50,000', item: null, city: 'Hyderabad', time: '3m ago' },
]

export function LiveDonationFeed() {
  const [items, setItems] = useState<any[]>(MOCK_FEED)
  const [newItem, setNewItem] = useState<any>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const donors = ['Rohan P.', 'Meera S.', 'Corporate Infosys', 'Anon', 'Vikram N.']
      const types = Object.keys(typeColors)
      const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Kolkata']
      const type = types[Math.floor(Math.random() * types.length)]
      const fresh = {
        id: Date.now().toString(),
        donor: donors[Math.floor(Math.random() * donors.length)],
        type,
        amount: type === 'money' ? `₹${(Math.floor(Math.random() * 50) + 1) * 100}` : null,
        item: type !== 'money' ? `${Math.floor(Math.random() * 20) + 1} units` : null,
        city: cities[Math.floor(Math.random() * cities.length)],
        time: 'just now',
      }
      setNewItem(fresh)
      setItems((prev: any[]) => [fresh, ...prev.slice(0, 5)])
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="section-padding bg-background">
      <div className="container-app">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium mb-4 border border-red-100 dark:border-red-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              Live Feed
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Donations Happening <span className="gradient-text">Right Now</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Watch real-time donations from across India. Every donation is verified, tracked,
              and delivered to those in need — transparently.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Avg response', value: '< 2 hrs', color: 'text-primary-600' },
                { label: 'Verification', value: '100%', color: 'text-accent-600' },
                { label: 'Delivery rate', value: '99.2%', color: 'text-green-600' },
                { label: 'NGO rating', value: '4.8/5 ⭐', color: 'text-amber-600' },
              ].map((s, i) => (
                <div key={i} className="card p-4">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Feed */}
          <div className="space-y-3 max-h-[480px] overflow-hidden relative">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const Icon = typeIcons[item.type] || Heart
                const colorClass = typeColors[item.type] || typeColors.money
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {item.donor} donated {item.amount || item.item}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.city} · {item.time}
                      </div>
                    </div>
                    <span className="badge badge-primary capitalize flex-shrink-0">{item.type}</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
