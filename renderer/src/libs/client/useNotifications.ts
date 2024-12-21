import { useCallback, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification, setNotificationFadeOut, removeNotification } from 'store/slices/notificationSlice'
import { RootState } from 'store'

const MAX_NOTIFICATIONS = 5

export const useNotificationSystem = () => {
  const dispatch = useDispatch()
  const timerRefs = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const notifications = useSelector((state: RootState) => state.notification.notifications)
  const idCounter = useRef<number>(0)

  const removeNotificationWithFade = useCallback(
    (id: string) => {
      if (timerRefs.current[id]) {
        clearTimeout(timerRefs.current[id])
      }

      dispatch(setNotificationFadeOut(id))

      // 페이드 아웃 타이머 저장
      timerRefs.current[id] = setTimeout(() => {
        dispatch(removeNotification(id))
        delete timerRefs.current[id] // 타이머 참조 제거
      }, 500)
    },
    [dispatch],
  )

  const showNotification = useCallback(
    (message: string, color?: string, isFinal?: boolean) => {
      try {
        if (notifications.length >= MAX_NOTIFICATIONS) {
          removeNotificationWithFade(notifications[0].id)
        }

        const notificationId = `notification-${idCounter.current++}`
        dispatch(addNotification({ id: notificationId, message, color, isFinal }))

        // isFinal이 true가 아닐 경우에만 자동 제거 타이머 설정
        if (!isFinal) {
          timerRefs.current[notificationId] = setTimeout(() => {
            removeNotificationWithFade(notificationId)
          }, 3000) // 3초 후 제거
        }
      } catch (error) {
        console.error('알림 표시 중 오류 발생:', error)
      }
    },
    [dispatch, notifications, removeNotificationWithFade],
  )

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach((timer) => clearTimeout(timer))
      timerRefs.current = {}
    }
  }, [])

  return { showNotification, removeNotification: removeNotificationWithFade }
}
