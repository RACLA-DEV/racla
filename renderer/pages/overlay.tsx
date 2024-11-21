import Image from 'next/image'
import { useEffect, useState } from 'react'

const Overlay = () => {
  const [playData, setPlayData] = useState<any>(null)
  const [notification, setNotification] = useState<string>('')
  const [notificationTimer, setNotificationTimer] = useState<NodeJS.Timeout | null>(null)
  const [fadeOut, setFadeOut] = useState<boolean>(false)

  useEffect(() => {
    window.ipc.on('IPC_RENDERER_GET_PLAY_DATA', (data: any) => {
      setPlayData(data)
      setFadeOut(false)

      // 이전 타이머들 모두 제거
      if (notificationTimer) {
        clearTimeout(notificationTimer)
      }

      setNotification(`점수: ${data.score}, 패턴: ${data.pattern}, 버튼: ${data.button}, 타이틀 ID: ${data.songData.title}`)

      // fadeOut 타이머와 알림 제거 타이머를 하나의 객체로 관리
      const fadeOutTimer = setTimeout(() => {
        setFadeOut(true)
      }, 9500)

      const clearTimer = setTimeout(() => {
        setNotification('')
        setFadeOut(false)
        clearTimeout(fadeOutTimer)
      }, 10000)

      setNotificationTimer(clearTimer)
    })

    return () => {
      if (notificationTimer) {
        clearTimeout(notificationTimer)
      }
      window.ipc.removeListener('IPC_RENDERER_GET_PLAY_DATA', (data) => {
        setPlayData(data)
      })
    }
  }, [notificationTimer])

  return (
    <div className="tw-flex tw-h-full tw-w-full tw-p-3">
      {notification && (
        <div
          className={
            `respect_dlc_${playData.songData.dlcCode} respect_dlc_logo_${playData.songData.dlcCode} respect_dlc_logo_BG_${playData.songData.dlcCode}` +
            ` tw-w-[600px] tw-cursor-pointer tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-mb-2 tw-rounded-lg tw-overflow-hidden tw-shadow-lg ${
              fadeOut ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'
            }`
          }
        >
          <div className="tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-end">
            <Image src={`/images/djmax_respect_v/jackets/${playData.songData.title}.jpg`} alt="title" width={60} height={60} className="tw-rounded-lg" />
            <div className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-lg tw-font-bold">{playData.songData.name}</span>
              <div className="tw-flex tw-gap-3">
                <span className="tw-text-sm tw-font-light tw-text-gray-200">{playData.button}B</span>
                <span className="tw-text-sm tw-font-light tw-text-gray-200">{playData.pattern}</span>
                {playData.score === 100 ? (
                  <span className="tw-text-sm tw-font-light tw-text-gray-200">PERFECT</span>
                ) : (
                  <>
                    <span className="tw-text-sm tw-font-light tw-text-gray-200">{playData.score}%</span>
                    <span className="tw-text-sm tw-font-light tw-text-gray-200">{playData.maxCombo === 1 ? `MAX COMBO` : ''}</span>
                  </>
                )}
                <span className="tw-text-sm tw-font-light tw-text-gray-200">업로드 성공</span>
              </div>
            </div>
          </div>
          <div
            className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50 ${
              fadeOut ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'
            } tw-transition-all tw-duration-1000`}
            style={{ transform: 'translateX(-100%)' }}
          />
        </div>
      )}
    </div>
  )
}

export default Overlay
