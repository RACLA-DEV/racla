import { useNotificationSystem } from '@/libs/client/useNotifications'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

const NotificationComponent = () => {
  const notifications = useSelector((state: RootState) => state.notification.notifications)
  const { removeNotification } = useNotificationSystem()

  return (
    <div className="tw-fixed tw-bottom-0 tw-right-2 tw-z-50 tw-max-w-sm tw-break-keep">
      {notifications.map(({ id, message, fadeOut, color }) => (
        <div
          key={id}
          className={`
            ${color ? color : `tw-bg-gray-800/90`}
            tw-cursor-pointer 
            tw-text-xs
            tw-relative 
            tw-text-white 
            tw-py-3 
            tw-px-4 
            tw-mb-3 
            tw-rounded-lg 
            tw-overflow-hidden 
            tw-shadow-xl
            tw-backdrop-blur-sm
            tw-border-t
            tw-border-white/10
            tw-transform
            ${fadeOut ? 'tw-animate-fadeOutSlideRight tw-pointer-events-none' : 'tw-animate-fadeInSlideRight'}
            hover:tw-scale-102
            hover:tw-brightness-110
            tw-transition-all
            tw-duration-200
          `}
          onClick={() => removeNotification(id)}
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-flex-1">{message}</div>
            <button className="tw-opacity-60 hover:tw-opacity-100">✕</button>
          </div>
          <div
            className={`
              tw-absolute 
              tw-bottom-0 
              tw-left-0 
              tw-h-1 
              tw-w-full 
              tw-bg-white/30
              ${fadeOut ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}
            `}
            style={{ transform: 'translateX(-100%)' }}
          />
        </div>
      ))}
    </div>
  )
}

export default NotificationComponent
