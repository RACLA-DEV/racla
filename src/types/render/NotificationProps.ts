import type { Notification } from '@src/types/render/Notification'

export interface NotificationProps {
  notification: Notification
  onRemove: (id: string) => void
  index: number
}
