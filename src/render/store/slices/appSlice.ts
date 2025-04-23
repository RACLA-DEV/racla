import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { createLog } from '@render/libs/logging'
import type { GameType } from '@src/types/common/GameType'
import type { AppState } from '@src/types/redux/AppState'
import type { Notification } from '@src/types/render/Notification'

const initialState: AppState = {
  selectedGame: 'djmax_respect_v',
  isSetting: false,
  isLoading: true,
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
  notifications: [],
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
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
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
    addNotification: (state, action: PayloadAction<Omit<Notification, 'createdAt'>>) => {
      const notification = {
        ...action.payload,
        createdAt: Date.now(),
      }

      // 최대 5개까지만 보여주기 위해 오래된 알림 제거
      if (state.notifications.length >= 5) {
        // 오래된 알림부터 제거 (createdAt 기준)
        const sortedNotifications = [...state.notifications].sort(
          (a, b) => a.createdAt - b.createdAt,
        )
        state.notifications = [...sortedNotifications.slice(1), notification]
      } else {
        state.notifications.push(notification)
      }
    },
    updateNotification: (
      state,
      action: PayloadAction<{ id: string; data: Partial<Notification> }>,
    ) => {
      const { id, data } = action.payload
      const index = state.notifications.findIndex((notification) => notification.id === id)

      if (index !== -1) {
        state.notifications[index] = { ...state.notifications[index], ...data }
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const index = state.notifications.findIndex((notification) => notification.id === id)

      if (index !== -1) {
        // isRemoving 플래그만 설정하고 실제 제거는 별도로 처리
        state.notifications[index].isRemoving = true
      }
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      // 실제로 알림 배열에서 제거
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload,
      )
    },
    clearAllNotifications: (state) => {
      // 모든 알림에 isRemoving 플래그 설정
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        isRemoving: true,
      }))
    },
    deleteAllNotifications: (state) => {
      // 모든 알림 삭제
      state.notifications = []
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
  setIsLoading,
  setSongData,
  logout,
  setIsDetectedGame,
  addNotification,
  updateNotification,
  removeNotification,
  deleteNotification,
  clearAllNotifications,
  deleteAllNotifications,
} = appSlice.actions

export default appSlice.reducer
