export interface ApiArchiveUserNameRequest {
  userNo: string
  token: string
}

export interface ApiArchiveUserNameResponse {
  success: boolean
  nickname?: string
  error?: string
}
