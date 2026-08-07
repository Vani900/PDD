'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  { name: 'Priya Sharma', role: 'Regular Donor', location: 'Mumbai', avatar: '👩‍💼', quote: 'CharityAI matched my food donations with a local NGO within minutes. The real-time tracking gives me complete peace of mind.', rating: 5, impact: '48 donations' },
  { name: 'Rajesh Kumar', role: 'NGO Director – Aashray Foundation', location: 'Delhi', avatar: '👨‍💼', quote: 'The AI-powered donor matching tripled our donation intake in 3 months. The admin dashboard is phenomenal.', rating: 5, impact: '₹12L received' },
  { name: 'Anita Desai', role: 'Volunteer Lead', location: 'Pune', avatar: '👩‍🦱', quote: 'Managing 50+ volunteers used to be chaos. CharityAI\'s task system and QR check-ins made everything seamless.', rating: 5, impact: '200+ tasks completed' },
  { name: 'TCS CSR Team', role: 'Corporate Partner', location: 'Bangalore', avatar: '🏢', quote: 'Our annual CSR impact report used to take weeks. CharityAI generates it automatically with full analytics. Outstanding platform.', rating: 5, impact: '₹50L donated' },
  { name: 'Mohammed Iqbal', role: 'Blood Donor', location: 'Hyderabad', avatar: '🧑‍⚕️', quote: 'The AI notifies me when my blood type is critically needed nearby. I\'ve donated 8 times through CharityAI. So easy.', rating: 5, impact: '8 blood donations' },
  { name: 'Sunita Patel', role: 'Receiver – Single Mother', location: 'Ahmedabad', avatar: '👩', quote: 'During my hardest time, CharityAI connected me with food and clothes within hours. It felt like miracles were real.', rating: 5, impact: 'Life changed' },
]

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-gradient-hero overflow-hidden">
      <div className="container-app">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Stories That <span className="gradient-text-hero">Inspire</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">Real voices. Real impact. Real change.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">{t.avatar}</div>
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/60">{t.role}</div>
                  <div className="text-xs text-white/40">{t.location}</div>
                </div>
                <Quote className="w-6 h-6 text-primary-400/50 ml-auto flex-shrink-0" />
              </div>
              <p className="text-sm text-white/80 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">{Array.from({length: t.rating}).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                <span className="text-xs font-medium text-primary-300">{t.impact}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
