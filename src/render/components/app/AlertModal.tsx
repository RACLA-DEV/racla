import { Icon } from '@iconify/react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

interface AlertModalProps {
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

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmMode = false,
  onConfirm,
  confirmText = '확인',
  cancelText = '취소',
}: AlertModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'lucide:check-circle',
          color: 'tw:text-green-500',
          bg: 'tw:bg-green-500/20',
        }
      case 'error':
        return {
          icon: 'lucide:x-circle',
          color: 'tw:text-red-500',
          bg: 'tw:bg-red-500/20',
        }
      case 'warning':
        return {
          icon: 'lucide:alert-circle',
          color: 'tw:text-yellow-500',
          bg: 'tw:bg-yellow-500/20',
        }
      default:
        return {
          icon: 'lucide:info',
          color: 'tw:text-blue-500',
          bg: 'tw:bg-blue-500/20',
        }
    }
  }

  const iconStyle = getIcon()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '24rem',
              margin: '0 auto',
              zIndex: 1000000,
            }}
            className='tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:dark:border-slate-700 tw:dark:bg-slate-800 tw:p-8 tw:text-center tw:shadow-2xl'
          >
            <div className='tw:mb-4 tw:flex tw:justify-center'>
              <div className={`tw:rounded-full ${iconStyle.bg} tw:p-3`}>
                <Icon icon={iconStyle.icon} className={`tw:h-8 tw:w-8 ${iconStyle.color}`} />
              </div>
            </div>
            <h3 className='tw:mb-2 tw:text-xl tw:font-bold tw:dark:text-gray-200 tw:text-gray-800'>
              {title}
            </h3>
            <p className='tw:mb-6 tw:dark:text-gray-300 tw:text-slate-600'>{message}</p>
            <div className='tw:flex tw:justify-center tw:gap-4'>
              {confirmMode ? (
                <>
                  <button
                    onClick={onClose}
                    className='tw:rounded-full tw:bg-slate-600 tw:px-6 tw:py-2 tw:text-white tw:transition-colors hover:tw:bg-zinc-700'
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className='tw:rounded-full tw:bg-indigo-600 tw:px-6 tw:py-2 tw:text-white tw:transition-colors hover:tw:bg-blue-700'
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className='tw:rounded-full tw:bg-indigo-600 tw:px-6 tw:py-2 tw:text-white tw:transition-colors hover:tw:bg-indigo-700'
                >
                  {confirmText}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  // Portal을 사용하여 모달을 document.body에 직접 렌더링
  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}
