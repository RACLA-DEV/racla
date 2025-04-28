import type { Notification } from '@src/types/notifications/Notification'

export interface NotificationContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}
