import { configureStore } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'
import notificationReducer from './slices/notificationSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    app: appReducer,
    notification: notificationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
