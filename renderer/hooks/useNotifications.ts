import {
  addNotification,
  removeNotification,
  startRemovingNotification,
} from 'store/slices/notificationSlice'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from 'store'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const NOTIFICATION_DURATION = 10000 // 10초
const ANIMATION_DURATION = 500 // 애니메이션 지속 시간

export const useNotificationSystem = () => {
  const dispatch = useDispatch()
  const notifications = useSelector((state: RootState) => state.notification.notifications)

  const showNotification = useCallback(
    (message: string, color?: string) => {
      const notificationId = `notification-${uuidv4()}`

      // 새 알림 추가
      dispatch(
        addNotification({
          id: notificationId,
          message,
          color,
          createdAt: Date.now(),
          isRemoving: false,
        }),
      )

      // 가장 오래된 removing 상태의 알림 제거
      const removingNotifications = notifications.filter((n) => n.isRemoving)
      if (removingNotifications.length > 0) {
        setTimeout(() => {
          removingNotifications.forEach((notification) => {
            dispatch(removeNotification(notification.id))
          })
        }, ANIMATION_DURATION)
      }

      // 현재 알림 제거 타이머 설정
      setTimeout(() => {
        dispatch(startRemovingNotification(notificationId))
        setTimeout(() => {
          dispatch(removeNotification(notificationId))
        }, ANIMATION_DURATION)
      }, NOTIFICATION_DURATION)
    },
    [dispatch],
  )

  return { showNotification }
}
