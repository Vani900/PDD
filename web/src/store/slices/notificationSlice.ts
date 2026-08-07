import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface Notification { id: string; title: string; body: string; notification_type: string; is_read: boolean; created_at: string }
interface NotificationState { items: Notification[]; unread_count: number }
const notificationSlice = createSlice({
  name: 'notifications', initialState: { items: [], unread_count: 0 } as NotificationState,
  reducers: {
    setNotifications(state, action: PayloadAction<{ items: Notification[]; unread_count: number }>) { state.items = action.payload.items; state.unread_count = action.payload.unread_count },
    addNotification(state, action: PayloadAction<Notification>) { state.items.unshift(action.payload); state.unread_count++ },
    markRead(state, action: PayloadAction<string>) { const n = state.items.find(i => i.id === action.payload); if (n && !n.is_read) { n.is_read = true; state.unread_count = Math.max(0, state.unread_count - 1) } },
    markAllRead(state) { state.items.forEach(n => { n.is_read = true }); state.unread_count = 0 },
  },
})
export const { setNotifications, addNotification, markRead, markAllRead } = notificationSlice.actions
export default notificationSlice.reducer
