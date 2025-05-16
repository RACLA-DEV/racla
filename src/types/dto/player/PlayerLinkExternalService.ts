import { DiscordUserInfo } from '@src/types/sessions/DiscordUserInfo'
import { VArchiveUserInfo } from '@src/types/sessions/VArchiveUserInfo'

export interface PlayerLinkExternalServiceRequest {
  playerId: number
  playerToken: string
  externalServiceUserNo: number
  externalServiceUserToken: string
  externalServiceUserName: string
  externalServiceCode: string
  externalServiceType: string
}

export interface PlayerLinkExternalServiceResponse {
  result: string
  varchiveUserInfo?: VArchiveUserInfo
  discordUserInfo?: DiscordUserInfo
}
