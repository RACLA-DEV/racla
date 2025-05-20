export interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  confirmMode?: boolean
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
}
