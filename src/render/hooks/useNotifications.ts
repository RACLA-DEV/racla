import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  isRemoving?: boolean
}

export function useNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 5000) => {
      const id = uuidv4()
      const notification: Notification = {
        id,
        message,
        type,
        duration,
        isRemoving: false,
      }

      setNotifications((prev) => [...prev, notification])

      // 자동 제거
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id)
        }, duration)
      }

      return id
    },
    [],
  )

  const removeNotification = useCallback((id: string) => {
    // 먼저 isRemoving 플래그를 설정하여 애니메이션을 시작
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, isRemoving: true } : notification,
      ),
    )

    // 애니메이션 완료 후 실제로 제거
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, 500) // 애니메이션 지속 시간
  }, [])

  const clearAllNotifications = useCallback(() => {
    // 모든 알림을 제거 애니메이션 상태로 설정
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRemoving: true })))

    // 애니메이션 완료 후 모두 제거
    setTimeout(() => {
      setNotifications([])
    }, 500)
  }, [])

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
  }
}
