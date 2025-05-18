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
      type: 'success' | 'error' | 'info' | 'warning' | 'update' = 'info',
      duration = 5000,
      updateInfo?: any,
    ) => {
      const id = uuidv4()

      // 업데이트 타입의 알림인 경우 기존 업데이트 알림이 있는지 확인
      if (type === 'update') {
        // 기존 업데이트 알림 찾기
        const existingUpdateNotification = notifications.find(
          (notification) => notification.type === 'update' && !notification.isRemoving,
        )

        if (existingUpdateNotification) {
          // 기존 업데이트 알림이 있으면 업데이트만 하고 새 알림은 추가하지 않음
          dispatch({
            type: 'app/updateNotification',
            payload: {
              id: existingUpdateNotification.id,
              data: {
                message,
                updateInfo,
                isRemoving: false,
              },
            },
          })
          console.log('기존 업데이트 알림 업데이트:', existingUpdateNotification.id)
          return existingUpdateNotification.id
        }
      }

      // 새 알림 추가 (업데이트 타입의 알림이 없거나 다른 타입의 알림인 경우)
      dispatch(
        addNotification({
          id,
          message,
          type,
          duration,
          isRemoving: false,
          updateInfo,
        }),
      )

      // 자동 제거 설정 (업데이트 타입은 자동 제거하지 않음)
      if (duration > 0 && type !== 'update') {
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
    [dispatch, notifications],
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
