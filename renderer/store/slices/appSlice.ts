import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AppState {
  selectedGame: string
  isDetectedGame: boolean
  settingData: any
  userData: {
    userName: string
    userNo: string
    userToken: string
    randomTitle: string
  }
  uploadedData: any
  songData: any[]
  isSetting: boolean
  isUploadedDataProcessed: boolean
  isHomePanelOpen: boolean
  uploadedPageData: any | null
  pattern: string
  backupData: any | null
  isUploading: boolean
}

const initialState: AppState = {
  selectedGame: 'DJMAX_RESPECT_V',
  isDetectedGame: false,
  settingData: null,
  userData: {
    userName: '',
    userNo: '',
    userToken: '',
    randomTitle: Math.floor(Math.random() * 652 + 1).toString(),
  },
  uploadedData: null,
  songData: [],
  isSetting: false,
  isUploadedDataProcessed: false,
  isHomePanelOpen: true,
  uploadedPageData: null,
  pattern: '',
  backupData: null,
  isUploading: false,
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
    setUserData: (state, action: PayloadAction<{ userName?: string; userNo?: string; userToken?: string }>) => {
      state.userData = { ...state.userData, ...action.payload }
    },
    setUploadedData: (state, action: PayloadAction<any>) => {
      state.uploadedData = action.payload
      state.isUploadedDataProcessed = false
    },
    setSongData: (state, action: PayloadAction<any[]>) => {
      state.songData = action.payload
    },
    setIsSetting: (state, action: PayloadAction<boolean>) => {
      state.isSetting = action.payload
    },
    setUploadedDataProcessed: (state, action: PayloadAction<boolean>) => {
      state.isUploadedDataProcessed = action.payload
    },
    setHomePanelOpen: (state, action: PayloadAction<boolean>) => {
      state.isHomePanelOpen = action.payload
    },
    setUploadedPageData: (state, action: PayloadAction<any>) => {
      state.uploadedPageData = action.payload
    },
    setPattern: (state, action: PayloadAction<string>) => {
      state.pattern = action.payload
    },
    setBackupData: (state, action: PayloadAction<any>) => {
      state.backupData = action.payload
    },
    setIsUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload
    },
  },
})

export const {
  setSelectedGame,
  setIsDetectedGame,
  setSettingData,
  setUserData,
  setUploadedData,
  setSongData,
  setIsSetting,
  setUploadedDataProcessed,
  setHomePanelOpen,
  setUploadedPageData,
  setPattern,
  setBackupData,
  setIsUploading,
} = appSlice.actions
export default appSlice.reducer
