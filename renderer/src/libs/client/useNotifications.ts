import { useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { addNotification, setNotificationFadeOut, removeNotification } from 'store/slices/notificationSlice'
import { v4 as uuidv4 } from 'uuid'

export const useNotificationSystem = () => {
  const dispatch = useDispatch()
  const timerRefs = useRef<{ [key: string]: NodeJS.Timeout }>({})

  const showNotification = useCallback(
    (message: string, color?: string, updateKey?: string, isFinal?: boolean) => {
      if (updateKey) {
        // 업데이트 가능한 알림용
        const notificationId = `update_${updateKey}`

        // 이전 타이머가 있다면 취소
        if (timerRefs.current[notificationId]) {
          clearTimeout(timerRefs.current[notificationId])
        }

        dispatch(addNotification({ id: notificationId, message, color, updateKey, isFinal }))

        // 새로운 타이머 설정
        timerRefs.current[notificationId] = setTimeout(() => {
          dispatch(setNotificationFadeOut(notificationId))
          setTimeout(() => {
            dispatch(removeNotification(notificationId))
            delete timerRefs.current[notificationId]
          }, 500)
        }, 10000)

        // 컴포넌트 언마운트 시 클린업
        return () => {
          if (timerRefs.current[notificationId]) {
            clearTimeout(timerRefs.current[notificationId])
            delete timerRefs.current[notificationId]
          }
        }
      } else {
        // 기존 일반 알림용
        const notificationId = uuidv4()
        dispatch(addNotification({ id: notificationId, message, color, isFinal }))

        const timer = setTimeout(() => {
          dispatch(setNotificationFadeOut(notificationId))
          setTimeout(() => {
            dispatch(removeNotification(notificationId))
          }, 500)
        }, 10000)

        return () => clearTimeout(timer)
      }
    },
    [dispatch],
  )

  const removeNotificationWithFade = useCallback(
    (id: string) => {
      // 타이머가 있다면 취소
      if (timerRefs.current[id]) {
        clearTimeout(timerRefs.current[id])
        delete timerRefs.current[id]
      }

      dispatch(setNotificationFadeOut(id))
      setTimeout(() => {
        dispatch(removeNotification(id))
      }, 500)
    },
    [dispatch],
  )

  return { showNotification, removeNotification: removeNotificationWithFade }
}
