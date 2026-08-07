import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
interface UIState { sidebarOpen: boolean; aiChatOpen: boolean; theme: 'light' | 'dark' | 'system' }
const uiSlice = createSlice({
  name: 'ui', initialState: { sidebarOpen: true, aiChatOpen: false, theme: 'system' } as UIState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen },
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload },
    toggleAIChat(state) { state.aiChatOpen = !state.aiChatOpen },
    setAIChatOpen(state, action: PayloadAction<boolean>) { state.aiChatOpen = action.payload },
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'system'>) { state.theme = action.payload },
  },
})
export const { toggleSidebar, setSidebarOpen, toggleAIChat, setAIChatOpen, setTheme } = uiSlice.actions
export default uiSlice.reducer
