import { useEffect, useState } from 'react'
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa'
import { Notification as NotificationType } from '../../hooks/useNotifications'

interface NotificationProps {
  notification: NotificationType
  onRemove: (id: string) => void
}

// 알림 컴포넌트
export function Notification({ notification, onRemove }: NotificationProps) {
  const { id, message, type, isRemoving } = notification
  const [progress, setProgress] = useState(100)

  // 타입에 따른 스타일 및 아이콘 설정
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'bg-green-500',
          icon: <FaCheckCircle className='text-lg' />,
        }
      case 'error':
        return {
          background: 'bg-red-500',
          icon: <FaTimesCircle className='text-lg' />,
        }
      case 'warning':
        return {
          background: 'bg-amber-500',
          icon: <FaExclamationCircle className='text-lg' />,
        }
      case 'info':
      default:
        return {
          background: 'bg-blue-500',
          icon: <FaInfoCircle className='text-lg' />,
        }
    }
  }

  const { background, icon } = getTypeStyles()

  // 프로그레스 바 애니메이션
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const intervalId = setInterval(() => {
        setProgress((prev) => {
          const newValue = prev - 100 / (notification.duration / 100)
          return newValue < 0 ? 0 : newValue
        })
      }, 100)

      return () => clearInterval(intervalId)
    }
  }, [notification.duration])

  return (
    <div
      id={`notification-${id}`}
      className={`flex w-full max-w-sm transform overflow-hidden rounded-lg shadow-lg transition-all duration-500 ${
        isRemoving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className={`w-2 flex-shrink-0 ${background}`}></div>

      <div className='flex-grow bg-white p-4 dark:bg-slate-800'>
        <div className='flex items-start'>
          <div className={`flex-shrink-0 text-${type} mr-3`}>{icon}</div>

          <div className='flex-grow'>
            <p className='text-sm text-slate-800 dark:text-slate-200'>{message}</p>
          </div>

          <button
            onClick={() => onRemove(id)}
            className='ml-2 flex-shrink-0 text-slate-400 hover:text-slate-500 focus:outline-none dark:text-slate-500 dark:hover:text-slate-400'
          >
            <FaTimes />
          </button>
        </div>

        {notification.duration && notification.duration > 0 && (
          <div className='mt-2 h-1 w-full rounded bg-slate-200 dark:bg-slate-700'>
            <div className={`h-full ${background} rounded`} style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
    </div>
  )
}

// 알림 목록 컴포넌트
export function NotificationContainer({ notifications, onRemove }) {
  return (
    <div className='fixed top-4 right-4 z-50 max-w-sm space-y-2'>
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} onRemove={onRemove} />
      ))}
    </div>
  )
}
