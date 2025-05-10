import { DiscordUserInfo } from './DiscordUserInfo'
import { VArchiveUserInfo } from './VArchiveUserInfo'

export interface SessionData {
  playerId: number
  playerToken: string
  playerName: string
  playerNickname?: string
  isSetupPassword: boolean
  profileImageUrl?: string
  varchiveUserInfo?: VArchiveUserInfo
  discordUserInfo?: DiscordUserInfo
}
