export interface UIState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  openExternalLink: string
  isOpenExternalLink: boolean
  isOverlayMode: boolean
  alertModal: {
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    confirmMode: boolean
    onConfirm: string | null
    confirmText: string
    cancelText: string
  }
}
