import { Icon } from '@iconify/react'
import { RootState } from '@render/store'
import type { NotificationContainerProps } from '@src/types/render/NotificationContainerProps'
import type { NotificationProps } from '@src/types/render/NotificationProps'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

// 알림 컴포넌트
export function Notification({ notification, onRemove, index }: NotificationProps) {
  const { id, message, type, isRemoving } = notification
  const [progress, setProgress] = useState(100)
  const { theme } = useSelector((state: RootState) => state.ui)
  const { t } = useTranslation(['common', 'settings', 'languages', 'games', 'menu'])

  // 타입에 따른 스타일 및 아이콘 설정
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'tw:bg-green-500',
          iconName: 'lucide:check-circle',
          iconColor: 'tw:text-green-500',
          bgColor: theme === 'dark' ? 'tw:bg-green-900/20' : 'tw:bg-green-100',
        }
      case 'error':
        return {
          background: 'tw:bg-red-500',
          iconName: 'lucide:x-circle',
          iconColor: 'tw:text-red-500',
          bgColor: theme === 'dark' ? 'tw:bg-red-900/20' : 'tw:bg-red-100',
        }
      case 'warning':
        return {
          background: 'tw:bg-amber-500',
          iconName: 'lucide:alert-circle',
          iconColor: 'tw:text-amber-500',
          bgColor: theme === 'dark' ? 'tw:bg-amber-900/20' : 'tw:bg-amber-100',
        }
      case 'info':
      default:
        return {
          background: 'tw:bg-blue-500',
          iconName: 'lucide:info',
          iconColor: 'tw:text-blue-500',
          bgColor: theme === 'dark' ? 'tw:bg-blue-900/20' : 'tw:bg-blue-100',
        }
    }
  }

  const { background, iconName, iconColor, bgColor } = getTypeStyles()

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
    <motion.div
      id={`notification-${id}`}
      className='tw:flex tw:text-sm tw:w-full tw:max-w-sm tw:overflow-hidden tw:rounded-lg tw:shadow-lg tw:mt-2'
      initial={{ opacity: 0, x: 300 }}
      animate={{
        opacity: isRemoving ? 0 : 1,
        x: isRemoving ? 300 : 0,
        transition: { duration: 0.5 },
      }}
      exit={{ opacity: 0, x: 300 }}
      style={{ zIndex: 1000 - index }} // 새 알림이 항상 위에 오도록
    >
      {/* <div className={`tw:w-2 tw:flex-shrink-0 ${background}`}></div> */}

      <div className='tw:flex-grow tw:bg-white tw:dark:bg-slate-900'>
        <div className='tw:flex tw:items-center tw:pt-3 tw:px-4'>
          <div className='tw:flex-shrink-0 tw:mr-2'>
            <div
              className={`tw:flex tw:items-center tw:w-5 tw:h-5 tw:justify-center tw:rounded-sm ${bgColor}`}
            >
              <Icon icon={iconName} className={`tw:w-4 tw:h-4 ${iconColor}`} />
            </div>
          </div>

          <div className='tw:flex-grow'>
            <p className='tw:text-xs tw:text-slate-800 tw:dark:text-slate-200'>
              {message.mode === 'string'
                ? message.value
                : t(message.value, {
                    ns: message.ns,
                    ...(message?.props ? message.props : {}),
                  })}
            </p>
          </div>

          <button
            onClick={() => onRemove(id)}
            className='tw:ml-2 tw:flex-shrink-0 tw:text-slate-400 tw:hover:text-slate-500 tw:focus:outline-none tw:dark:text-slate-500 tw:dark:hover:text-slate-400'
          >
            <Icon icon='lucide:x' className='tw:w-4 tw:h-4' />
          </button>
        </div>

        {notification.duration && notification.duration > 0 && (
          <div className='tw:mt-2 tw:flex tw:justify-end tw:h-1 tw:w-full tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700'>
            <div
              className={`tw:h-full ${background} tw:rounded tw:transition-all tw:duration-300`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// 알림 목록 컴포넌트
export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  // 최대 5개까지만 표시
  const visibleNotifications = notifications.slice(-5)
  const { isLoading } = useSelector((state: RootState) => state.app)

  return (
    <div
      className={`tw:fixed tw:right-2 tw:bottom-10 tw:z-50 tw:space-y-2 tw:transition-opacity tw:duration-300 ${isLoading ? 'tw:opacity-0 tw:pointer-events-none' : 'tw:opacity-100'}`}
    >
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => (
          <Notification
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
