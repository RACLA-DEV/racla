export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  isRemoving?: boolean
  createdAt: number
}
