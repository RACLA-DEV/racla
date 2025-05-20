import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import type { NotificationContainerProps } from '@src/types/render/NotificationContainerProps'
import { AnimatePresence, motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { Notification } from './Notification'

// 알림 목록 컴포넌트
export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  // 업데이트 알림과 일반 알림 분리
  const updateNotifications = notifications.filter((notification) => notification.type === 'update')
  const regularNotifications = notifications.filter(
    (notification) => notification.type !== 'update',
  )

  // 업데이트 알림이 있는지 여부를 로깅
  createLog(
    'debug',
    `NotificationContainer: 업데이트 알림 ${updateNotifications.length}개, 일반 알림 ${regularNotifications.length}개`,
  )

  // 일반 알림은 최대 5개까지만 표시
  const visibleRegularNotifications = regularNotifications.slice(-5)
  const { isLoading } = useSelector((state: RootState) => state.app)

  return (
    <div
      className={`tw:fixed tw:right-2 tw:bottom-10 tw:z-[99999999] tw:space-y-2 tw:transition-opacity tw:duration-300 ${isLoading ? 'tw:opacity-0 tw:pointer-events-none' : 'tw:opacity-100'}`}
    >
      <AnimatePresence>
        {/* 업데이트 알림은 항상 먼저 표시 */}
        {updateNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Notification notification={notification} onRemove={onRemove} index={index} />
          </motion.div>
        ))}

        {/* 일반 알림 표시 */}
        {visibleRegularNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Notification
              notification={notification}
              onRemove={onRemove}
              index={updateNotifications.length + index}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
