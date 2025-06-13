import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { globalDictionary } from '@render/constants/globalDictionary'
import { createLog } from '@render/libs/logger'
import { OcrPlayDataResponse } from '@src/types/dto/ocr/OcrPlayDataResponse'
import type { GameType } from '@src/types/games/GameType'
import { SongData } from '@src/types/games/SongData'
import type { AppState, GameOcrStates, OcrProcessState } from '@src/types/redux/AppState'
import type { Notification } from '@src/types/render/Notification'
import { SessionData } from '@src/types/sessions/SessionData'
import { SettingsData } from '@src/types/settings/SettingData'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

// 기본 OCR 상태
const defaultOcrState: OcrProcessState = {
  results: [],
  totalImages: 0,
  processedImages: 0,
  isProcessing: false,
  lastProcessedAt: null,
  gameCode: null,
}

// 게임별 OCR 상태 초기화
const initialGameOcrStates: GameOcrStates = {
  djmax_respect_v: { ...defaultOcrState, gameCode: 'djmax_respect_v' },
  platina_lab: { ...defaultOcrState, gameCode: 'platina_lab' },
}

const initialState: AppState = {
  selectedGame: 'djmax_respect_v',
  isSetting: false,
  isTrackMaker: false,
  isLoading: true,
  settingData: {} as SettingsData,
  userData: {
    playerId: 0,
    playerToken: '',
    playerName: '',
    playerNickname: '',
    isSetupPassword: false,
    profileImageUrl: '',
    varchiveUserInfo: {
      isLinked: false,
      userNo: 0,
      token: '',
      nickname: '',
    },
    discordUserInfo: {
      isLinked: false,
      uid: '',
    },
  },
  isDetectedGame: false,
  isUploading: false,
  isMiniMode: true,
  platform: '',
  isLoggedIn: false,
  notifications: [],
  songData: {
    djmax_respect_v: [],
    platina_lab: [],
    lastUpdated: {
      djmax_respect_v: null,
      platina_lab: null,
    },
  },
  refresh: false,
  // 게임별 OCR 상태 초기화
  gameOcrStates: initialGameOcrStates,
  // 현재 선택된 게임의 OCR 처리 상태 (호환성 유지)
  ocrProcessState: { ...defaultOcrState },
}

// 노래 데이터 유효성 검증 함수
const isValidSongData = (data: SongData[], gameCode: GameType): boolean => {
  if (!gameCode || typeof gameCode !== 'string') {
    createLog('error', `setSongData: Not valid game code: ${String(gameCode)}`)
    return false
  }

  createLog('debug', `setSongData: Setting ${gameCode} data, item count: ${data.length}`)
  return true
}

// 게임 코드 유효성 검증 및 데이터 업데이트 함수
const updateSongDataIfValidGameCode = (
  state: AppState,
  data: SongData[],
  gameCode: GameType,
): void => {
  // GameType 타입의 유효한 값인지 확인
  if (isValidGameCode(gameCode)) {
    // 타입 단언을 통해 올바른 키 사용 보장
    const validKey = gameCode
    // 안전한 타입 체크를 통한 할당
    if (
      validKey &&
      typeof validKey === 'string' &&
      Object.prototype.hasOwnProperty.call(state.songData, validKey)
    ) {
      state.songData[validKey] = data
      if (Object.prototype.hasOwnProperty.call(state.songData.lastUpdated, validKey)) {
        state.songData.lastUpdated[validKey] = Date.now()
      }
      createLog('debug', `setSongData: ${gameCode} data set complete`)
    }
  } else {
    createLog('error', `Not valid game code`)
  }
}

