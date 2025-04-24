export interface Notification {
  id: string
  message: { mode: 'string' | 'i18n'; ns?: string; value: string; props?: Record<string, string> }
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  isRemoving?: boolean
  createdAt: number
}
