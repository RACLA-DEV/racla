import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  fontFamily: string
  backgroundBgaName: string
  isDjCommentOpen: boolean
}

const initialState: UiState = {
  fontFamily: '',
  backgroundBgaName: '',
  isDjCommentOpen: false,
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
  },
})

export const { setFontFamily, setBackgroundBgaName, setIsDjCommentOpen } = uiSlice.actions
export default uiSlice.reducer
