import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type GameType = 'djmax_respect_v' | 'wjmax' | 'platina_lab'

export interface UIState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  selectedGame: GameType
}

const initialState: UIState = {
  theme: 'light',
  sidebarCollapsed: false,
  selectedGame: 'djmax_respect_v', // 기본값으로 DJMAX RESPECT V 설정
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
    setSelectedGame: (state, action: PayloadAction<GameType>) => {
      state.selectedGame = action.payload
    },
  },
})

export const { toggleTheme, setTheme, toggleSidebar, setSidebarCollapsed, setSelectedGame } =
  uiSlice.actions

export default uiSlice.reducer
