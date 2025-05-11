import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { UIState } from '@src/types/redux/UIState'
const initialState: UIState = {
  theme: 'light',
  sidebarCollapsed: false,
  openExternalLink: '',
  isOpenExternalLink: false,
  isOverlayMode: false,
  alertModal: {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmMode: false,
    onConfirm: null,
    confirmText: '확인',
    cancelText: '취소',
  },
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    setOverlayMode: (state, action: PayloadAction<boolean>) => {
      state.isOverlayMode = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    setOpenExternalLink: (state, action: PayloadAction<string>) => {
      state.openExternalLink = action.payload
    },
    setIsOpenExternalLink: (state, action: PayloadAction<boolean>) => {
      state.isOpenExternalLink = action.payload
    },
    showAlertModal: (
      state,
      action: PayloadAction<{
        title: string
        message: string
        type?: 'success' | 'error' | 'warning' | 'info'
        confirmMode?: boolean
        onConfirmId?: string
        confirmText?: string
        cancelText?: string
      }>,
    ) => {
      state.alertModal = {
        isOpen: true,
        title: action.payload.title,
        message: action.payload.message,
        type: action.payload.type || 'info',
        confirmMode: action.payload.confirmMode || false,
        onConfirm: action.payload.onConfirmId || null,
        confirmText: action.payload.confirmText || '확인',
        cancelText: action.payload.cancelText || '취소',
      }
    },
    hideAlertModal: (state) => {
      state.alertModal.isOpen = false
    },
    clearAlertModalCallback: (state) => {
      state.alertModal.onConfirm = null
    },
  },
})

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setOpenExternalLink,
  setIsOpenExternalLink,
  setOverlayMode,
  showAlertModal,
  hideAlertModal,
  clearAlertModalCallback,
} = uiSlice.actions

export default uiSlice.reducer
