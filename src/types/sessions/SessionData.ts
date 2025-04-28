export interface SessionData {
  userNo?: string
  userToken?: string
  userName?: string
  vArchiveUserNo?: number
  vArchiveUserToken?: string
  vArchiveUserName?: string | { success: boolean; nickname: string }
  discordUid?: string
  discordLinked?: boolean
  vArchiveLinked?: boolean
}
