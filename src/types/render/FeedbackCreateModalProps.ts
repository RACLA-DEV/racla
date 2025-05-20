import { ReactNode } from 'react'

export interface FeedbackCreateModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  fullscreen?: boolean
}
