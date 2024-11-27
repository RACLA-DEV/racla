import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { addNotification, setNotificationFadeOut, removeNotification } from 'store/slices/notificationSlice'
import { v4 as uuidv4 } from 'uuid' // uuid 패키지 추가 필요

export const useNotificationSystem = () => {
  const dispatch = useDispatch()

  const showNotification = useCallback(
    (message: string, color?: string) => {
      const notificationId = uuidv4() // 고유한 ID 생성
      dispatch(addNotification({ id: notificationId, message, color }))

      setTimeout(() => {
        dispatch(setNotificationFadeOut(notificationId))

        setTimeout(() => {
          dispatch(removeNotification(notificationId))
        }, 500) // fadeOut duration
      }, 10000) // display duration
    },
    [dispatch],
  )

  const removeNotificationWithFade = useCallback(
    (id: string) => {
      dispatch(setNotificationFadeOut(id))

      setTimeout(() => {
        dispatch(removeNotification(id))
      }, 500)
    },
    [dispatch],
  )

  return { showNotification, removeNotification: removeNotificationWithFade }
}
