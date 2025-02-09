export interface IUserNameRequest {
  token: string
  userNo: string
}

export interface IUserNameResponse {
  success: boolean
  nickname: string
}
