import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UIState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
}

const initialState: UIState = {
  theme: 'light',
  sidebarCollapsed: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
  },
})

export const { toggleTheme, setTheme, toggleSidebar, setSidebarCollapsed } = uiSlice.actions

export default uiSlice.reducer
