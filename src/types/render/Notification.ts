export interface Notification {
  id: string
  message: { mode: 'string' | 'i18n'; ns?: string; value: string; props?: Record<string, string> }
  type: 'success' | 'error' | 'info' | 'warning' | 'update'
  duration?: number
  isRemoving?: boolean
  createdAt: number
  updateInfo?: {
    version?: string
    progress?: {
      percent: number
      transferred: number
      total: number
    }
    isDownloaded?: boolean
  }
}
