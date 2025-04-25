import type { Notification } from '@src/types/render/Notification'

export interface NotificationContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}
