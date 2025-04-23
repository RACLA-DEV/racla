export interface ProxyResponse<T> {
  code: number
  data: T
  message: string | null
}
