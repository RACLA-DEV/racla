import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface AppState {
  selectedGame: string
  isDetectedGame: boolean
  settingData: any
  userData: {
    userName: string
    userNo: string
    userToken: string
    randomTitle: string
    discordUid: string
    discordLinked: boolean
    vArchiveLinked: boolean
  }
  vArchiveUserData: {
    userName: string
    userNo: string
    userToken: string
  }
  isUploading: boolean
  isMiniMode: boolean
  platform: string
  isLoggedIn: boolean
}

const initialState: AppState = {
  selectedGame: 'djmax_respect_v',
  isDetectedGame: false,
  settingData: null,
  userData: {
    userName: '',
    userNo: '',
    userToken: '',
    randomTitle: Math.floor(Math.random() * 652 + 1).toString(),
    discordUid: '',
    discordLinked: false,
    vArchiveLinked: false,
  },
  vArchiveUserData: {
    userName: '',
    userNo: '',
    userToken: '',
  },
  isUploading: false,
  isMiniMode: true,
  platform: '',
  isLoggedIn: false,
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSelectedGame: (state, action: PayloadAction<string>) => {
      state.selectedGame = action.payload
    },
    setIsDetectedGame: (state, action: PayloadAction<boolean>) => {
      state.isDetectedGame = action.payload
    },
    setSettingData: (state, action: PayloadAction<any>) => {
      state.settingData = action.payload
    },
    setUserData: (
      state,
      action: PayloadAction<{
        userName?: string
        userNo?: string
        userToken?: string
        discordUid?: string
        discordLinked?: boolean
        vArchiveLinked?: boolean
      }>,
    ) => {
      state.userData = { ...state.userData, ...action.payload }
      if (state.userData.userNo && state.userData.userToken) {
        state.isLoggedIn = true
      }
    },
    setIsUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload
    },
    setIsMiniMode: (state, action: PayloadAction<boolean>) => {
      state.isMiniMode = action.payload
    },
    setVArchiveUserData: (
      state,
      action: PayloadAction<{ userName?: string; userNo?: string; userToken?: string }>,
    ) => {
      state.vArchiveUserData = { ...state.vArchiveUserData, ...action.payload }
    },
    setPlatform: (state, action: PayloadAction<string>) => {
      state.platform = action.payload
    },
    setIsLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.isLoggedIn = action.payload
    },
    logout: (state) => {
      state.userData = {
        userName: '',
        userNo: '',
        userToken: '',
        randomTitle: Math.floor(Math.random() * 652 + 1).toString(),
        discordUid: '',
        discordLinked: false,
        vArchiveLinked: false,
      }
      state.vArchiveUserData = {
        userName: '',
        userNo: '',
        userToken: '',
      }
      state.isLoggedIn = false
    },
  },
})

export const {
  setSelectedGame,
  setIsDetectedGame,
  setSettingData,
  setUserData,
  setIsUploading,
  setIsMiniMode,
  setVArchiveUserData,
  setPlatform,
  setIsLoggedIn,
  logout,
} = appSlice.actions

export default appSlice.reducer
