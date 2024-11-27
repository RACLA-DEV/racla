import { globalDictionary } from '@/libs/server/globalDictionary'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { IconContext } from 'react-icons'
import { FaCircleCheck, FaCircleInfo, FaCircleXmark } from 'react-icons/fa6'

const Overlay = () => {
  const [notifications, setNotifications] = useState<Array<{ data: any; id: string }>>([])
  const [fadeOut, setFadeOut] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const handlePlayData = (data: any) => {
      const newNotification = {
        data,
        id: crypto.randomUUID(),
      }

      setNotifications((prev) => {
        // 최대 1개만 유지
        return [newNotification]
      })

      // 각 알림별로 개별 타이머 설정
      setTimeout(() => {
        setFadeOut((prev) => ({ ...prev, [newNotification.id]: true }))
      }, 9500)

      setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== newNotification.id))
        setFadeOut((prev) => {
          const updated = { ...prev }
          delete updated[newNotification.id]
          return updated
        })
      }, 10000)
    }

    window.ipc.on('IPC_RENDERER_GET_NOTIFICATION_DATA', handlePlayData)

    return () => {
      window.ipc.removeListener('IPC_RENDERER_GET_NOTIFICATION_DATA', handlePlayData)
    }
  }, [])

  return (
    <div className="tw-flex tw-h-screen tw-w-full tw-p-3 tw-pb-5 tw-justify-center tw-items-end tw-gap-2">
      {notifications.map(({ data, id }) =>
        data.message ? (
          <div
            key={id}
            className={`${data.color}
          tw-min-w-[400px] tw-max-w-[600px] tw-cursor-pointer tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg
          ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'}`}
          >
            <div className="tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-center">
              <IconContext.Provider value={{ size: '60px', className: 'tw-text-gray-200' }}>
                {String(data.color).includes('lime') ? <FaCircleCheck /> : String(data.color).includes('blue') ? <FaCircleInfo /> : <FaCircleXmark />}
              </IconContext.Provider>
              <div className="tw-flex tw-flex-col tw-gap-1">
                <div className="tw-flex tw-gap-3">
                  <span className="tw-text-sm tw-font-light tw-text-gray-200 tw-break-keep">{data.message}</span>
                </div>
              </div>
            </div>
            <div
              className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50 
            ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}`}
              style={{ transform: 'translateX(-100%)' }}
            />
          </div>
        ) : (
          <div
            key={id}
            className={`respect_dlc_${data.songData.dlcCode} respect_dlc_logo_${data.songData.dlcCode} respect_dlc_logo_BG_${data.songData.dlcCode}
          tw-min-w-[400px] tw-cursor-pointer tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg
          ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'}`}
          >
            <div className="tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-center">
              <Image
                loading="lazy" // "lazy" | "eager"
                blurDataURL={globalDictionary.blurDataURL}
                src={`/images/djmax_respect_v/jackets/${data.songData.title}.jpg`}
                alt="title"
                width={60}
                height={60}
                className="tw-rounded-lg"
              />
              <div className="tw-flex tw-flex-col tw-gap-1 tw-flex-1">
                <span className="tw-text-lg tw-font-bold">{data.songData.name}</span>
                <div className="tw-flex tw-gap-3 tw-flex-1">
                  <span className="tw-text-sm tw-font-light tw-text-gray-200">{data.button}B</span>
                  <span className="tw-text-sm tw-font-light tw-text-gray-200">{data.pattern}</span>
                  {data.score === 100 ? (
                    <span className="tw-text-sm tw-font-light tw-text-gray-200">PERFECT</span>
                  ) : (
                    <>
                      <span className="tw-text-sm tw-font-light tw-text-gray-200">{Number(data.score).toFixed(String(data.score).includes('.') ? 2 : 2)}%</span>
                      <span className="tw-text-sm tw-font-light tw-text-gray-200">{data.maxCombo === 1 ? 'MAX COMBO' : ''}</span>
                    </>
                  )}
                  <span className="tw-ms-auto tw-text-sm tw-font-light tw-text-gray-200">업로드 성공</span>
                </div>
              </div>
            </div>
            <div
              className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50 
            ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}`}
              style={{ transform: 'translateX(-100%)' }}
            />
          </div>
        ),
      )}
    </div>
  )
}

export default Overlay
