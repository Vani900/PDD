'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  LogIn,
  LayoutDashboard,
  HandHeart,
  Building2,
  Users,
  Briefcase,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  LogOut,
  Settings,
  Award,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/store'
import { logout } from '@/store/slices/authSlice'
import { cn } from '@/lib/utils'

const navigation = [
  { href: '/donate', label: 'Donate', icon: HandHeart, description: 'Make a verified impact' },
  { href: '/donations', label: 'Feed & Map', icon: SlidersHorizontal, description: 'Live tracking feed' },
  { href: '/ngos', label: 'NGOs', icon: Building2, description: 'Verified partner organizations' },
  { href: '/volunteers', label: 'Volunteers', icon: Users, description: 'Task hub & leaderboards' },
  { href: '/receivers', label: 'Apply', icon: Heart, description: 'Request emergency help' },
  { href: '/corporate', label: 'CSR Portal', icon: Briefcase, description: 'Corporate tax & CSR hub' },
]

const sampleNotifications = [
  { id: '1', title: 'Donation Verified', message: 'Your ₹5,000 food donation to Akshaya Patra was verified!', time: '10m ago', unread: true },
  { id: '2', title: 'Volunteer Claimed Task', message: 'Rahul S. claimed your volunteer pickup in Bangalore.', time: '1h ago', unread: true },
  { id: '3', title: 'CSR Tax Receipt Ready', message: 'Your Q3 80G tax receipt is ready for download.', time: '1d ago', unread: false },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const { theme, setTheme } = useTheme()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Interactive Modals & Menus
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(sampleNotifications)

  const user = useSelector((s: RootState) => s.auth.user)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearch(false)
      router.push(`/donations?query=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || pathname !== '/'
            ? 'bg-background/90 backdrop-blur-xl border-b border-border/80 shadow-sm'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <motion.div
              whileHover={{ scale: 1.08, rotate: -4 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Heart className="w-5 h-5 text-white fill-white" />
            </motion.div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-display font-black tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 bg-clip-text text-transparent">
                  CharityAI
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI v2
                </span>
              </div>
            </div>
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2',
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : pathname === '/' && !scrolled
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabNav"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-500 rounded-full"
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* ── Right Quick Actions ── */}
          <div className="flex items-center gap-2">
            {/* Search Trigger Button */}
            <button
              onClick={() => setShowSearch(true)}
              aria-label="Search donations & NGOs"
              className={cn(
                'p-2.5 rounded-xl border border-transparent transition-all flex items-center gap-2 text-sm',
                pathname === '/' && !scrolled
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
            >
              <Search className="w-4.5 h-4.5" />
              <span className="hidden xl:inline text-xs opacity-70">Search...</span>
            </button>

            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle dark mode"
                className={cn(
                  'p-2.5 rounded-xl transition-all',
                  pathname === '/' && !scrolled
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                )}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4.5 h-4.5 text-amber-400" />
                ) : (
                  <Moon className="w-4.5 h-4.5 text-indigo-600" />
                )}
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="View notifications"
                className={cn(
                  'relative p-2.5 rounded-xl transition-all',
                  pathname === '/' && !scrolled
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                )}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Modal */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl p-4 z-50"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-bold text-sm">Notifications</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                          {unreadCount} new
                        </span>
                      </div>
                      <button
                        onClick={markAllRead}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs transition-colors',
                            item.unread
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : 'bg-muted/40 border-transparent'
                          )}
                        >
                          <div className="flex items-center justify-between font-semibold mb-1">
                            <span className="text-foreground">{item.title}</span>
                            <span className="text-[10px] text-muted-foreground">{item.time}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{item.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown / Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {(user as any).full_name?.[0] || (user as any).name?.[0] || 'U'}
                  </div>
                  <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline">
                    {(user as any).full_name || (user as any).name || 'User'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-border/60 mb-1">
                        <p className="text-xs font-bold text-foreground">{(user as any).full_name || (user as any).name || 'User'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                          <Award className="w-3 h-3" /> Gold Impact Donor
                        </div>
                      </div>
                      {user.role === 'ngo_admin' || user.role === 'ngo_staff' ? (
                        <Link
                          href="/ngo/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors text-foreground"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                          NGO Portal
                        </Link>
                      ) : user.role === 'admin' || user.role === 'super_admin' ? (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors text-foreground"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                          Admin Governance
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors text-foreground"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                          My Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          dispatch(logout())
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className={cn(
                    'hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all',
                    pathname === '/' && !scrolled
                      ? 'text-white hover:bg-white/10'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/donate"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  Donate Now
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Drawer Toggle */}
            <button
              className="lg:hidden p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Global Search Popup Modal ── */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden p-4"
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-border pb-3">
                <Search className="w-5 h-5 text-emerald-500" />
                <input
                  type="text"
                  placeholder="Search donations, NGOs, food drives, blood banks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
              <div className="pt-3 text-xs text-muted-foreground">
                <p className="font-semibold mb-2 text-foreground">Popular Searches:</p>
                <div className="flex flex-wrap gap-2">
                  {['Akshaya Patra Food Drive', 'Urgent O-ve Blood', 'Flood Relief Kerala', 'CSR Tax Exempt'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setShowSearch(false)
                        router.push(`/donations?query=${encodeURIComponent(tag)}`)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile Navigation Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-card/98 backdrop-blur-2xl border-b border-border shadow-2xl overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <item.icon className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-sm font-bold text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

