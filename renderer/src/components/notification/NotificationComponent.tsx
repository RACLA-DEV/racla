const NotificationComponent = ({ notifications, removeNotificationCallback }) => {
  return (
    <div className="tw-fixed tw-bottom-0 tw-right-2 tw-z-50 tw-max-w-sm tw-break-keep">
      {notifications.map(({ id, message, fadeOut, color }) => (
        <div
          key={id}
          className={`${
            color ? color : `tw-bg-lime-600`
          } tw-cursor-pointer tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-py-3 tw-px-4 tw-mb-2 tw-rounded-lg tw-overflow-hidden tw-shadow-lg ${
            fadeOut ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'
          }`}
          onClick={() => {
            removeNotificationCallback(id)
          }}
        >
          {message}
          <div
            className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50 ${
              fadeOut ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'
            } tw-transition-all tw-duration-1000`}
            style={{ transform: 'translateX(-100%)' }}
          />
        </div>
      ))}
    </div>
  )
}

export default NotificationComponent
