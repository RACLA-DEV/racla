import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  fontFamily: string
  backgroundBgaName: string
}

const initialState: UiState = {
  fontFamily: '',
  backgroundBgaName: '',
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
  },
})

export const { setFontFamily, setBackgroundBgaName } = uiSlice.actions
export default uiSlice.reducer
