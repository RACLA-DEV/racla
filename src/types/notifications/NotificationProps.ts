import type { Notification } from '@src/types/notifications/Notification'
import type { NotificationContainerProps } from '@src/types/notifications/NotificationContainerProps'

export interface NotificationProps {
  notification: Notification
  onRemove: NotificationContainerProps['onRemove']
  index: number
}
