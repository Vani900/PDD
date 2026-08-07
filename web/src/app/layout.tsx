import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AIFloatButton } from '@/components/ai/AIFloatButton'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CharityAI – AI-Powered Smart Donation Platform',
    template: '%s | CharityAI',
  },
  description:
    'Connecting Donors, NGOs, Volunteers and Needy People Through AI. ' +
    'Donate food, money, clothes, medicine, blood & more. India\'s most intelligent donation ecosystem.',
  keywords: [
    'charity', 'donation', 'NGO', 'AI', 'India', 'volunteer',
    'food donation', 'blood donation', 'CSR', 'social impact',
    'CharityAI', 'online donation', 'fundraising',
  ],
  authors: [{ name: 'CharityAI', url: 'https://charityai.org' }],
  creator: 'CharityAI',
  publisher: 'CharityAI',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://charityai.org',
    siteName: 'CharityAI',
    title: 'CharityAI – AI-Powered Smart Donation Platform',
    description: 'India\'s most intelligent donation ecosystem connecting donors, NGOs, and receivers.',
    images: [{ url: 'https://charityai.org/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CharityAI – AI-Powered Smart Donation Platform',
    description: 'India\'s most intelligent donation ecosystem.',
    images: ['https://charityai.org/og-image.png'],
    creator: '@charityai_org',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#25a47e' },
    { media: '(prefers-color-scheme: dark)', color: '#0f2027' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <AIFloatButton />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
