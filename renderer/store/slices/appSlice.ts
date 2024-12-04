import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { set } from 'ramda'

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
  vArchiveUserData: {
    userName: string
    userNo: string
    userToken: string
  }
  songData: any[]
  wjmaxSongData: any[]
  isSetting: boolean
  isUploadedDataProcessed: boolean
  isHomePanelOpen: boolean
  backupData: any | null
  isUploading: boolean
  isMiniMode: boolean
  vArchiveUploadedPageData: any | null
  projectRaUploadedPageData: any | null
  vArchivePattern: string
  projectRaPattern: string
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
  },
  vArchiveUserData: {
    userName: '',
    userNo: '',
    userToken: '',
  },
  songData: [],
  wjmaxSongData: [],
  isSetting: false,
  isUploadedDataProcessed: false,
  isHomePanelOpen: true,
  backupData: null,
  isUploading: false,
  isMiniMode: true,
  vArchiveUploadedPageData: null,
  projectRaUploadedPageData: null,
  vArchivePattern: '',
  projectRaPattern: '',
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
    setBackupData: (state, action: PayloadAction<any>) => {
      state.backupData = action.payload
    },
    setIsUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload
    },
    setIsMiniMode: (state, action: PayloadAction<boolean>) => {
      state.isMiniMode = action.payload
    },
    setVArchiveUserData: (state, action: PayloadAction<{ userName?: string; userNo?: string; userToken?: string }>) => {
      state.vArchiveUserData = { ...state.vArchiveUserData, ...action.payload }
    },
    setWjmaxSongData: (state, action: PayloadAction<any[]>) => {
      state.wjmaxSongData = action.payload
    },
    setVArchiveUploadedPageData: (state, action: PayloadAction<any>) => {
      state.vArchiveUploadedPageData = action.payload
    },
    setProjectRaUploadedPageData: (state, action: PayloadAction<any>) => {
      state.projectRaUploadedPageData = action.payload
    },
    setVArchivePattern: (state, action: PayloadAction<string>) => {
      state.vArchivePattern = action.payload
    },
    setProjectRaPattern: (state, action: PayloadAction<string>) => {
      state.projectRaPattern = action.payload
    },
  },
})

export const {
  setSelectedGame,
  setIsDetectedGame,
  setSettingData,
  setUserData,
  setSongData,
  setIsSetting,
  setUploadedDataProcessed,
  setHomePanelOpen,
  setBackupData,
  setIsUploading,
  setIsMiniMode,
  setVArchiveUserData,
  setWjmaxSongData,
  setVArchiveUploadedPageData,
  setProjectRaUploadedPageData,
  setVArchivePattern,
  setProjectRaPattern,
} = appSlice.actions
export default appSlice.reducer
