import { GameType } from '../common/GameType'
import { SettingsData } from '../common/SettingData'
import { SongData } from '../common/SongData'
import { Notification } from '../render/Notification'

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
