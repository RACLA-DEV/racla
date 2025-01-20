import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface UiState {
  fontFamily: string
  backgroundBgaName: string
  isDjCommentOpen: boolean
  isHomePanelOpen: boolean
  homePanelCategory: string
  updateIndex: number
  slideDirection: number
}

const initialState: UiState = {
  fontFamily: '',
  backgroundBgaName: '',
  isDjCommentOpen: false,
  isHomePanelOpen: false,
  homePanelCategory: 'update',
  updateIndex: 0,
  slideDirection: 0,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFontFamily: (state, action: PayloadAction<string>) => {
      if (state.fontFamily === action.payload) return
      state.fontFamily = action.payload
    },
    setBackgroundBgaName: (state, action: PayloadAction<string>) => {
      if (state.backgroundBgaName === action.payload) return
      state.backgroundBgaName = action.payload
    },
    setIsDjCommentOpen: (state, action: PayloadAction<boolean>) => {
      state.isDjCommentOpen = action.payload
    },
    setHomePanelOpen: (state, action: PayloadAction<boolean>) => {
      state.isHomePanelOpen = action.payload
    },
    setHomePanelCategory: (state, action: PayloadAction<string>) => {
      state.homePanelCategory = action.payload
    },
    setUpdateIndex: (state, action: PayloadAction<number>) => {
      state.updateIndex = action.payload
    },
    setSlideDirection: (state, action: PayloadAction<number>) => {
      state.slideDirection = action.payload
    },
  },
})

export const {
  setFontFamily,
  setBackgroundBgaName,
  setIsDjCommentOpen,
  setHomePanelOpen,
  setHomePanelCategory,
  setUpdateIndex,
  setSlideDirection,
} = uiSlice.actions
export default uiSlice.reducer
