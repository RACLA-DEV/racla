import { RootState } from '@render/store'
import {
  addNotification,
  clearAllNotifications,
  deleteAllNotifications,
  deleteNotification,
  removeNotification,
} from '@render/store/slices/appSlice'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'

export function useNotificationSystem() {
  const dispatch = useDispatch()
  const notifications = useSelector((state: RootState) => state.app.notifications)

  const showNotification = useCallback(
    (
      message: {
        mode: 'string' | 'i18n'
        ns?: string
        value: string
        props?: Record<string, string>
      },
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      duration = 5000,
    ) => {
      const id = uuidv4()

      // Redux를 통해 알림 추가
      dispatch(
        addNotification({
          id,
          message,
          type,
          duration,
          isRemoving: false,
        }),
      )

      // 자동 제거 설정
      if (duration > 0) {
        setTimeout(() => {
          // 애니메이션을 위해 isRemoving 설정
          dispatch(removeNotification(id))

          // 애니메이션 후 실제로 상태에서 제거
          setTimeout(() => {
            dispatch(deleteNotification(id))
          }, 500) // 애니메이션 지속 시간
        }, duration)
      }

      return id
    },
    [dispatch],
  )

  const removeNotificationById = useCallback(
    (id: string) => {
      // 애니메이션을 위해 isRemoving 플래그 설정
      dispatch(removeNotification(id))

      // 애니메이션 완료 후 실제로 제거
      setTimeout(() => {
        dispatch(deleteNotification(id))
      }, 500) // 애니메이션 지속 시간
    },
    [dispatch],
  )

  const clearAllNotificationsHandler = useCallback(() => {
    // 모든 알림을 제거 애니메이션 상태로 설정
    dispatch(clearAllNotifications())

    // 애니메이션 완료 후 모두 제거
    setTimeout(() => {
      dispatch(deleteAllNotifications())
    }, 500)
  }, [dispatch])

  return {
    notifications,
    showNotification,
    removeNotification: removeNotificationById,
    clearAllNotifications: clearAllNotificationsHandler,
  }
}
