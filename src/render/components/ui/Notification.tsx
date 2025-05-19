import { Icon } from '@iconify/react'
import { RootState } from '@render/store'
import type { NotificationProps } from '@src/types/notifications/NotificationProps'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

// 애니메이션 스타일을 정의
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(200%) skewX(-12deg);
  }
}
`

// 알림 컴포넌트
export function Notification({ notification, onRemove, index }: NotificationProps) {
  const { id, message, type, isRemoving, updateInfo } = notification
  const { theme } = useSelector((state: RootState) => state.ui)
  const { t } = useTranslation([
    'common',
    'settings',
    'languages',
    'games',
    'menu',
    'home',
    'db',
    'board',
    'feedback',
    'overlay',
    'ranking',
    'regScore',
  ])

  // 타입에 따른 스타일 및 아이콘 설정
  const getTypeStyles = () => {
    const typeStyles = {
      success: {
        background: 'tw:bg-green-500',
        iconName: 'lucide:check-circle',
        iconColor: 'tw:text-green-500',
        bgColor: theme === 'dark' ? 'tw:bg-green-900/20' : 'tw:bg-green-100',
      },
      error: {
        background: 'tw:bg-red-500',
        iconName: 'lucide:x-circle',
        iconColor: 'tw:text-red-500',
        bgColor: theme === 'dark' ? 'tw:bg-red-900/20' : 'tw:bg-red-100',
      },
      warning: {
        background: 'tw:bg-amber-500',
        iconName: 'lucide:alert-circle',
        iconColor: 'tw:text-amber-500',
        bgColor: theme === 'dark' ? 'tw:bg-amber-900/20' : 'tw:bg-amber-100',
      },
      update: {
        background: 'tw:bg-purple-500',
        iconName: 'lucide:download',
        iconColor: 'tw:text-purple-500',
        bgColor: theme === 'dark' ? 'tw:bg-purple-900/20' : 'tw:bg-purple-100',
      },
      info: {
        background: 'tw:bg-blue-500',
        iconName: 'lucide:info',
        iconColor: 'tw:text-blue-500',
        bgColor: theme === 'dark' ? 'tw:bg-blue-900/20' : 'tw:bg-blue-100',
      },
    }

    // 유효한 타입인지 확인하고 기본값 제공
    return type && typeof type === 'string' && type in typeStyles
      ? typeStyles[type]
      : typeStyles.info
  }

  const { background, iconName, iconColor, bgColor } = getTypeStyles()

  // 애니메이션 스타일 요소를 헤더에 추가
  useEffect(() => {
    // 기존 스타일이 있는지 확인
    const existingStyle = document.getElementById('shimmer-animation-style')
    if (!existingStyle) {
      const styleElement = document.createElement('style')
      styleElement.id = 'shimmer-animation-style'
      styleElement.textContent = shimmerKeyframes
      document.head.appendChild(styleElement)
    }
    return () => {
      // 컴포넌트 언마운트 시 스타일 제거 (필요한 경우)
      // 단, 다른 컴포넌트에서도 사용할 수 있으므로 여기서는 제거하지 않습니다.
    }
  }, [])

  // 업데이트 알림 클릭 핸들러
  const handleUpdateClick = () => {
    if (type === 'update' && updateInfo?.isDownloaded) {
      window.electron.updateApp()
    }
  }

  // 일반 알림과 업데이트 알림 분기
  if (type === 'update') {
    return (
      <motion.div
        id={`notification-${id}`}
        className={`tw:flex tw:text-sm tw:w-full tw:max-w-sm tw:overflow-hidden tw:rounded-lg tw:shadow-lg tw:mt-2 ${
          updateInfo?.isDownloaded ? 'tw:cursor-pointer' : 'tw:cursor-default'
        }`}
        initial={{ opacity: 0, x: 300 }}
        animate={{
          opacity: isRemoving ? 0 : 1,
          x: isRemoving ? 300 : 0,
          transition: { duration: 0.5 },
        }}
        exit={{ opacity: 0, x: 300 }}
        style={{ zIndex: 1000 - index }}
        onClick={handleUpdateClick}
      >
        <div className='tw:flex-grow tw:w-full tw:bg-white tw:dark:bg-slate-900'>
          <div className='tw:flex tw:items-center tw:pt-3 tw:px-4'>
            <div className='tw:flex-shrink-0 tw:mr-2'>
              <div
                className={`tw:flex tw:items-center tw:w-5 tw:h-5 tw:justify-center tw:rounded-sm ${bgColor}`}
              >
                <Icon
                  icon={updateInfo?.isDownloaded ? 'lucide:rocket' : 'lucide:download'}
                  className={`tw:w-4 tw:h-4 ${iconColor}`}
                />
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
              onClick={(e) => {
                e.stopPropagation()
                onRemove(id)
              }}
              className='tw:ml-2 tw:flex-shrink-0 tw:text-slate-400 tw:hover:text-slate-500 tw:focus:outline-none tw:dark:text-slate-500 tw:dark:hover:text-slate-400'
            >
              <Icon icon='lucide:x' className='tw:w-4 tw:h-4' />
            </button>
          </div>

          {!updateInfo?.isDownloaded ? (
            <div className='tw:mt-2 tw:flex tw:justify-start tw:h-1 tw:w-full tw:relative tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:overflow-hidden'>
              <div className={`tw:h-full ${background} tw:rounded`} style={{ width: '100%' }}>
                <div
                  className='shimmer-effect'
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '30%',
                    height: '100%',
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transform: 'skewX(-12deg)',
                    animation: 'shimmer 2s infinite linear',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className='tw:mt-2 tw:flex tw:justify-start tw:h-1 tw:w-full tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700'>
              <div
                className={`tw:h-full ${background} tw:rounded tw:transition-all tw:duration-300`}
                style={{ width: '100%' }}
              ></div>
            </div>
          )}

          {updateInfo?.isDownloaded && (
            <div className='tw:mt-2 tw:mb-2 tw:text-center tw:text-xs tw:text-purple-600 tw:dark:text-purple-400'>
              {t('update.clickToUpdate', { ns: 'common' })}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

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
      style={{ zIndex: 1000 - index }}
    >
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

        <div className='tw:mt-2 tw:flex tw:justify-end tw:h-1 tw:w-full tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700'>
          <div
            className={`tw:h-full ${background} tw:rounded tw:transition-all tw:duration-300`}
            style={{ width: `100%` }}
          ></div>
        </div>
      </div>
    </motion.div>
  )
}
