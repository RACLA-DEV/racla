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
  projectRaData: any | null
  vArchiveData: any | null
  collectionData: any | null
  platform: string
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
  songData: [],
  wjmaxSongData: [],
  isSetting: false,
  isUploadedDataProcessed: true,
  isHomePanelOpen: true,
  backupData: null,
  isUploading: false,
  isMiniMode: true,
  vArchiveUploadedPageData: null,
  projectRaUploadedPageData: null,
  vArchivePattern: '',
  projectRaPattern: '',
  projectRaData: null,
  vArchiveData: null,
  collectionData: [],
  platform: '',
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
      action: PayloadAction<{ userName?: string; userNo?: string; userToken?: string }>,
    ) => {
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
    setVArchiveUserData: (
      state,
      action: PayloadAction<{ userName?: string; userNo?: string; userToken?: string }>,
    ) => {
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
    setProjectRaData: (state, action: PayloadAction<any>) => {
      state.isUploading = true
      state.isUploadedDataProcessed = false
      state.projectRaData = action.payload
    },
    setVArchiveData: (state, action: PayloadAction<any>) => {
      state.isUploading = true
      state.isUploadedDataProcessed = false
      state.vArchiveData = action.payload
    },
    clearProjectRaData: (state) => {
      state.projectRaData = null
    },
    clearVArchiveData: (state) => {
      state.vArchiveData = null
    },
    setCollectionData: (state, action: PayloadAction<any>) => {
      state.collectionData = action.payload
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
  setProjectRaData,
  setVArchiveData,
  clearProjectRaData,
  clearVArchiveData,
  setCollectionData,
} = appSlice.actions
export default appSlice.reducer
