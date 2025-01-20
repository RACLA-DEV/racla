import { useEffect, useState } from 'react'
import Image from 'next/image'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'
import { FaCircleCheck, FaCircleInfo, FaCircleXmark, FaCrown } from 'react-icons/fa6'
import { useSelector } from 'react-redux'

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
        // title이 있는 경우 최대 2개, 없는 경우 1개만 유지
        if (data.title) {
          return prev.length === 0 ? [newNotification] : [newNotification, prev[0]]
        }
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

  const patternToCode = (pattern: string) => {
    switch (pattern) {
      case 'DPC':
        return 'DPC'
      case 'SC':
        return 'SC'
      case 'MAXIMUM':
      case 'MX':
        return 'MX'
      case 'HARD':
      case 'HD':
        return 'HD'
      case 'NORMAL':
      case 'NM':
        return 'NM'
    }
  }

  const codeToPatternName = (pattern: string) => {
    switch (pattern) {
      case 'DPC':
        return '거짓말'
      case 'SC':
        return '민수'
      case 'MAXIMUM':
      case 'MX':
        return '왁굳'
      case 'HARD':
      case 'HD':
        return '엔젤'
      case 'NORMAL':
      case 'NM':
        return '메시'
    }
  }

  const fontFamily = useSelector((state: any) => state.ui.fontFamily)

  return (
    <div
      className={`tw-flex tw-h-screen tw-p-3 tw-pb-5 tw-justify-end tw-items-center tw-w-full tw-flex-col tw-gap-2 ${fontFamily}`}
    >
      <div className='tw-flex tw-max-w-[600px] tw-flex-col tw-gap-2 tw-items-center tw-justify-end'>
        {notifications.map(({ data, id }) =>
          data.message ? (
            <div
              key={id}
              className={`${data.color}
            tw-min-w-[400px] tw-cursor-pointer tw-text-sm tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg
          ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'}`}
            >
              <div className='tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-center'>
                <div className='tw-flex tw-items-center tw-justify-center tw-h-14 tw-w-12 tw-min-h-14 tw-min-w-12 tw-max-h-14 tw-max-w-12'>
                  <IconContext.Provider value={{ size: '36px', className: 'tw-text-gray-200' }}>
                    {String(data.color).includes('lime') ? (
                      <FaCircleCheck />
                    ) : String(data.color).includes('blue') ? (
                      <FaCircleInfo />
                    ) : String(data.color).includes('amber') ? (
                      <FaCrown />
                    ) : (
                      <FaCircleXmark />
                    )}
                  </IconContext.Provider>
                </div>
                <div className='tw-flex tw-flex-col tw-gap-1'>
                  <div className='tw-flex tw-gap-3'>
                    <span className='tw-text-sm tw-font-bold tw-text-gray-200 tw-break-keep'>
                      {data.message}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50 
            ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}`}
                style={{ transform: 'translateX(-100%)' }}
              />
            </div>
          ) : data.gameCode == 'djmax_respect_v' ? (
            <div
              key={id}
              className={`respect_dlc_${data.songData.dlcCode} respect_dlc_logo_${data.songData.dlcCode} respect_dlc_logo_BG_${data.songData.dlcCode}
tw-min-w-[400px] tw-cursor-pointer tw-text-sm tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg
${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'}`}
            >
              <div className='tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md tw-z-0'>
                <Image
                  src={`/images/djmax_respect_v/jackets/${data.songData.title}.jpg`}
                  layout='fill'
                  objectFit='cover'
                  alt=''
                  className='tw-opacity-75 tw-blur-xl'
                />
              </div>
              <div className='tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-75 tw-items-center'>
                <Image
                  loading='lazy'
                  blurDataURL={globalDictionary.blurDataURL}
                  src={`/images/djmax_respect_v/jackets/${data.songData.title}.jpg`}
                  alt='title'
                  width={60}
                  height={60}
                  className='tw-rounded-lg'
                />
                <div className='tw-flex tw-flex-col tw-gap-1 tw-flex-1'>
                  <span className='tw-text-lg tw-font-bold'>{data.songData.name}</span>
                  <div className='tw-flex tw-gap-3 tw-flex-1 tw-items-center'>
                    <span className='tw-text-sm tw-font-bold tw-text-gray-200'>{data.button}B</span>
                    <span className='tw-text-sm tw-font-bold tw-text-gray-200'>{data.pattern}</span>
                    {data.score === 100 ? (
                      <span className='tw-text-sm tw-font-bold tw-text-gray-200'>PERFECT</span>
                    ) : (
                      <>
                        <span className='tw-text-sm tw-font-bold tw-text-gray-200'>
                          {Number(data.score).toFixed(String(data.score).includes('.') ? 2 : 2)}%
                        </span>
                        <span className='tw-text-sm tw-font-bold tw-text-gray-200 tw-me-auto'>
                          {data.maxCombo === 1 ? 'MAX COMBO' : ''}
                        </span>
                      </>
                    )}
                    {data.lastScore ? (
                      parseFloat(data.lastScore) < parseFloat(data.score) ? (
                        <span className='tw-text-sm tw-font-extrabold tw-text-red-500 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                          {Number(parseFloat(data.score) - parseFloat(data.lastScore)).toFixed(2)}%
                          상승
                        </span>
                      ) : parseFloat(data.lastScore) == parseFloat(data.score) ? (
                        <span className='tw-text-sm tw-font-extrabold tw-text-gray-200 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                          점수 변동 없음
                        </span>
                      ) : (
                        <span className='tw-text-sm tw-font-extrabold tw-text-blue-500 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                          {Number(parseFloat(data.score) - parseFloat(data.lastScore)).toFixed(2)}%
                          하락
                        </span>
                      )
                    ) : parseFloat(data.score) > 0 ? (
                      <span className='tw-text-sm tw-font-extrabold tw-text-amber-500 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                        신규 기록!
                      </span>
                    ) : (
                      <span className='tw-text-sm tw-font-extrabold tw-text-gray-200 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                        기록 없음
                      </span>
                    )}
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
              className={`wjmax_dlc_${data.songData.dlcCode} wjmax_dlc_logo_${data.songData.dlcCode} wjmax_dlc_logo_BG_${data.songData.dlcCode}
          tw-min-w-[400px] tw-cursor-pointer tw-text-sm tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg
          ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'}`}
            >
              <div className='tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md tw-z-0'>
                <Image
                  src={`/images/wjmax/jackets/${data.songData.folderName}.jpg`}
                  layout='fill'
                  objectFit='cover'
                  alt=''
                  className='tw-opacity-75 tw-blur-xl'
                />
              </div>
              <div className='tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-950 tw-bg-opacity-75 tw-items-center tw-relative tw-z-10'>
                <Image
                  loading='lazy' // "lazy" | "eager"
                  blurDataURL={globalDictionary.blurDataURL}
                  src={`/images/wjmax/jackets/${data.songData.folderName}.jpg`}
                  alt='title'
                  width={113}
                  height={60}
                  className='tw-rounded-lg'
                />
                <div className='tw-flex tw-flex-col tw-gap-1 tw-flex-1'>
                  <span className='tw-text-lg tw-font-bold'>{data.songData.name}</span>
                  <div className='tw-flex tw-gap-3 tw-flex-1 tw-items-center'>
                    <span className='tw-text-sm tw-font-bold tw-text-gray-200'>
                      {data.button}B{Number(data.judgementType) == 1 ? '+' : ''}
                    </span>
                    <span className='tw-text-sm tw-font-bold tw-text-gray-200'>
                      {codeToPatternName(patternToCode(data.pattern))}
                    </span>
                    {data.score === 100 ? (
                      <span className='tw-text-sm tw-font-bold tw-text-gray-200'>PERFECT</span>
                    ) : (
                      <>
                        <span className='tw-text-sm tw-font-bold tw-text-gray-200'>
                          {Number(data.score).toFixed(String(data.score).includes('.') ? 2 : 2)}%
                        </span>
                        <span className='tw-text-sm tw-font-bold tw-text-gray-200 tw-me-auto'>
                          {data.maxCombo === 1 ? 'MAX COMBO' : ''}
                        </span>
                      </>
                    )}
                    {data.lastScore ? (
                      parseFloat(data.lastScore) < parseFloat(data.score) ? (
                        <span className='tw-text-sm tw-font-extrabold tw-text-red-500 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                          {Number(parseFloat(data.score) - parseFloat(data.lastScore)).toFixed(2)}%
                          상승
                        </span>
                      ) : parseFloat(data.lastScore) == parseFloat(data.score) ? (
                        <span className='tw-text-sm tw-font-extrabold tw-text-gray-200 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                          점수 변동 없음
                        </span>
                      ) : (
                        <span className='tw-text-sm tw-font-extrabold tw-text-blue-500 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                          {Number(parseFloat(data.score) - parseFloat(data.lastScore)).toFixed(2)}%
                          하락
                        </span>
                      )
                    ) : (
                      <span className='tw-text-sm tw-font-extrabold tw-text-amber-500 tw-px-2 tw-py-1 tw-text-shadow-outline'>
                        신규 기록!
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-z-10 tw-bg-white tw-bg-opacity-50 
            ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}`}
                style={{ transform: 'translateX(-100%)' }}
              />
            </div>
          ),
        )}
      </div>
    </div>
  )
}

export default Overlay
