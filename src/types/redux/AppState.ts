import { GameType } from '../games/GameType'
import { SongData } from '../games/SongData'
import { Notification } from '../notifications/Notification'
import { SessionData } from '../sessions/SessionData'
import { SettingsData } from '../settings/SettingData'

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
    wjmax: SongData[]
    platina_lab: SongData[]
    lastUpdated: {
      djmax_respect_v: number | null
      wjmax: number | null
      platina_lab: number | null
    }
  }
  refresh: boolean
}
