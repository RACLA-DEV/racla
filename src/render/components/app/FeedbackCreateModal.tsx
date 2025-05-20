import { FeedbackCreateModalProps } from '@src/types/render/FeedbackCreateModalProps'
import { AnimatePresence, motion } from 'framer-motion'

import { FiX } from 'react-icons/fi'

export default function FeedbackCreateModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  fullscreen = false,
}: FeedbackCreateModalProps) {
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
          className='tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center tw:z-[99999]'
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.15 }}
            className={`tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:w-full tw:h-full tw:flex tw:flex-col tw:p-4 ${className}`}
          >
            <div className='tw:flex tw:justify-between tw:items-center tw:mb-4'>
              <h3 className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                {title}
              </h3>
              <button
                onClick={onClose}
                className='tw:p-1 tw:rounded-full hover:tw:bg-gray-100 hover:tw:dark:bg-slate-700 tw:text-gray-700 tw:dark:text-gray-300 tw:transition-colors'
              >
                <FiX className='tw:w-5 tw:h-5' />
              </button>
            </div>
            <div className='tw:flex-1 tw:overflow-y-auto tw:text-gray-800 tw:dark:text-gray-200'>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
