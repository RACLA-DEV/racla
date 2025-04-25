import type { Notification } from '@src/types/render/Notification'
import type { NotificationContainerProps } from '@src/types/render/NotificationContainerProps'

export interface NotificationProps {
  notification: Notification
  onRemove: NotificationContainerProps['onRemove']
  index: number
}
