import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { UIState } from '@src/types/redux/UIState'
const initialState: UIState = {
  theme: 'light',
  sidebarCollapsed: false,
  openExternalLink: '',
  isOpenExternalLink: false,
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
    setOpenExternalLink: (state, action: PayloadAction<string>) => {
      state.openExternalLink = action.payload
    },
    setIsOpenExternalLink: (state, action: PayloadAction<boolean>) => {
      state.isOpenExternalLink = action.payload
    },
  },
})

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setOpenExternalLink,
  setIsOpenExternalLink,
} = uiSlice.actions

export default uiSlice.reducer
