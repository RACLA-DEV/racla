export interface UserNameRequest {
  userNo: string
  token: string
}

export interface UserNameResponse {
  success: boolean
  nickname?: string
  error?: string
}
