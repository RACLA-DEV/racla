import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { createLog } from '@render/libs/logging'
export type GameType = 'djmax_respect_v' | 'wjmax' | 'platina_lab'

interface AppState {
  selectedGame: GameType
  isSetting: boolean
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
  isDetectedGame: boolean
  isUploading: boolean
  isMiniMode: boolean
  platform: string
  isLoggedIn: boolean
  songData: {
    djmax_respect_v: any[]
    wjmax: any[]
    platina_lab: any[]
    lastUpdated: {
      djmax_respect_v: number | null
      wjmax: number | null
      platina_lab: number | null
    }
  }
}

const initialState: AppState = {
  selectedGame: 'djmax_respect_v',
  isSetting: false,
  settingData: {},
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
  isDetectedGame: false,
  isUploading: false,
  isMiniMode: true,
  platform: '',
  isLoggedIn: false,
  songData: {
    djmax_respect_v: [],
    wjmax: [],
    platina_lab: [],
    lastUpdated: {
      djmax_respect_v: null,
      wjmax: null,
      platina_lab: null,
    },
  },
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSelectedGame: (state, action: PayloadAction<GameType>) => {
      state.selectedGame = action.payload
    },
    setIsSetting: (state, action: PayloadAction<boolean>) => {
      state.isSetting = action.payload
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
    setSongData: (state, action: PayloadAction<{ data: any[]; gameCode: string }>) => {
      const { data, gameCode } = action.payload

      // 유효성 검증 추가
      if (!data || !Array.isArray(data)) {
        createLog(
          'error',
          `setSongData: 유효하지 않은 데이터 형식, 타입: ${typeof data}, 배열 여부: ${Array.isArray(data)}`,
        )
        return
      }

      if (!gameCode || typeof gameCode !== 'string') {
        createLog('error', `setSongData: 유효하지 않은 게임코드: ${gameCode}`)
        return
      }

      createLog('debug', `setSongData: ${gameCode} 데이터 설정 중, 항목 수: ${data.length}`)

      // 게임코드 유효성 검증
      if (gameCode === 'djmax_respect_v' || gameCode === 'wjmax' || gameCode === 'platina_lab') {
        // 타입 단언을 통해 올바른 키 사용 보장
        const validKey = gameCode as keyof typeof state.songData.lastUpdated
        state.songData[validKey] = data
        state.songData.lastUpdated[validKey] = Date.now()
        createLog('debug', `setSongData: ${gameCode} 데이터 설정 완료`)
      } else {
        createLog('error', `유효하지 않은 게임 코드: ${gameCode}`)
      }
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
    setIsDetectedGame: (state, action: PayloadAction<boolean>) => {
      state.isDetectedGame = action.payload
    },
  },
})

export const {
  setSelectedGame,
  setIsSetting,
  setSettingData,
  setUserData,
  setIsUploading,
  setIsMiniMode,
  setVArchiveUserData,
  setPlatform,
  setIsLoggedIn,
  setSongData,
  logout,
  setIsDetectedGame,
} = appSlice.actions

export default appSlice.reducer
