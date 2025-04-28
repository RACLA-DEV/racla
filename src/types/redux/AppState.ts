import { GameType } from '../games/GameType'
import { SongData } from '../games/SongData'
import { Notification } from '../notifications/Notification'
import { SettingsData } from '../settings/SettingData'

export interface AppState {
  selectedGame: GameType
  isSetting: boolean
  isLoading: boolean
  settingData: SettingsData
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
}