// GameType 타입의 유효한 값인지 확인하는 함수
const isValidGameCode = (gameCode: GameType): gameCode is GameType => {
  return (globalDictionary.supportGameList as GameType[]).includes(gameCode)
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSelectedGame: (state, action: PayloadAction<GameType>) => {
      state.selectedGame = action.payload
      // 선택한 게임의 OCR 상태를 현재 OCR 상태로 설정 (호환성 유지)
      if (isValidGameCode(action.payload)) {
        state.ocrProcessState = state.gameOcrStates[action.payload]
      }
    },
    setIsSetting: (state, action: PayloadAction<boolean>) => {
      state.isSetting = action.payload
    },
    setIsTrackMaker: (state, action: PayloadAction<boolean>) => {
      state.isTrackMaker = action.payload
    },
    setSettingData: (state, action: PayloadAction<SettingsData>) => {
      state.settingData = action.payload
    },
    setUserData: (state, action: PayloadAction<SessionData>) => {
      state.userData = { ...state.userData, ...action.payload }
      if (state.userData.playerId && state.userData.playerToken) {
        state.isLoggedIn = true
      }
    },
    setIsUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload
    },
    setIsMiniMode: (state, action: PayloadAction<boolean>) => {
      state.isMiniMode = action.payload
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
    setSongData: (state, action: PayloadAction<{ data: SongData[]; gameCode: GameType }>) => {
      const { data, gameCode } = action.payload

      // 유효성 검증
      if (!isValidSongData(data, gameCode)) return

      // 게임코드 유효성 검증
      updateSongDataIfValidGameCode(state, data, gameCode)
    },
    logout: (state) => {
      state.userData = {
        playerId: 0,
        playerToken: '',
        playerName: '',
        playerNickname: '',
        isSetupPassword: false,
        profileImageUrl: '',
        varchiveUserInfo: {
          isLinked: false,
          userNo: 0,
          token: '',
          nickname: '',
        },
        discordUserInfo: {
          isLinked: false,
          uid: '',
        },
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

      // 업데이트 타입 알림 처리 - 동일한 타입의 알림이 있으면 새로 추가하지 않고 기존 알림 업데이트
      if (notification.type === 'update') {
        const existingUpdateIndex = state.notifications.findIndex(
          (n) => n.type === 'update' && !n.isRemoving,
        )

        if (existingUpdateIndex !== -1) {
          // 기존 알림 ID 유지하면서 내용 업데이트
          const updatedNotification = {
            ...state.notifications[existingUpdateIndex],
            message: notification.message,
            updateInfo: notification.updateInfo,
            isRemoving: false,
            createdAt: Date.now(),
          }
          state.notifications[existingUpdateIndex] = updatedNotification
          return
        }
      }

      // 최대 5개까지만 보여주기 위해 오래된 알림 제거
      if (state.notifications.length >= 5) {
        // 업데이트 알림을 제외한 알림들 중에서 오래된 것 제거
        const nonUpdateNotifications = state.notifications.filter(
          (n) => n.type !== 'update' || n.isRemoving,
        )
        if (nonUpdateNotifications.length > 0) {
          // 오래된 알림부터 제거 (createdAt 기준)
          const sortedNotifications = [...nonUpdateNotifications].sort(
            (a, b) => a.createdAt - b.createdAt,
          )
          const toRemove = sortedNotifications[0].id
          state.notifications = state.notifications.filter((n) => n.id !== toRemove)
        }
      }

      // 새 알림 추가
      state.notifications.push(notification)
    },
    updateNotification: (
      state,
      action: PayloadAction<{ id: string; data: Partial<Notification> }>,
    ) => {
      const { id, data } = action.payload
      const notificationIndex = state.notifications.findIndex((n) => n.id === id)

      if (notificationIndex !== -1) {
        // 중첩된 객체 속성이 있는 경우 올바르게 병합
        if (data.updateInfo && state.notifications[notificationIndex].updateInfo) {
          state.notifications[notificationIndex].updateInfo = {
            ...state.notifications[notificationIndex].updateInfo,
            ...data.updateInfo,
          }
        } else if (data.updateInfo) {
          state.notifications[notificationIndex].updateInfo = data.updateInfo
        }

        // 메시지 업데이트
        if (data.message) {
          state.notifications[notificationIndex].message = data.message
        }

        // 기타 속성들 업데이트
        state.notifications[notificationIndex] = {
          ...state.notifications[notificationIndex],
          ...data,
        }
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const index = state.notifications.findIndex((notification) => notification.id === id)

      if (index !== -1 && index >= 0 && index < state.notifications.length) {
        // isRemoving 플래그만 설정하고 실제 제거는 별도로 처리
        if (state.notifications[index]) {
          state.notifications[index].isRemoving = true
        }
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
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.refresh = action.payload
    },
    // OCR 처리 시작
    startOcrProcess: (
      state,
      action: PayloadAction<{ totalImages: number; gameCode: GameType }>,
    ) => {
      const gameCode = action.payload.gameCode

      if (isValidGameCode(gameCode)) {
        // 게임별 OCR 상태 업데이트
        state.gameOcrStates[gameCode] = {
          ...state.gameOcrStates[gameCode],
          totalImages: action.payload.totalImages,
          processedImages: 0,
          isProcessing: true,
          lastProcessedAt: Date.now(),
        }

        // 현재 선택된 게임의 OCR 상태도 업데이트 (호환성 유지)
        if (state.selectedGame === gameCode) {
          state.ocrProcessState = state.gameOcrStates[gameCode]
        }

        createLog(
          'debug',
          `OCR process start: ${action.payload.totalImages} images, game: ${gameCode}`,
        )
      }
    },
    // OCR 결과 추가
    addOcrResult: (state, action: PayloadAction<OcrPlayDataResponse>) => {
      const gameCode = action.payload.gameCode as GameType

      if (isValidGameCode(gameCode)) {
        // 해당 게임의 OCR 결과에 추가
        const gameOcrState = state.gameOcrStates[gameCode]

        // 최대 100개까지만 저장
        if (gameOcrState.results.length >= 100) {
          gameOcrState.results.pop() // 가장 오래된 결과 제거
        }

        // 새 결과를 배열 맨 앞에 추가 (최신순 정렬)
        gameOcrState.results.unshift(action.payload)
        gameOcrState.processedImages += 1
        gameOcrState.lastProcessedAt = Date.now()

        // 현재 선택된 게임의 OCR 상태도 업데이트 (호환성 유지)
        if (state.selectedGame === gameCode) {
          state.ocrProcessState = gameOcrState
        }

        createLog(
          'debug',
          `OCR result added: ${gameOcrState.processedImages}/${gameOcrState.totalImages}, game: ${gameCode}`,
        )
      }
    },
    // 특정 OCR 결과 삭제
    removeOcrResult: (state, action: PayloadAction<{ index: number; gameCode: GameType }>) => {
      const { index, gameCode } = action.payload

      if (isValidGameCode(gameCode)) {
        const gameOcrState = state.gameOcrStates[gameCode]

        if (index >= 0 && index < gameOcrState.results.length) {
          gameOcrState.results.splice(index, 1)

          // 현재 선택된 게임의 OCR 상태도 업데이트 (호환성 유지)
          if (state.selectedGame === gameCode) {
            state.ocrProcessState = gameOcrState
          }

          createLog(
            'debug',
            `OCR result ${index} deleted, game: ${gameCode}, remaining results: ${gameOcrState.results.length}`,
          )
        }
      }
    },
    // OCR 처리 완료
    completeOcrProcess: (state, action: PayloadAction<GameType>) => {
      const gameCode = action.payload

      if (isValidGameCode(gameCode)) {
        state.gameOcrStates[gameCode].isProcessing = false
        state.gameOcrStates[gameCode].lastProcessedAt = Date.now()

        // 현재 선택된 게임의 OCR 상태도 업데이트 (호환성 유지)
        if (state.selectedGame === gameCode) {
          state.ocrProcessState = state.gameOcrStates[gameCode]
        }

        createLog(
          'debug',
          `OCR process complete, game: ${gameCode}, total ${state.gameOcrStates[gameCode].processedImages} results`,
        )
      }
    },
    // OCR 결과 초기화
    clearOcrResults: (state, action: PayloadAction<GameType>) => {
      const gameCode = action.payload

      if (isValidGameCode(gameCode)) {
        state.gameOcrStates[gameCode].results = []
        state.gameOcrStates[gameCode].processedImages = 0
        state.gameOcrStates[gameCode].totalImages = 0
        state.gameOcrStates[gameCode].lastProcessedAt = null
        state.gameOcrStates[gameCode].isProcessing = false

        // 현재 선택된 게임의 OCR 상태도 업데이트 (호환성 유지)
        if (state.selectedGame === gameCode) {
          state.ocrProcessState = state.gameOcrStates[gameCode]
        }

        createLog('debug', `OCR results cleared, game: ${gameCode}`)
      }
    },
  },
})

// Redux Persist 설정
const persistConfig = {
  key: 'ocrResults',
  storage,
  // 필요한 상태만 유지
  whitelist: ['gameOcrStates', 'ocrProcessState'],
}

export const {
  setSelectedGame,
  setIsSetting,
  setIsTrackMaker,
  setSettingData,
  setUserData,
  setIsUploading,
  setIsMiniMode,
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
  setRefresh,
  // OCR 관련 액션
  startOcrProcess,
  addOcrResult,
  removeOcrResult,
  completeOcrProcess,
  clearOcrResults,
} = appSlice.actions

export default persistReducer(persistConfig, appSlice.reducer)
