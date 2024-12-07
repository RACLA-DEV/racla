import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './slices/uiSlice'
import appReducer from './slices/appSlice'
import notificationReducer from './slices/notificationSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    app: appReducer,
    notification: notificationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
