import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UserProfile {
  first_name: string
  last_name: string
  avatar_url?: string
  city?: string
  impact_score?: number
  level?: number
  badges?: string[]
}

interface User {
  id: string
  email: string
  role: string
  account_status: string
  profile?: UserProfile
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth(state) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        const refresh = localStorage.getItem('refresh_token')
        const role = localStorage.getItem('user_role') || 'donor'
        if (token) {
          state.accessToken = token
          state.refreshToken = refresh
          state.isAuthenticated = true
          if (!state.user) {
            state.user = { id: 'current', email: '', role, account_status: 'active' }
          }
        }
      }
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', action.payload.accessToken)
        localStorage.setItem('refresh_token', action.payload.refreshToken)
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    },
    updateProfile(state, action: PayloadAction<Partial<UserProfile>>) {
      if (state.user) {
        state.user.profile = { ...state.user.profile, ...action.payload } as UserProfile
      }
    },
  },
})

export const { initializeAuth, setUser, setTokens, setLoading, setError, logout, updateProfile } = authSlice.actions
export default authSlice.reducer
