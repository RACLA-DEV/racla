import { Icon } from '@iconify/react'
import ScorePopupComponent from '@render/components/score/ScorePopup'
import { createOverlayLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { OcrPlayDataResponse } from '@src/types/dto/ocr/OcrPlayDataResponse'
import { AnimatePresence, motion } from 'framer-motion'
import type { Result } from 'get-windows'
import apiClient from '../../../libs/apiClient'

import { setSettingData } from '@render/store/slices/appSlice'
import { setTheme } from '@render/store/slices/uiSlice'
import { SongData } from '@src/types/games/SongData'
import { SettingsData } from '@src/types/settings/SettingData'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

// dayjs 플러그인 확장
dayjs.extend(utc)
dayjs.extend(timezone)

// 오버레이 모드 타입 정의
type OverlayMode = 'debug' | 'transparent' | 'minimal' | 'full'

// 알림 타입 정의
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'debug'

// 알림 인터페이스 정의
interface OverlayNotification {
  id: string
  message: string
  type: NotificationType
  duration?: number
  isRemoving?: boolean
  mode: 'i18n' | 'default'
  props?: Record<string, string>
}

interface HardArchiveRecord {
  nickname: string
  max_combo: boolean
  rate: number
  score: number
}

interface HardArchiveRecord {
  code: string
  data: HardArchiveRecord[]
}

interface RecentRecord {
  historyId: number
  playedAt: number
  playedAtISO: string
  score: number
  maxCombo: boolean
  judgementType: string

  // 게임 정보
  gameCode: string

  // 패턴 정보
  keyType: string
  difficultyType: string
  level: number
  floor: number

  // 곡 정보
  songId: number
  songName: string
  composer: string
  dlcCode: string
  dlc: string
  folderName: string
  max: number
}

function OverlayPage() {
  const { t, i18n } = useTranslation(['overlay'])
  const [activeWindows, setActiveWindows] = useState<Result | undefined>(undefined)
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(
    process.env.NODE_ENV === 'development' ? 'debug' : 'transparent',
  )
  const [result, setResult] = useState<OcrPlayDataResponse | undefined>(undefined)
  const { font } = useSelector((state: RootState) => state.app.settingData)
  const isOverlayMode = useSelector((state: RootState) => state.ui.isOverlayMode)
  const { theme } = useSelector((state: RootState) => state.ui)
  const fontSetting = useSelector((state: RootState) => state.app.settingData?.font)

  // 결과 표시 상태 관리
  const [showResult, setShowResult] = useState(false)
  const [isResultRemoving, setIsResultRemoving] = useState(false)
  const RESULT_DISPLAY_DURATION = 6000 // 6초 동안 표시

  // 알림 상태 관리
  const [notifications, setNotifications] = useState<OverlayNotification[]>([])

  // 기록 데이터 상태 관리
  const [recentHistory, setRecentHistory] = useState<RecentRecord[]>([])
  const [hardScore, setHardScore] = useState<HardArchiveRecord | null>(null)
  const [maxScore, setMaxScore] = useState<HardArchiveRecord | null>(null)
  const [showRecordsOverlay, setShowRecordsOverlay] = useState(false)
  const [recordsRemoving, setRecordsRemoving] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)

  const dispatch = useDispatch()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    if (fontSetting) {
      root.classList.remove('font-default')
      root.classList.remove('font-platina_lab')
      root.classList.add(`font-${fontSetting}`)
    }
  }, [fontSetting])

  const fetchHardArchiveRecord = async (
    button: string,
    level: number,
    songId: string,
    judge: 'hard' | 'max',
  ) => {
    try {
      if (songId) {
        const response = await apiClient.getProxy<HardArchiveRecord>(
          `https://hard-archive.com/api/v2/record?button=${button}B&lv=SC${level}&judge=${judge}&song=${songId}`,
        )
        const data = response.data.data.data
        createOverlayLog('debug', 'fetchHardArchiveRecord', data)
        // 전체 데이터 객체 반환 (rate와 max_combo 포함)
        if (data && data.length > 0 && data[0] && typeof data[0].rate === 'number') {
          return data[0]
        } else {
          return null
        }
      } else {
        return null
      }
    } catch (error) {
      createOverlayLog('error', `${judge} 판정 최고 점수 조회 실패:`, error)
      return null
    }
  }

  const fetchRecentRecord = async (
    gameCode: string,
    songTitle: string,
    button: string,
    pattern: string,
  ) => {
    const session = await window.electron?.getSession()
    try {
      const response = await apiClient.get<RecentRecord[]>(
        `/v3/racla/play/history/${session.playerId}/${gameCode}/${songTitle}/${String(button).replace('B', '')}B/${pattern}`,
        {
          headers: {
            Authorization: `${session.playerId}|${session.playerToken}`,
          },
          withCredentials: true,
        },
      )
      createOverlayLog('debug', 'fetchRecentRecord', response.data.data)
      return response.data.data
    } catch (error) {
      createOverlayLog(
        'error',
        `${gameCode} ${songTitle} ${button} ${pattern} 최근 기록 조회 실패:`,
        error,
      )
      return null
    }
  }

  // 패턴 레벨 가져오기 함수
  const getCurrentPatternLevel = (songData: SongData, buttonType: string, patternType: string) => {
    return songData.patterns[buttonType][patternType].level
  }

  // 패턴 코드 변환 함수
  const patternToCode = (pattern: string) => {
    if (pattern === 'SC' || pattern === 'STANDARD' || pattern === 'NORMAL') return 'SC'
    if (pattern === 'MX' || pattern === 'MAXIMUM' || pattern === 'HARD') return 'MX'
    return pattern
  }

  // 알림 추가 함수
  const addNotification = (
    message: string,
    type: NotificationType = 'info',
    duration = 5000,
    mode: 'i18n' | 'default' = 'default',
    props?: Record<string, string>,
  ) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newNotification: OverlayNotification = {
      id,
      message,
      type,
      duration,
      mode,
      props,
    }

    setNotifications((prev) => [...prev, newNotification])

    // 일정 시간 후 알림 제거
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  // 알림 제거 함수
  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, isRemoving: true } : notification,
      ),
    )

    // 애니메이션 완료 후 실제 제거
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    }, 500)
  }

  // 곡 기록 데이터 로드
  const loadRecordsData = async (resultData: OcrPlayDataResponse, settings: SettingsData) => {
    setIsDataLoading(true)
    let hasRecords = false

    // 최근 기록 가져오기
    if (settings.recentOverlay) {
      try {
        const recentData = await fetchRecentRecord(
          resultData.gameCode,
          String(resultData.songData.title),
          String(resultData.button),
          resultData.pattern,
        )

        if (recentData) {
          setRecentHistory(recentData)
          hasRecords = true
        } else {
          setRecentHistory([])
        }
      } catch (error) {
        createOverlayLog('error', '최근 기록 로드 실패:', error)
        setRecentHistory([])
      }
    }

    // 전일 아카이브 기록 가져오기 (DJMAX RESPECT V 게임 코드인 경우에만)
    if (settings.hjaOverlay && resultData.gameCode === 'djmax_respect_v') {
      const currentLevel = getCurrentPatternLevel(
        resultData.songData,
        `${resultData.button}B`,
        resultData.pattern,
      )

      // SC 패턴이고 레벨이 8 이상인 경우에만 조회
      if (patternToCode(resultData.pattern) === 'SC' && currentLevel && Number(currentLevel) >= 8) {
        try {
          // HARD 판정 데이터 가져오기
          const hardData = await fetchHardArchiveRecord(
            String(resultData.button).replace('B', ''),
            Number(currentLevel),
            String(resultData.songData.uuid),
            'hard',
          )

          if (hardData && typeof hardData.rate === 'number') {
            setHardScore(hardData)
            hasRecords = true
          } else {
            setHardScore(null)
          }

          // MAX 판정 데이터 가져오기
          const maxData = await fetchHardArchiveRecord(
            String(resultData.button).replace('B', ''),
            Number(currentLevel),
            String(resultData.songData.uuid),
            'max',
          )

          if (maxData && typeof maxData.rate === 'number') {
            setMaxScore(maxData)
            hasRecords = true
          } else {
            setMaxScore(null)
          }
        } catch (error) {
          createOverlayLog('error', '전일 아카이브 데이터 로드 실패:', error)
          setHardScore(null)
          setMaxScore(null)
        }
      }
    }

    setIsDataLoading(false)

    // 기록이 하나라도 있으면 오버레이 표시
    if (hasRecords) {
      setShowRecordsOverlay(true)
      setRecordsRemoving(false)

      // 일정 시간 후 기록 화면 숨기기
      setTimeout(() => {
        setRecordsRemoving(true)
        setTimeout(() => {
          setShowRecordsOverlay(false)
        }, 1000) // 애니메이션 지속 시간 후 실제로 숨김
      }, RESULT_DISPLAY_DURATION - 1000) // 애니메이션 시작 1초 전에 준비
    }
  }

  useEffect(() => {
    // 문서 스타일 설정
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'

    const searchParams = new URLSearchParams(window.location.search)
    const mode = searchParams.get('mode') as OverlayMode
    if (['debug', 'transparent', 'minimal', 'full'].includes(mode)) {
      setOverlayMode(mode)
    }

    // 활성 윈도우 초기 로드
    if (window.electron?.getActiveWindows) {
      window.electron.getActiveWindows().then((result) => {
        setActiveWindows(result as Result)
      })
    }

    // 오버레이 메시지 수신
    if (window.electron?.onOverlayMessage) {
      window.electron.onOverlayMessage((message) => {
        try {
          const data = JSON.parse(message)
          if (data.type === 'active-windows') {
            setActiveWindows(data.data as Result)
            // setIsMaximized(data.isMaximized)
          } else if (data.type === 'notification') {
            // 알림 메시지 처리
            window.electron?.loadSettings().then((settings) => {
              dispatch(setSettingData(settings))
              dispatch(setTheme(settings.theme))
            })
            if (data.message && data.notificationType) {
              addNotification(
                data.message,
                data.notificationType as NotificationType,
                data.duration || 5000,
                data.mode || 'default',
                data?.props || {},
              )
            }
          }
        } catch (error) {
          createOverlayLog('error', 'Failed to parse message:', error.message)
        }
      })
    }

    if (window.electron?.onOverlayResult) {
      window.electron.onOverlayResult((data) => {
        window.electron?.loadSettings().then((settings) => {
          if (settings.resultOverlay) {
            createOverlayLog('debug', 'Overlay Result:', data)
            setResult(data)

            // 결과 화면 표시 설정
            setShowResult(true)
            setIsResultRemoving(false)

            // 일정 시간 후 결과 화면 숨기기
            setTimeout(() => {
              setIsResultRemoving(true)
              setTimeout(() => {
                setShowResult(false)
              }, 1000) // 애니메이션 지속 시간 후 실제로 숨김
            }, RESULT_DISPLAY_DURATION - 1000) // 애니메이션 시작 1초 전에 준비

            addNotification('successParsePlayResult', 'success', 5000, 'i18n')
          }

          // 기록 데이터 로드 및 표시
          if (
            settings.recentOverlay ||
            (settings.hjaOverlay && data.gameCode === 'djmax_respect_v')
          ) {
            void loadRecordsData(data, settings)
          }
        })
      })
    }
  }, [])

  // 알림 타입에 따른 스타일 및 아이콘 반환 함수
  const getNotificationStyles = (type: NotificationType) => {
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
      info: {
        background: 'tw:bg-blue-500',
        iconName: 'lucide:info',
        iconColor: 'tw:text-blue-500',
        bgColor: theme === 'dark' ? 'tw:bg-blue-900/20' : 'tw:bg-blue-100',
      },
      debug: {
        background: 'tw:bg-pink-500',
        iconName: 'lucide:info',
        iconColor: 'tw:text-pink-500',
        bgColor: theme === 'dark' ? 'tw:bg-pink-900/20' : 'tw:bg-pink-100',
      },
    }

    return typeStyles[type]
  }

  // 현재 언어에 따른 시간대 가져오기
  const getTimezoneByLocale = () => {
    const locale = i18n.language || 'en_US'
    // 한국어와 일본어인 경우 UTC+9 반환
    if (locale === 'ko_KR' || locale === 'ja_JP') {
      return 'Asia/Seoul'
    }
    // 기본적으로는 UTC 반환
    return 'UTC'
  }

  // 날짜 형식화 함수
  const formatDateTime = (timestamp: string) => {
    const timezone = getTimezoneByLocale()
    // 서버에서 이미 UTC+9로 보내주므로, 한국/일본어가 아닌 경우 9시간을 뺌
    let adjustedTime = timestamp
    if (timezone === 'UTC') {
      adjustedTime = dayjs(timestamp).subtract(9, 'hour').format('YYYY-MM-DD HH:mm:ss')
    }

    const timeStr = dayjs(adjustedTime).format('YYYY-MM-DD HH:mm:ss')
    const timezoneStr = timezone === 'UTC' ? 'UTC' : 'UTC+9'
    return `${timeStr} (${timezoneStr})`
  }

  return (
    <div
      className={`tw:flex tw:flex-col tw:gap-2 tw:h-full tw:w-full tw:relative tw:bg-transparent tw:p-2`}
    >
      {overlayMode == 'debug' && (
        <>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              width: 'auto',
              maxWidth: '400px',
            }}
            className={font != 'default' ? 'tw:font-medium' : ''}
          >
            <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>활성 윈도우</h2>
            {activeWindows ? (
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{activeWindows.title}</div>
                {activeWindows.owner && (
                  <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>
                    <div>{activeWindows.owner.name}</div>
                    <div>PID: {activeWindows.owner.processId}</div>
                    <div>Overlay Mode: {String(isOverlayMode)}</div>
                  </div>
                )}
              </div>
            ) : (
              <div>활성 윈도우 없음</div>
            )}
          </div>
        </>
      )}
      {/* 알림 컨테이너 */}
      <div className='tw:fixed tw:right-4 tw:bottom-4 tw:z-[99999999] tw:space-y-2'>
        <AnimatePresence>
          {notifications.slice(-5).map((notification, index) => {
            const { background, iconName, iconColor, bgColor } = getNotificationStyles(
              notification.type,
            )

            return (
              <motion.div
                key={notification.id}
                className='tw:flex tw:text-xs tw:w-full tw:max-w-sm tw:overflow-hidden tw:rounded-lg tw:shadow-lg tw:mt-2'
                initial={{ opacity: 0, x: 300 }}
                animate={{
                  opacity: notification.isRemoving ? 0 : 1,
                  x: notification.isRemoving ? 300 : 0,
                  transition: { duration: 0.5 },
                }}
                exit={{ opacity: 0, x: 300 }}
                style={{ zIndex: 1000 - index }}
              >
                <div className='tw:flex-grow tw:bg-white tw:dark:bg-slate-900 tw:py-2 tw:px-1'>
                  <div className='tw:flex tw:items-center tw:py-2 tw:px-3'>
                    <div className='tw:flex-shrink-0 tw:mr-2'>
                      <div
                        className={`tw:flex tw:items-center tw:w-4 tw:h-4 tw:justify-center tw:rounded-sm ${bgColor}`}
                      >
                        <Icon icon={iconName} className={`tw:w-3 tw:h-3 ${iconColor}`} />
                      </div>
                    </div>

                    <div className='tw:flex-grow tw:min-w-0 tw:pr-1'>
                      <p className='tw:text-xs tw:leading-tight tw:text-slate-800 tw:dark:text-slate-200 tw:break-keep tw:whitespace-pre-wrap'>
                        {notification.mode === 'i18n'
                          ? t(notification.message, {
                              ...(notification.props ? notification.props : {}),
                            })
                          : notification.message}
                      </p>
                    </div>
                  </div>

                  {notification.duration && notification.duration > 0 && (
                    <div className='tw:flex tw:justify-end tw:h-0.5 tw:w-full tw:bg-slate-200 tw:dark:bg-slate-700'>
                      <div
                        className={`tw:h-full ${background} tw:rounded-none`}
                        style={{
                          width: '100%',
                          transition: `width ${notification.duration / 1000}s linear`,
                          animation: `shrinkWidth ${notification.duration / 1000}s linear forwards`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      {/* 결과 기록 오버레이 */}
      <AnimatePresence>
        {showRecordsOverlay && result && !isDataLoading && (
          <motion.div
            className='tw:fixed tw:left-4 tw:bottom-4 tw:z-[99999997]'
            initial={{ opacity: 0, x: -50 }}
            animate={{
              opacity: recordsRemoving ? 0 : 1,
              x: recordsRemoving ? -50 : 0,
              transition: { duration: 0.8, ease: 'easeOut' },
            }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className='tw:flex tw:flex-col tw:gap-2'>
              {/* 최근 기록 */}
              {recentHistory.length > 0 && (
                <div className='tw:bg-white tw:dark:bg-slate-900 tw:rounded-lg tw:overflow-hidden tw:shadow-lg tw:border tw:border-slate-200 tw:dark:border-white/10 tw:w-[280px]'>
                  <div className='tw:p-3'>
                    <div className='tw:flex tw:items-center tw:gap-2 tw:mb-2'>
                      {/* <Icon icon='lucide:database' className='tw:w-4 tw:h-4 tw:text-blue-500' /> */}
                      <span className='tw:text-sm tw:font-bold tw:text-blue-500'>최근 기록</span>
                    </div>

                    <div className='tw:flex tw:flex-col tw:gap-2'>
                      {recentHistory.slice(0, 5).map((history) => (
                        <div
                          key={history.historyId}
                          className='tw:bg-slate-100 tw:dark:bg-slate-800 tw:rounded tw:p-2 tw:flex tw:flex-col tw:gap-1'
                        >
                          {/* <div className='tw:flex tw:items-center tw:gap-1.5'>
                            <div className='tw:px-1.5 tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:min-w-[40px] tw:text-center'>
                              <span className='tw:text-xs tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
                                {history.keyType}
                              </span>
                            </div>
                            <div className='tw:px-1.5 tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:min-w-[50px] tw:text-center'>
                              <span className='tw:text-xs tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
                                {history.difficultyType}
                              </span>
                            </div>
                          </div> */}

                          <div className='tw:flex tw:justify-between tw:items-center'>
                            <div className='tw:text-sm tw:font-bold tw:text-slate-800 tw:dark:text-white'>
                              {Number(history.score).toFixed(2)}%
                              {history.maxCombo && (
                                <span className='tw:text-xs tw:font-bold tw:text-amber-500 tw:dark:text-amber-400 tw:ml-1'>
                                  (MAX COMBO)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                            {formatDateTime(history.playedAtISO)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 전일 아카이브 기록 */}
              {(hardScore ?? maxScore) && (
                <div className='tw:bg-white tw:dark:bg-slate-900 tw:rounded-lg tw:overflow-hidden tw:shadow-lg tw:border tw:border-slate-200 tw:dark:border-white/10 tw:w-[280px]'>
                  <div className='tw:p-3'>
                    <div className='tw:flex tw:items-center tw:gap-2 tw:mb-2'>
                      {/* <Icon
                        icon='lucide:crown'
                        className='tw:w-4 tw:h-4 tw:text-amber-500 tw:dark:text-amber-400'
                      /> */}
                      <span className='tw:text-sm tw:font-bold tw:text-amber-500 tw:dark:text-amber-400'>
                        전일 기록
                      </span>
                    </div>

                    <div className='tw:flex tw:flex-col tw:gap-2'>
                      {hardScore.rate && (
                        <div className='tw:bg-slate-100 tw:dark:bg-slate-800 tw:rounded tw:p-2 tw:flex tw:flex-col tw:gap-1'>
                          {/* <div className='tw:flex tw:items-center tw:gap-1.5'>
                            <div className='tw:px-1.5 tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:min-w-[40px] tw:text-center'>
                              <span className='tw:text-xs tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
                                {result?.button}B
                              </span>
                            </div>
                            <div className='tw:px-1.5 tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:min-w-[50px] tw:text-center'>
                              <span className='tw:text-xs tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
                                {result?.pattern}
                              </span>
                            </div>
                            <div className='tw:px-1.5 tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-center'>
                              <span className='tw:text-xs tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
                                HARD JUDGE
                              </span>
                            </div>
                          </div> */}

                          <div className='tw:flex tw:justify-between tw:items-center'>
                            <div className='tw:text-sm tw:font-bold tw:text-slate-800 tw:dark:text-white'>
                              {Number(hardScore.rate).toFixed(2)}%
                              {hardScore.max_combo && (
                                <span className='tw:text-xs tw:font-bold tw:text-amber-500 tw:dark:text-amber-400 tw:ml-1'>
                                  (MAX COMBO)
                                </span>
                              )}
                            </div>
                            {/* {hardScore.nickname && (
                              <div className='tw:text-xs tw:font-bold tw:text-gray-400'>
                                {hardScore.nickname}
                              </div>
                            )} */}
                          </div>
                          <div className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                            HARD JUDGE
                          </div>
                        </div>
                      )}

                      {maxScore.rate && (
                        <div className='tw:bg-slate-100 tw:dark:bg-slate-800 tw:rounded tw:p-2 tw:flex tw:flex-col tw:gap-1'>
                          {/* <div className='tw:flex tw:items-center tw:gap-1.5'>
                            <div className='tw:px-1.5 tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:min-w-[40px] tw:text-center'>
                              <span className='tw:text-xs tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
                                {result?.button}B
                              </span>
                            </div>
                            <div className='tw:px-1.5 tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:min-w-[50px] tw:text-center'>
                              <span className='tw:text-xs tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
                                {result?.pattern}
                              </span>
                            </div>
                            <div className='tw:px-1.5 tw:rounded tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-center'>
                              <span className='tw:text-xs tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
                                MAX JUDGE
                              </span>
                            </div>
                          </div> */}

                          <div className='tw:flex tw:justify-between tw:items-center'>
                            <div className='tw:text-sm tw:font-bold tw:text-slate-800 tw:dark:text-white'>
                              {Number(maxScore.rate).toFixed(2)}%
                              {maxScore.max_combo && (
                                <span className='tw:text-xs tw:font-bold tw:text-amber-500 tw:dark:text-amber-400 tw:ml-1'>
                                  (MAX COMBO)
                                </span>
                              )}
                            </div>
                            {/* {maxScore.nickname && (
                              <div className='tw:text-xs tw:font-bold tw:text-gray-400'>
                                {maxScore.nickname}
                              </div>
                            )} */}
                          </div>
                          <div className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                            MAX JUDGE
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 결과 표시 컨테이너 */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            className='tw:fixed tw:bottom-4 tw:left-1/2 tw:transform tw:-translate-x-1/2 tw:z-[99999998]'
            initial={{ opacity: 0, y: 50 }}
            animate={{
              opacity: isResultRemoving ? 0 : 1,
              y: isResultRemoving ? 50 : 0,
              transition: { duration: 0.8, ease: 'easeOut' },
            }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className='tw:flex tw:bg-white tw:dark:bg-slate-900 tw:rounded-lg tw:overflow-hidden tw:shadow-lg tw:border tw:border-slate-200 tw:dark:border-white/10'>
              {/* 왼쪽 이미지 영역 - 높이를 오른쪽 영역에 맞추기 위해 self-stretch 추가 */}
              <div className='tw:self-stretch tw:min-w-[70px] tw:flex tw:items-center tw:justify-center tw:bg-gradient-to-br tw:from-slate-100 tw:to-slate-200 tw:dark:from-slate-800 tw:dark:to-slate-900 tw:p-3'>
                {/* 패턴 이미지 */}
                <div className='tw:w-20 tw:h-20 tw:rounded-full tw:bg-gradient-to-br tw:from-purple-500 tw:to-blue-600 tw:flex tw:items-center tw:justify-center'>
                  <ScorePopupComponent songTitle={result.songData.title} keyMode={result.pattern} />
                </div>
              </div>

              {/* 오른쪽 정보 영역 */}
              <div className='tw:w-[280px] tw:p-3 tw:flex tw:gap-1 tw:flex-col tw:justify-between'>
                {/* 상단 곡 정보 */}
                <div>
                  {/* 제목 - 더 넓게 표시 */}
                  <h3 className='tw:text-lg tw:font-bold tw:text-slate-800 tw:dark:text-white tw:line-clamp-1'>
                    {result.songData.name}
                  </h3>

                  {/* 아티스트 */}
                  <p className='tw:text-sm tw:text-slate-600 tw:dark:text-gray-300 tw:line-clamp-1'>
                    {result.songData.artist}
                  </p>

                  {/* 점수 */}
                  <div className='tw:flex tw:justify-between tw:items-center'>
                    <span className='tw:text-lg tw:font-bold tw:text-slate-800 tw:dark:text-white'>
                      {result.score}%
                    </span>
                    <div className='tw:flex tw:space-x-1'>
                      {/* 퍼펙트 타입 */}
                      {result.score == 100.0 && (
                        <span className='tw:text-xs tw:py-0.5 tw:px-1.5 tw:bg-purple-600 tw:text-white tw:rounded'>
                          PERFECT
                        </span>
                      )}
                      {result.maxCombo && (
                        <span className='tw:text-xs tw:py-0.5 tw:px-1.5 tw:bg-lime-500 tw:text-white tw:rounded'>
                          MAX COMBO
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 하단 부가 정보 */}
                <div>
                  {/* 난이도 정보 */}
                  <div className='tw:flex tw:flex-wrap tw:gap-1.5'>
                    <div className='tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:text-slate-800 tw:dark:text-slate-200 tw:bg-slate-200 tw:dark:bg-slate-700'>
                      {result.button}B
                    </div>
                    <div
                      className={`tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:text-slate-800 tw:dark:text-slate-200 tw:bg-slate-200 tw:dark:bg-slate-700`}
                    >
                      {result.pattern}
                    </div>
                    {result.songData.patterns?.[result.button + 'B']?.[result.pattern] && (
                      <div className='tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:text-slate-800 tw:dark:text-slate-200 tw:bg-slate-200 tw:dark:bg-slate-700'>
                        Lv.{result.songData.patterns?.[result.button + 'B']?.[result.pattern].level}
                      </div>
                    )}
                    {result.max && result.score == 100.0 && (
                      <div className='tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:text-slate-800 tw:dark:text-slate-200 tw:bg-slate-200 tw:dark:bg-slate-700'>
                        MAX-{result.max}
                      </div>
                    )}
                  </div>
                </div>

                {/* 시간 프로그레스 바 */}
                <div className='tw:mt-3 tw:w-full tw:h-0.5 tw:bg-slate-200 tw:dark:bg-slate-700 tw:rounded'>
                  <div
                    className='tw:h-full tw:bg-blue-500 tw:rounded'
                    style={{
                      width: '100%',
                      animation: `shrinkWidth ${RESULT_DISPLAY_DURATION / 1000}s linear forwards`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 프로그레스 바 애니메이션을 위한 스타일 */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export default OverlayPage
