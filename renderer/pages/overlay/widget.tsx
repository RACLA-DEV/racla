import { useEffect, useState } from 'react'
import { FaCircleCheck, FaCircleInfo, FaCircleXmark, FaCrown } from 'react-icons/fa6'

import { globalDictionary } from '@/libs/server/globalDictionary'
import axios from 'axios'
import dayjs from 'dayjs'
import Image from 'next/image'
import { IconContext } from 'react-icons'
import { useSelector } from 'react-redux'

const Overlay = ({ isNotificationSound }: { isNotificationSound: boolean }) => {
  const [notifications, setNotifications] = useState<Array<{ data: any; id: string }>>([])
  const [fadeOut, setFadeOut] = useState<{ [key: string]: boolean }>({})

  const fetchHighScore = async (
    button: string,
    level: number,
    songId: string,
    judge: 'hard' | 'max',
  ) => {
    try {
      if (songId) {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_PROXY_API_URL}`, {
          url: `https://hard-archive.com/api/v2/record`,
          queryString: `button=${button}B&lv=SC${level}&judge=${judge}&song=${songId}`,
        })
        const data = response.data.data
        // 전체 데이터 객체 반환 (rate와 max_combo 포함)
        return data[0] || null
      } else {
        return null
      }
    } catch (error) {
      console.error(`${judge} 판정 최고 점수 조회 실패:`, error)
      return null
    }
  }

  // 세션 데이터를 가져오는 함수
  const getSessionData = () => {
    return new Promise((resolve) => {
      const handleSession = (data: any) => {
        window.ipc.removeListener('IPC_RENDERER_GET_SESSION_TO_WIDGET', handleSession)
        resolve(data)
      }

      window.ipc.on('IPC_RENDERER_GET_SESSION_TO_WIDGET', handleSession)
      window.ipc.getSessionToWidget()
    })
  }

  useEffect(() => {
    const handlePlayData = async (data: any) => {
      const sessionData: any = await getSessionData()
      let scoreData = { ...data }

      if (data.gameCode === 'djmax_respect_v') {
        try {
          const currentLevel = getCurrentPatternLevel(
            data.songData,
            `${data.button}B`,
            data.pattern,
          )

          // 하드 아카이브는 SC + 레벨 8이상 조건 체크
          const shouldShowHardArchive =
            patternToCode(data.pattern) === 'SC' && currentLevel && Number(currentLevel) >= 8

          if (shouldShowHardArchive) {
            const [hardScore, maxScore] = await Promise.allSettled([
              fetchHighScore(data.button, currentLevel, data.songData.hardArchiveTitle, 'hard'),
              fetchHighScore(data.button, currentLevel, data.songData.hardArchiveTitle, 'max'),
            ])
            scoreData.hardScore = hardScore.status === 'fulfilled' ? hardScore.value : null
            scoreData.maxScore = maxScore.status === 'fulfilled' ? maxScore.value : null
          }

          // 최근 기록은 difficultyType만 포함하고 레벨 조건 없이 조회
          const recentResponse = await axios.get(
            `https://noah.r-archive.zip/api/v2/play/history/${sessionData.userNo}/${data.gameCode}/${data.songData.title as string}/${String(data.button).replace('B', '')}B/${patternToCode(data.pattern)}`,
            {
              headers: {
                Authorization: `${sessionData.userNo}|${sessionData.userToken}`,
              },
              withCredentials: true,
            },
          )

          scoreData = {
            ...scoreData,
            recentHistory:
              recentResponse.data.success && recentResponse.data.recentHistory.length > 0
                ? recentResponse.data.recentHistory
                : null,
          }
        } catch (error) {
          console.error('점수 조회 중 오류 발생:', error)
          scoreData = {
            ...scoreData,
            hardScore: null,
            maxScore: null,
            recentHistory: null,
          }
        }
      }

      const newNotification = {
        data: scoreData,
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

  const getCurrentPatternLevel = (songData: any, keyMode: string, pattern: string) => {
    if (!songData?.patterns?.[keyMode]) return null

    const patternCode = patternToCode(pattern)
    // 객체에서 직접 패턴 코드로 접근
    const patternData = songData.patterns[keyMode][patternCode]

    return patternData?.level || null
  }

  return (
    <div
      className={`tw-flex tw-h-screen tw-p-3 tw-pb-5 tw-justify-end tw-items-center tw-w-full tw-flex-col tw-gap-2 ${fontFamily}`}
    >
      <div className='tw-flex tw-flex-col tw-gap-2 tw-items-center tw-justify-end tw-min-w-[400px]'>
        {notifications.map(({ data, id }) =>
          data.message ? (
            <div
              key={id}
              className={`${data.color} tw-w-full tw-cursor-pointer tw-text-sm tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'}`}
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
                  <div className='tw-flex tw-gap-3 tw-max-w-[360px]'>
                    <span className='tw-text-sm tw-font-bold tw-text-gray-200 tw-break-keep'>
                      {data.message}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50 ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}`}
                style={{ transform: 'translateX(-100%)' }}
              />
            </div>
          ) : data.gameCode == 'djmax_respect_v' ? (
            <div
              key={id}
              className={`tw-w-full tw-cursor-pointer tw-text-sm tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'}`}
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
              <div className='tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-relative tw-bg-gray-900 tw-bg-opacity-75 tw-items-center tw-z-10'>
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
                className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-z-10 tw-bg-white tw-bg-opacity-50 ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}`}
                style={{ transform: 'translateX(-100%)' }}
              />
            </div>
          ) : (
            <div
              key={id}
              className={`wjmax_dlc_${data.songData.dlcCode} wjmax_dlc_logo_${data.songData.dlcCode} wjmax_dlc_logo_BG_${data.songData.dlcCode} tw-min-w-[400px] tw-cursor-pointer tw-text-sm tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'}`}
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
                className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-z-10 tw-bg-white tw-bg-opacity-50 ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-notificationProgress'}`}
                style={{ transform: 'translateX(-100%)' }}
              />
            </div>
          ),
        )}
      </div>

      {/* 전일 기록 알림 - 별도의 fixed 포지션 */}
      {notifications.map(
        ({ data, id }) =>
          data.gameCode === 'djmax_respect_v' &&
          (() => {
            const currentLevel = getCurrentPatternLevel(
              data.songData,
              `${data.button}B`,
              data.pattern,
            )

            return (
              patternToCode(data.pattern) === 'SC' &&
              currentLevel &&
              Number(currentLevel) >= 8 &&
              (data.hardScore || data.maxScore) && (
                <div
                  key={`archive-${id}`}
                  className={`tw-fixed tw-bottom-4 tw-right-4 tw-bg-gray-900/90 tw-rounded-lg tw-p-3 tw-shadow-lg tw-min-w-[300px] tw-max-w-[300px] ${fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'} `}
                >
                  <div className='tw-flex tw-items-center tw-gap-2 tw-mb-2'>
                    <IconContext.Provider value={{ size: '20px', className: 'tw-text-amber-400' }}>
                      <FaCrown />
                    </IconContext.Provider>
                    <span className='tw-text-sm tw-font-bold tw-text-amber-400'>
                      전일 기록{' '}
                      <sup className='tw-font-light tw-text-gray-200'>Powered by 전일 아카이브</sup>
                    </span>
                  </div>
                  <div className='tw-flex tw-flex-col tw-gap-2'>
                    {data.hardScore && (
                      <div className='tw-bg-gray-600/25 tw-rounded tw-p-2'>
                        <div className='tw-text-xs tw-font-bold tw-text-gray-200'>
                          HARD JUDGEMENT
                        </div>
                        <div className='tw-flex tw-justify-between'>
                          <div className='tw-text-sm tw-font-bold tw-text-gray-200'>
                            {Number(data.hardScore.rate).toFixed(2)}%
                          </div>
                          {data.hardScore.max_combo && (
                            <div className='tw-text-xs tw-font-bold tw-text-amber-400'>
                              MAX COMBO
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {data.maxScore && (
                      <div className='tw-bg-gray-600/25 tw-rounded tw-p-2'>
                        <div className='tw-text-xs tw-font-bold tw-text-gray-200'>
                          MAX JUDGEMENT
                        </div>
                        <div className='tw-flex tw-justify-between'>
                          <div className='tw-text-sm tw-font-bold tw-text-gray-200'>
                            {Number(data.maxScore.rate).toFixed(2)}%
                          </div>
                          {data.maxScore.max_combo && (
                            <div className='tw-text-xs tw-font-bold tw-text-amber-400'>
                              MAX COMBO
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )
          })(),
      )}

      {/* 최근 기록 알림 - 별도의 fixed 포지션 */}
      {notifications.map(
        ({ data, id }) =>
          data.gameCode === 'djmax_respect_v' &&
          data.recentHistory && (
            <div
              key={`recent-${id}`}
              className={`tw-fixed tw-bottom-4 tw-left-4 tw-bg-gray-900/90 tw-rounded-lg tw-p-3 tw-shadow-lg tw-min-w-[300px] tw-max-w-[300px] ${
                fadeOut[id] ? 'tw-animate-fadeOut' : 'tw-animate-fadeIn'
              }`}
            >
              <div className='tw-flex tw-items-center tw-gap-2 tw-mb-2'>
                <IconContext.Provider value={{ size: '20px', className: 'tw-text-blue-400' }}>
                  <FaCircleInfo />
                </IconContext.Provider>
                <span className='tw-text-sm tw-font-bold tw-text-blue-400'>최근 기록</span>
              </div>
              <div className='tw-flex tw-flex-col tw-gap-2'>
                {data.recentHistory.length > 0 ? (
                  // 최대 5개까지만 표시하고 역순으로 정렬
                  [...data.recentHistory]
                    .slice(0, 5)
                    .reverse()
                    .map((history, index) => (
                      <div key={history.historyId} className='tw-bg-gray-600/25 tw-rounded tw-p-2'>
                        <div className='tw-flex tw-flex-col tw-gap-1'>
                          <div className='tw-text-xs tw-font-bold tw-text-gray-200'>
                            {dayjs(history.playedAt).format('YYYY-MM-DD HH:mm:ss')}
                          </div>
                          <div className='tw-flex tw-justify-between tw-items-center'>
                            <div className='tw-text-sm tw-font-bold tw-text-gray-200'>
                              {Number(history.score).toFixed(2)}%
                            </div>
                            {history.maxCombo && (
                              <div className='tw-text-xs tw-font-bold tw-text-amber-400'>
                                MAX COMBO
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className='tw-text-sm tw-text-gray-400 tw-text-center tw-py-2'>
                    RACLA 데이터베이스에 해당 수록곡의 사용자 최근 기록이 없습니다.
                  </div>
                )}
              </div>
            </div>
          ),
      )}
    </div>
  )
}

export default Overlay
