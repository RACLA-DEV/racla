import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Notification {
  id: string
  message: string
  color?: string
  isFinal?: boolean
  createdAt: number
  isRemoving: boolean
}

interface NotificationState {
  notifications: Notification[]
}

const MAX_NOTIFICATIONS = 5

const initialState: NotificationState = {
  notifications: [],
}

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<{
        id: string
        message: string
        color?: string
        isFinal?: boolean
        createdAt: number
        isRemoving: boolean
      }>,
    ) => {
      if (state.notifications.length >= MAX_NOTIFICATIONS) {
        const oldestNotification = state.notifications.filter((n) => !n.isRemoving).sort((a, b) => a.createdAt - b.createdAt)[0]

        if (oldestNotification) {
          oldestNotification.isRemoving = true
        }
      }

      state.notifications.push({
        ...action.payload,
      })
    },
    startRemovingNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload)
      if (notification) {
        notification.isRemoving = true
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload)
    },
  },
})

export const { addNotification, removeNotification, startRemovingNotification } = notificationSlice.actions
export default notificationSlice.reducer
