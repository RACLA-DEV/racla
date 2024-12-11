import { useNotificationSystem } from '@/libs/client/useNotifications'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { FaCheck, FaCircleNotch, FaCrown, FaQuestion, FaXmark, FaDownload, FaRotate } from 'react-icons/fa6'
import { useEffect, useState } from 'react'

const NotificationComponent = () => {
  const notifications = useSelector((state: RootState) => state.notification.notifications)
  const { removeNotification } = useNotificationSystem()
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{ percent: string } | null>(null)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const { showNotification } = useNotificationSystem()

  useEffect(() => {
    const handleUpdateAvailable = (info: string) => {
      console.log('update-available', info)
      setUpdateVersion(info)
    }

    const handleDownloadProgress = (info: { percent: string }) => {
      console.log('download-progress', info)
      setDownloadProgress(info)
    }

    const handleUpdateDownloaded = () => {
      console.log('update-downloaded')
      setIsDownloaded(true)
    }

    window.ipc.on('update-available', handleUpdateAvailable)
    window.ipc.on('download-progress', handleDownloadProgress)
    window.ipc.on('update-downloaded', handleUpdateDownloaded)

    return () => {
      window.ipc.removeListener('update-available', handleUpdateAvailable)
      window.ipc.removeListener('download-progress', handleDownloadProgress)
      window.ipc.removeListener('update-downloaded', handleUpdateDownloaded)
    }
  }, [])

  useEffect(() => {
    if (updateVersion) {
      showNotification(`R-ARCHIVE 데스크톱 앱의 업데이트(${updateVersion})가 존재합니다. 자동 업데이트를 준비합니다.`, 'tw-bg-blue-600')
    }
  }, [updateVersion, showNotification])

  const getStatusIcon = (color: string) => {
    switch (color) {
      case 'tw-bg-blue-600':
        return <FaCircleNotch className="tw-animate-spin" />
      case 'tw-bg-lime-600':
        return <FaCheck />
      case 'tw-bg-yellow-700':
        return <FaCrown />
      case 'tw-bg-yellow-600':
        return <FaCrown />
      case 'tw-bg-amber-600':
        return <FaQuestion />
      case 'tw-bg-orange-600':
        return <FaQuestion />
      case 'tw-bg-red-600':
        return <FaXmark />
      default:
        return null
    }
  }

  return (
    <div className="tw-fixed tw-bottom-7 tw-right-2 tw-z-50 tw-break-keep tw-min-w-96 tw-max-w-96 tw-w-96">
      {notifications.map(({ id, message, fadeOut, color, isFinal }) => (
        <div
          key={id}
          className={`
            tw-cursor-pointer 
            tw-text-sc
            tw-relative 
            tw-text-white 
            tw-pt-4
            tw-pb-4 
            tw-px-4 
            tw-mb-3 
            tw-rounded-md 
            tw-overflow-hidden 
            tw-shadow-md
            tw-backdrop-blur-sm
            tw-bg-gray-950/95
            tw-border
            tw-border-white/10
            tw-transform
            ${fadeOut ? 'tw-animate-fadeOutSlideRight tw-pointer-events-none' : 'tw-animate-fadeInSlideRight'}
            hover:tw-scale-102
            hover:tw-brightness-110
            tw-transition-all
            tw-duration-200
            tw-text-xs
          `}
          onClick={() => removeNotification(id)}
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            {color && <div className={`tw-text-sm tw-p-1 tw-rounded-sm tw-bg-white/10 ${isFinal ? 'tw-animate-pulse' : ''}`}>{getStatusIcon(color)}</div>}
            <div className="tw-flex-1">{message}</div>
            <button className="tw-opacity-60 hover:tw-opacity-100">
              <FaXmark />
            </button>
          </div>
          <div
            key={message}
            className={`
              tw-absolute 
              tw-bottom-0 
              tw-left-0 
              tw-h-1 
              tw-w-full 
              ${color ? color : 'tw-bg-white/30'}
              ${fadeOut ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}
            `}
            style={{ transform: 'translateX(-100%)' }}
          />
        </div>
      ))}

      {updateVersion && (
        <div
          className={`
            tw-cursor-pointer 
            tw-text-sc
            tw-relative 
            tw-text-white 
            tw-pt-4
            tw-pb-4 
            tw-px-4 
            tw-mb-3 
            tw-rounded-md 
            tw-overflow-hidden 
            tw-shadow-md
            tw-backdrop-blur-sm
            tw-bg-gray-950/95
            tw-border
            tw-border-white/10
            tw-transform
            tw-animate-fadeInSlideRight
            hover:tw-scale-102
            hover:tw-brightness-110
            tw-transition-all
            tw-duration-200
            tw-text-xs
          `}
          onClick={() => {
            if (isDownloaded) {
              window.ipc.send('update-app')
            }
          }}
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className={`tw-text-sm tw-p-1 tw-rounded-sm tw-bg-white/10 ${isDownloaded ? 'tw-animate-pulse' : ''}`}>
              {isDownloaded ? <FaCheck /> : downloadProgress ? <FaRotate className="tw-animate-spin" /> : <FaDownload />}
            </div>
            <div className="tw-flex-1">
              {isDownloaded ? 'V' + updateVersion + ' 업데이트 준비가 완료 되었습니다.' : downloadProgress ? '업데이트 다운로드 중' : '업데이트 준비 중'}
              <div className="tw-text-xs tw-font-light tw-text-gray-200 tw-text-opacity-50">
                {isDownloaded
                  ? '업데이트 적용을 위해 프로그램 재시작이 필요합니다. 클릭 시 프로그램을 재시작합니다.'
                  : updateVersion && `V${updateVersion}${downloadProgress ? ` (${Math.floor(Number(downloadProgress.percent))}%)` : ''}`}
              </div>
            </div>
          </div>
          <div
            className={`
              tw-absolute 
              tw-bottom-0 
              tw-left-0 
              tw-h-1 
              tw-w-full 
              tw-bg-blue-600
              ${isDownloaded ? 'tw-animate-fadeOut' : ''}
            `}
            style={{
              transform: downloadProgress ? `translateX(-${100 - Math.floor(Number(downloadProgress.percent))}%)` : 'translateX(-100%)',
              transition: 'transform 0.3s ease-in-out',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default NotificationComponent
