export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'debug'

export interface OverlayNotification {
  id: string
  message: string
  type: NotificationType
  duration?: number
  isRemoving?: boolean
  mode: 'i18n' | 'default'
  props?: Record<string, string>
}
