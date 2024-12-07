import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { FiX } from 'react-icons/fi'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export default function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
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
          className="tw-fixed tw-inset-0 tw-bg-gray-950 tw-bg-opacity-90 tw-flex tw-items-center tw-justify-center tw-z-[99999]"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.15 }}
            className={`tw-bg-gray-900 tw-rounded-lg tw-p-2 tw-shadow-lg tw-w-full tw-max-w-lg ${className}`}
          >
            <h3 className="tw-text-lg tw-font-bold tw-mt-4 tw-text-center">{title}</h3>
            <div className="tw-p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
