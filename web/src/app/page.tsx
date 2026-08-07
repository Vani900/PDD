import type { Metadata } from 'next'
import { HeroSection } from '@/components/landing/HeroSection'
import { ImpactCounter } from '@/components/landing/ImpactCounter'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { DonationTypes } from '@/components/landing/DonationTypes'
import { NGOSpotlight } from '@/components/landing/NGOSpotlight'
import { LiveDonationFeed } from '@/components/landing/LiveDonationFeed'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { CSRSection } from '@/components/landing/CSRSection'
import { VolunteerWall } from '@/components/landing/VolunteerWall'
import { CTASection } from '@/components/landing/CTASection'

export const metadata: Metadata = {
  title: 'CharityAI – AI-Powered Smart Donation Platform | Connecting Hearts',
  description:
    'India\'s most intelligent donation ecosystem. Donate food, money, clothes, medicine, books & blood. ' +
    'AI-powered NGO matching, real-time tracking, and instant impact. Join 500K+ donors.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ImpactCounter />
      <HowItWorks />
      <DonationTypes />
      <LiveDonationFeed />
      <NGOSpotlight />
      <TestimonialsSection />
      <VolunteerWall />
      <CSRSection />
      <CTASection />
    </>
  )
}
