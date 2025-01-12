import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { FiX } from 'react-icons/fi'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  fullscreen?: boolean
}

export default function Modal({ isOpen, onClose, title, children, className = '', fullscreen = false }: ModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleBackdropClick}
          className="tw-fixed tw-inset-0 tw-bg-gray-950 tw-bg-opacity-90 tw-flex tw-items-center tw-p-8 tw-justify-center tw-z-[99999]"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.15 }}
            className={`tw-bg-gray-900 tw-rounded-lg tw-shadow-lg tw-w-full tw-h-full tw-flex tw-flex-col tw-p-4 ${className}`}
          >
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
              <h3 className="tw-text-lg tw-font-bold">{title}</h3>
              <button onClick={onClose} className="tw-p-1 tw-rounded-full hover:tw-bg-gray-700 tw-transition-colors">
                <FiX className="tw-w-5 tw-h-5" />
              </button>
            </div>
            <div className="tw-flex-1 tw-overflow-y">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
