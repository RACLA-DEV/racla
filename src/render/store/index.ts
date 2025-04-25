import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import appReducer from './slices/appSlice'
import uiReducer from './slices/uiSlice'

const uiPersistConfig = {
  key: 'ui',
  storage,
  blacklist: ['isOpenExternalLink', 'openExternalLink'],
}

const appPersistConfig = {
  key: 'app',
  storage,
  blacklist: [
    'isSetting',
    'userData',
    'vArchiveUserData',
    'isLoggedIn',
    'notifications',
    'isLoading',
  ],
}

const rootReducer = combineReducers({
  ui: persistReducer(uiPersistConfig, uiReducer),
  app: persistReducer(appPersistConfig, appReducer),
  // 추가 리듀서들...
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
