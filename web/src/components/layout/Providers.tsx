'use client'

import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as ReduxProvider } from 'react-redux'
import { ThemeProvider } from 'next-themes'
import { store } from '@/store'
import { initializeAuth, setUser, logout } from '@/store/slices/authSlice'
import { api } from '@/lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
  },
})

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(initializeAuth())
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      api.users.me()
        .then((res: any) => {
          if (res?.data) {
            const u = res.data
            store.dispatch(setUser({
              id: u.user_id,
              email: u.email,
              role: u.role,
              account_status: u.account_status,
              profile: {
                first_name: u.first_name,
                last_name: u.last_name,
                avatar_url: u.avatar_url,
                city: u.city,
                impact_score: u.impact_score,
                level: u.level,
              }
            }))
          }
        })
        .catch((err: any) => {
          if (err?.response?.status === 401) {
            store.dispatch(logout())
          }
        })
    }
  }, [])
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <AuthInitializer>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </AuthInitializer>
    </ReduxProvider>
  )
}
