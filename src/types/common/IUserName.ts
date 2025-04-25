export interface IUserNameRequest {
  userNo: string
  token: string
}

export interface IUserNameResponse {
  success: boolean
  nickname?: string
  error?: string
}
