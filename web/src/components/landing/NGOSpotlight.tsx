'use client'
import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Heart, Sparkles } from 'lucide-react'

export function NGOSpotlight() {
  const ngos = [
    { name: 'Akshaya Patra', focus: 'Mid-day Meals', city: 'Bangalore', rating: 4.9, raised: '₹2.4Cr', logo: '🍚', verified: true },
    { name: 'CRY India', focus: 'Child Rights', city: 'Mumbai', rating: 4.8, raised: '₹1.8Cr', logo: '👶', verified: true },
    { name: 'HelpAge India', focus: 'Elderly Care', city: 'Delhi', rating: 4.7, raised: '₹1.2Cr', logo: '👴', verified: true },
    { name: 'Goonj', focus: 'Clothing & More', city: 'Delhi', rating: 4.9, raised: '₹3.1Cr', logo: '👕', verified: true },
    { name: 'iCall', focus: 'Mental Health', city: 'Mumbai', rating: 4.6, raised: '₹0.8Cr', logo: '💙', verified: true },
    { name: 'Magic Bus', focus: 'Youth Development', city: 'Mumbai', rating: 4.8, raised: '₹1.5Cr', logo: '🚌', verified: true },
  ]

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-app">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">Featured <span className="gradient-text">NGOs</span></h2>
            <p className="text-muted-foreground">AI-verified organizations with highest impact ratings.</p>
          </div>
          <Link href="/ngos" className="btn-secondary text-sm gap-2">View All NGOs <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ngos.map((ngo, i) => (
            <motion.a
              key={i}
              href={`/ngos/${ngo.name.toLowerCase().replace(/\s/g, '-')}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="card-hover p-5 flex flex-col gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-3xl flex-shrink-0">{ngo.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground truncate">{ngo.name}</span>
                    {ngo.verified && <Sparkles className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />}
                  </div>
                  <div className="text-sm text-muted-foreground">{ngo.focus}</div>
                  <div className="text-xs text-muted-foreground/70">{ngo.city}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1"><span className="text-amber-500">★</span><span className="font-medium">{ngo.rating}</span></div>
                <div className="text-primary-600 dark:text-primary-400 font-semibold">{ngo.raised} raised</div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 btn-primary text-xs py-2">Donate</button>
                <button className="btn-secondary text-xs py-2 px-3"><Heart className="w-3.5 h-3.5" /></button>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

export function VolunteerWall() {
  const volunteers = [
    { name: 'Arjun S.', city: 'Mumbai', tasks: 142, hours: 380, avatar: '👨', badge: '🏆 Legend' },
    { name: 'Kavya R.', city: 'Bangalore', tasks: 98, hours: 245, avatar: '👩', badge: '⭐ Champion' },
    { name: 'Ravi M.', city: 'Delhi', tasks: 76, hours: 190, avatar: '👨‍🦳', badge: '🎯 Contributor' },
    { name: 'Anjali K.', city: 'Chennai', tasks: 65, hours: 168, avatar: '👩‍🦱', badge: '💪 Helper' },
  ]
  return (
    <section className="section-padding bg-background">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">Volunteer <span className="gradient-text">Champions</span></h2>
          <p className="text-muted-foreground">Recognizing those who give their time and energy.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {volunteers.map((v, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }} className="card p-5 text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-4xl">{v.avatar}</div>
              <div>
                <div className="font-bold text-foreground">{v.name}</div>
                <div className="text-sm text-muted-foreground">{v.city}</div>
                <div className="text-xs font-medium text-primary-600 dark:text-primary-400 mt-1">{v.badge}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="bg-muted rounded-lg p-2 text-center"><div className="text-lg font-bold text-foreground">{v.tasks}</div><div className="text-xs text-muted-foreground">Tasks</div></div>
                <div className="bg-muted rounded-lg p-2 text-center"><div className="text-lg font-bold text-foreground">{v.hours}h</div><div className="text-xs text-muted-foreground">Hours</div></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CSRSection() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container-app">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="badge badge-accent mb-4">Corporate CSR</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Streamline Your <span className="gradient-text">CSR Program</span></h2>
            <p className="text-muted-foreground mb-6">Manage corporate giving at scale. AI-powered matching, automated tax reports, employee volunteering, real-time impact dashboards — all in one platform.</p>
            <div className="space-y-3 mb-8">
              {['Automated CSR compliance reports', 'Employee volunteering portal', 'Real-time impact dashboard', 'Tax-exempt donation receipts', 'SDG goal alignment tracking'].map((f, i) => (
                <div key={i} className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 rounded-full bg-primary-500" /></div><span className="text-sm text-foreground">{f}</span></div>
              ))}
            </div>
            <Link href="/corporate" className="btn-primary">Get Started for Free</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Companies', value: '280+', icon: '🏢' }, { label: 'CSR Budget Managed', value: '₹48Cr', icon: '💰' }, { label: 'Employee Volunteers', value: '12,400', icon: '👥' }, { label: 'SDG Goals Supported', value: '17/17', icon: '🌱' }].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-5 text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function CTASection() {
  return (
    <section className="section-padding bg-gradient-hero">
      <div className="container-app text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">❤️</div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Ready to Make a <span className="gradient-text-hero">Difference?</span></h2>
          <p className="text-white/70 text-lg mb-8">Join 48,000+ donors who are changing lives every day. Your next donation is just one click away.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-all hover:-translate-y-0.5 hover:shadow-glow-primary">
              <Heart className="w-5 h-5 fill-white" /> Start Donating Free
            </Link>
            <Link href="/ngos/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all">
              <Sparkles className="w-5 h-5" /> Register Your NGO
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
