import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

interface Notification {
  id: string
  message: string
  color?: string
  fadeOut: boolean
}

interface NotificationState {
  notifications: Notification[]
}

const initialState: NotificationState = {
  notifications: [],
}

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<{ id: string; message: string; color?: string }>) => {
      state.notifications.push({
        id: action.payload.id,
        message: action.payload.message,
        color: action.payload.color,
        fadeOut: false,
      })
    },
    setNotificationFadeOut: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload)
      if (notification) {
        notification.fadeOut = true
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload)
    },
  },
})

export const { addNotification, setNotificationFadeOut, removeNotification } = notificationSlice.actions
export default notificationSlice.reducer
