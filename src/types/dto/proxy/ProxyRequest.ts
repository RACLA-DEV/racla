export interface ProxyRequest {
  url: string
  method: 'GET' | 'POST'
  type: 'query' | 'body'
  data?: Record<string, any>
  headers?: Record<string, string>
}
