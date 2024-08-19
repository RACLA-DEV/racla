import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, color?) => {
    const id = uuidv4()
    setNotifications((prevNotifications) => [...prevNotifications, { id, message, fadeOut: false, color }])

    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => (notification.id === id ? { ...notification, fadeOut: true } : notification)),
      )

      setTimeout(() => {
        setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== id))
      }, 500) // fadeOut duration
    }, 10000) // display duration
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => (notification.id === id ? { ...notification, fadeOut: true } : notification)),
    )

    setTimeout(() => {
      setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== id))
    }, 500) // fadeOut duration
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
  }
}
