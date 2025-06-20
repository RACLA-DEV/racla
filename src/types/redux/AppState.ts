import { OcrPlayDataResponse } from '../dto/ocr/OcrPlayDataResponse'
import { GameType } from '../games/GameType'
import { SongData } from '../games/SongData'
import { Notification } from '../render/Notification'
import { SessionData } from '../sessions/SessionData'
import { SettingsData } from '../settings/SettingData'

// OCR 처리 상태 타입 정의
export interface OcrProcessState {
  results: OcrPlayDataResponse[]
  totalImages: number
  processedImages: number
  isProcessing: boolean
  lastProcessedAt: number | null
  gameCode: GameType | null
}

// 게임별 OCR 상태 관리
export interface GameOcrStates {
  djmax_respect_v: OcrProcessState
  platina_lab: OcrProcessState
  ez2on: OcrProcessState
}

export interface AppState {
  selectedGame: GameType
  isSetting: boolean
  isTrackMaker: boolean
  isLoading: boolean
  settingData: SettingsData
  userData: SessionData
  isDetectedGame: boolean
  isUploading: boolean
  isMiniMode: boolean
  platform: string
  isLoggedIn: boolean
  notifications: Notification[]
  songData: {
    djmax_respect_v: SongData[]
    platina_lab: SongData[]
    lastUpdated: {
      djmax_respect_v: number | null
      platina_lab: number | null
      ez2on: number | null
    }
  }
  refresh: boolean
  // 게임별 OCR 상태
  gameOcrStates: GameOcrStates
  // 현재 선택된 게임의 OCR 처리 상태 (호환성 유지)
  ocrProcessState: OcrProcessState
}
