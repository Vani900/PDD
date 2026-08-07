import React from 'react'
import Link from 'next/link'
import { Heart, Github, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  Platform: [
    { label: 'Donate', href: '/donate' },
    { label: 'Find NGOs', href: '/ngos' },
    { label: 'Volunteer', href: '/volunteers' },
    { label: 'Request Help', href: '/receivers' },
    { label: 'Corporate CSR', href: '/corporate' },
  ],
  'Donation Types': [
    { label: 'Food Donation', href: '/donate?type=food' },
    { label: 'Money Donation', href: '/donate?type=money' },
    { label: 'Blood Donation', href: '/donate?type=blood' },
    { label: 'Clothes Donation', href: '/donate?type=clothes' },
    { label: 'Emergency Help', href: '/donate?type=emergency' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press Kit', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Refund Policy', href: '/refund' },
    { label: 'Security', href: '/security' },
  ],
}

const socials = [
  { Icon: Twitter, href: 'https://twitter.com/charityai_org', label: 'Twitter' },
  { Icon: Linkedin, href: 'https://linkedin.com/company/charityai', label: 'LinkedIn' },
  { Icon: Github, href: 'https://github.com/charityai', label: 'GitHub' },
  { Icon: Instagram, href: 'https://instagram.com/charityai.org', label: 'Instagram' },
]

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white/70 border-t border-white/5">
      <div className="container-app py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-display font-bold gradient-text">CharityAI</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 text-white/50 max-w-xs">
              India&apos;s most intelligent donation ecosystem connecting Donors, NGOs, Volunteers,
              and those in need through the power of AI.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:hello@charityai.org" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-primary-400" /> hello@charityai.org
              </a>
              <a href="tel:+911800001234" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-primary-400" /> 1800-001-2345 (Free)
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" /> Bangalore, India 🇮🇳
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white font-semibold mb-4 text-sm">{section}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} CharityAI. Made with <Heart className="w-3 h-3 inline text-red-400 fill-red-400" /> in India.
            All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socials.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15 hover:text-white transition-all"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
