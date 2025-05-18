import { globalDictionary } from '@render/constants/globalDictionary'
import { useAlert } from '@render/hooks/useAlert'
import { useAuth } from '@render/hooks/useAuth'
import { addOcrResult } from '@render/store/slices/appSlice'
import { setOverlayMode, setSidebarCollapsed } from '@render/store/slices/uiSlice'
import { GameType } from '@src/types/games/GameType'
import { SongData } from '@src/types/games/SongData'
import { SessionData } from '@src/types/sessions/SessionData'
import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import apiClient from '../../../libs/apiClient'
import { useNotificationSystem } from '../../hooks/useNotifications'
import { createLog } from '../../libs/logger'
import { RootState } from '../../store'
import {
  setIsLoading,
  setIsLoggedIn,
  setIsSetting,
  setRefresh,
  setSelectedGame,
  setSettingData,
  setSongData,
  setUserData,
} from '../../store/slices/appSlice'
import { ThemeProvider } from '../ui/ThemeProvider'

// 지연 로딩을 위한 컴포넌트 임포트
const NotificationContainer = lazy(() =>
  import('../ui/Notification').then((module) => ({ default: module.NotificationContainer })),
)
const ExternalLinkModal = lazy(() => import('./ExternalLinkModal'))
const LoadingSkeleton = lazy(() => import('./LoadingSkeleton'))
const SettingModal = lazy(() => import('./SettingModal'))
const TrackMakerModal = lazy(() => import('../track-maker/TrackMakerModal'))
const AlertModal = lazy(() => import('./AlertModal'))

// 하드코딩된 배열 대신 타입에서 유효한 게임 배열 생성
const VALID_GAMES: GameType[] = globalDictionary.supportGameList as GameType[]

export default function WrappedApp() {
  const { isLoading, settingData, isTrackMaker, refresh } = useSelector(
    (state: RootState) => state.app,
  )
  const { isOverlayMode, alertModal } = useSelector((state: RootState) => state.ui)
  const location = useLocation()
  const { notifications, removeNotification, showNotification } = useNotificationSystem()
  const { handleConfirm, hideAlert } = useAlert()
  const dispatch = useDispatch()
  const { logout } = useAuth()
  const [updateNotificationId, setUpdateNotificationId] = useState<string | null>(null)
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const { i18n } = useTranslation()

  // 앱 초기화 상태를 추적하는 ref를 컴포넌트 최상위 레벨로 이동
  const appInitialized = React.useRef(false)
  // 업데이트 이벤트 리스너 등록 여부를 추적하는 ref
  const listenersRegistered = React.useRef(false)

  // 업데이트 관련 이벤트 리스너
  useEffect(() => {
    // electron 객체가 없으면 실행하지 않음
    if (!window.electron) {
      createLog('warn', '업데이트 이벤트 리스너 등록 실패: electron 객체 없음')
      return
    }

    // 이미 등록된 경우 중복 실행 방지 (전역 플래그 사용)
    if (listenersRegistered.current) {
      createLog(
        'debug',
        settingData.language === 'ko_KR'
          ? '업데이트 이벤트 리스너가 이미 등록되어 있습니다. 중복 등록 방지'
          : 'Update event listeners are already registered. Preventing duplicate registration.',
      )
      return
    }

    // 처음 등록 시에만 기록 (두 번째 실행부터는 위 조건으로 차단됨)
    createLog(
      'debug',
      settingData.language === 'ko_KR'
        ? '업데이트 이벤트 리스너 등록 시작 (첫 번째 실행)'
        : 'Starting update event listener registration (first run)',
    )

    try {
      // 업데이트 가용 시 이벤트 리스너
      const updateAvailableHandler = (version: string) => {
        createLog('info', '업데이트 가용 이벤트 수신됨:', version)
        const id = uuidv4()
        setUpdateNotificationId(id)
        setUpdateVersion(version)

        // 기존 디스패치 대신 showNotification 사용
        showNotification(
          {
            mode: 'i18n',
            value: 'update.updateAvailable',
            ns: 'common',
            props: { version },
          },
          'update',
          0, // 자동 제거 안함
          { version },
        )
      }

      // 다운로드 진행 상황 이벤트 리스너
      const downloadProgressHandler = (progress: {
        percent: number
        transferred: number
        total: number
      }) => {
        createLog('info', '업데이트 다운로드 진행 상황 이벤트 수신됨:', progress)
        if (updateNotificationId) {
          // 기존 알림 업데이트 사용
          showNotification(
            {
              mode: 'i18n',
              value: 'update.downloading',
              ns: 'common',
              props: {
                version: updateVersion,
                percent: String(Math.round(progress.percent || 0)),
              },
            },
            'update',
            0, // 자동 제거 안함
            { progress },
          )
        } else {
          createLog('warn', '업데이트 다운로드 진행 상황을 표시할 알림 ID가 없음')
        }
      }

      // 업데이트 다운로드 완료 이벤트 리스너
      const updateDownloadedHandler = (version: string) => {
        createLog('info', '업데이트 다운로드 완료 이벤트 수신됨:', version)
        if (updateNotificationId) {
          // 기존 알림 업데이트 사용
          showNotification(
            {
              mode: 'i18n',
              value: 'update.downloaded',
              ns: 'common',
              props: { version },
            },
            'update',
            0, // 자동 제거 안함
            { version, isDownloaded: true },
          )
        } else {
          createLog('warn', '업데이트 다운로드 완료를 표시할 알림 ID가 없음')
        }
      }

      // 초기화 함수 호출 전 로그
      createLog('debug', '업데이트 매니저 초기화 호출 시작')

      // 업데이트 매니저 초기화 (이벤트 연결 전)
      window.electron.initializeUpdate()
      createLog('debug', '업데이트 매니저 초기화 호출 완료')

      // 이벤트 리스너 등록
      if (window.electron.onUpdateAvailable) {
        window.electron.onUpdateAvailable(updateAvailableHandler)
        createLog('debug', 'Update Available 이벤트 리스너 등록됨')
      } else {
        createLog('error', 'onUpdateAvailable 함수가 없음')
      }

      if (window.electron.onDownloadProgress) {
        window.electron.onDownloadProgress(downloadProgressHandler)
        createLog('debug', 'Download Progress 이벤트 리스너 등록됨')
      } else {
        createLog('error', 'onDownloadProgress 함수가 없음')
      }

      if (window.electron.onUpdateDownloaded) {
        window.electron.onUpdateDownloaded(updateDownloadedHandler)
        createLog('debug', 'Update Downloaded 이벤트 리스너 등록됨')
      } else {
        createLog('error', 'onUpdateDownloaded 함수가 없음')
      }

      // 리스너 등록 완료 플래그 설정
      listenersRegistered.current = true
      createLog('debug', '모든 업데이트 이벤트 리스너 등록 완료')
    } catch (error) {
      createLog('error', '업데이트 이벤트 리스너 등록 중 오류 발생:', error)
    }

    // 정리 함수
    return () => {
      // 컴포넌트 언마운트 시 호출되는 정리 함수
      // 실제 이벤트 리스너 제거 로직은 비워둠 - 이벤트 리스너는 앱 생명주기 동안 유지
      createLog('debug', '업데이트 이벤트 리스너 컴포넌트 정리 함수 호출됨')
    }
  }, []) // 의존성 배열을 비워서 한 번만 실행되도록 함

  // 곡 데이터 로드 함수
  const loadSongDataFromAPI = useCallback(async (gameCode: GameType, showNotifications = false) => {
    try {
      let endpoint = ''

      switch (gameCode) {
        case 'djmax_respect_v':
          endpoint = '/v3/racla/songs/djmax_respect_v'
          break
        case 'wjmax':
          endpoint = '/v3/racla/songs/wjmax'
          break
        case 'platina_lab':
          endpoint = '/v3/racla/songs/platina_lab'
          break
        default:
          return null
      }

      const response = await apiClient.get<SongData[]>(endpoint, {
        timeout: 10000,
      })
      if (response.status !== 200) {
        throw new Error(
          settingData.language === 'ko_KR'
            ? `API 요청 실패: ${response.status}`
            : `API request failed: ${response.status}`,
        )
      }

      const data = response.data.data

      // 곡 데이터 저장 (Redux 및 로컬)
      dispatch(setSongData({ data: data, gameCode }))

      if (window.electron?.saveSongData) {
        createLog(
          'info',
          settingData.language === 'ko_KR'
            ? `${gameCode} 저장 전 데이터 타입: ${typeof data}, 배열 여부: ${Array.isArray(data)}, 길이: ${data?.length || 0}`
            : `${gameCode} Saved data type: ${typeof data}, is array: ${Array.isArray(data)}, length: ${data?.length || 0}`,
        )

        // gameCode와 data가 뒤바뀌지 않도록 확인
        if (!Array.isArray(data)) {
          createLog(
            'error',
            settingData.language === 'ko_KR'
              ? `${gameCode} 곡 데이터가 배열이 아님:`
              : `${gameCode} Song data is not an array:`,
            data,
          )
          return data
        }

        await window.electron.saveSongData({ gameCode, songData: data })
      }

      createLog(
        'debug',
        settingData.language === 'ko_KR'
          ? `${gameCode} 곡 데이터 로드 및 저장 완료`
          : `${gameCode} Song data loaded and saved`,
      )
      showNotifications &&
        showNotification(
          {
            mode: 'i18n',
            value: 'database.syncSuccess',
            props: {
              gameName: gameCode
                ? globalDictionary.gameDictionary[
                    gameCode as keyof typeof globalDictionary.gameDictionary
                  ]?.name || ''
                : '',
            },
          },
          'success',
        )
      return data
    } catch (error) {
      createLog('error', `${gameCode} 곡 데이터 로드 실패:`, error.message)
      showNotifications &&
        showNotification(
          {
            mode: 'i18n',
            value: 'database.syncError',
            props: {
              gameName: gameCode
                ? globalDictionary.gameDictionary[
                    gameCode as keyof typeof globalDictionary.gameDictionary
                  ]?.name || ''
                : '',
            },
          },
          'error',
        )

      // 로컬에 저장된 데이터 로드 시도
      try {
        if (window.electron?.loadSongData) {
          const localData = await window.electron.loadSongData(gameCode)
          if (localData && localData.length > 0) {
            dispatch(setSongData({ data: localData, gameCode }))
            createLog('debug', `${gameCode} 로컬 곡 데이터 로드 완료`)
            showNotifications &&
              showNotification(
                {
                  mode: 'i18n',
                  value: 'database.syncLocalSuccess',
                  props: {
                    gameName: gameCode
                      ? globalDictionary.gameDictionary[
                          gameCode as keyof typeof globalDictionary.gameDictionary
                        ]?.name || ''
                      : '',
                  },
                },
                'success',
              )
            return localData
          }
        }
      } catch (localError) {
        createLog('error', `${gameCode} 로컬 곡 데이터 로드 실패:`, localError)
        showNotifications &&
          showNotification(
            {
              mode: 'i18n',
              value: 'database.syncLocalError',
              props: {
                gameName: gameCode
                  ? globalDictionary.gameDictionary[
                      gameCode as keyof typeof globalDictionary.gameDictionary
                    ]?.name || ''
                  : '',
              },
            },
            'error',
          )
      }

      return null
    }
  }, [])

  // 모든 게임 데이터 로드
  const loadAllSongData = useCallback(
    async (showNotifications = false) => {
      const promises = VALID_GAMES.map((game) => loadSongDataFromAPI(game, showNotifications))
      await Promise.allSettled(promises)
    },
    [loadSongDataFromAPI],
  )

  // 오버레이 모드 확인 및 설정
  useEffect(() => {
    // 현재 경로가 'overlay'를 포함하는지 확인
    const isOverlayPath = location.pathname.includes('overlay')
    // createLog('debug', '현재 경로:', location.pathname, '오버레이 모드:', isOverlayPath)

    if (isOverlayPath) {
      // 오버레이 모드일 때 필요한 설정
      document.body.style.backgroundColor = 'transparent'
      document.body.style.overflow = 'hidden'

      // 오버레이 모드에서는 데이터 로드 생략
      return
    } else {
      // 오버레이 모드가 아닐 때는 기본 스타일로 복원
      document.body.style.backgroundColor = ''
      document.body.style.overflow = ''

      // 앱 초기화 실행 (한 번만 실행)
      if (isLoading && !appInitialized.current) {
        appInitialized.current = true // 초기화 상태 설정

        // 앱 초기화 전 지연 시간 추가 (이벤트 핸들러 준비 시간 확보)
        const startInitialization = async () => {
          createLog(
            'debug',
            settingData.language === 'ko_KR'
              ? '🕒 앱 초기화 전 3초 지연 시작...'
              : '🕒 Starting 3 seconds delay before app initialization...',
          )

          // 3초 지연 후 초기화 시작
          await new Promise((resolve) => setTimeout(resolve, 3000))

          createLog(
            'debug',
            settingData.language === 'ko_KR'
              ? '⏰ 지연 완료, 앱 초기화 시작'
              : '⏰ Delay completed, starting app initialization',
          )

          // 초기화 작업 실행
          void initializeApp()
        }

        void startInitialization()
      }

      // 서버에서 데이터 로드 및 초기화 로직
      const initializeApp = async () => {
        createLog(
          'debug',
          settingData.language === 'ko_KR' ? '🚀 앱 초기화 시작' : '🚀 App initialization started',
        )

        // 디스코드와 게임 모니터 초기화 상태 추적
        const servicesInitialized = { discord: false, monitor: false }

        // 디스코드 초기화
        if (!servicesInitialized.discord) {
          createLog(
            'debug',
            settingData.language === 'ko_KR'
              ? '디스코드 매니저 초기화 시작'
              : 'Discord manager initialization started',
          )
          try {
            window.electron.initializeDiscord()
            servicesInitialized.discord = true
            createLog(
              'debug',
              settingData.language === 'ko_KR'
                ? '디스코드 매니저 초기화 완료'
                : 'Discord manager initialization completed',
            )
          } catch (error) {
            createLog(
              'error',
              settingData.language === 'ko_KR'
                ? `디스코드 매니저 초기화 실패: ${error.message}`
                : `Discord manager initialization failed: ${error.message}`,
            )
          }
        }

        // 게임 모니터링 초기화
        if (!servicesInitialized.monitor) {
          createLog(
            'debug',
            settingData.language === 'ko_KR'
              ? '게임 모니터 초기화 시작'
              : 'Game monitor initialization started',
          )
          try {
            window.electron.initializeMonitor()
            servicesInitialized.monitor = true
            createLog(
              'debug',
              settingData.language === 'ko_KR'
                ? '게임 모니터 초기화 완료'
                : 'Game monitor initialization completed',
            )
          } catch (error) {
            createLog(
              'error',
              settingData.language === 'ko_KR'
                ? `게임 모니터 초기화 실패: ${error.message}`
                : `Game monitor initialization failed: ${error.message}`,
            )
          }
        }

        // 설정 모달 상태 초기화
        dispatch(setIsSetting(false))

        try {
          // 1. 설정 로드
          try {
            if (window.electron?.loadSettings) {
              const settings = await window.electron.loadSettings()
              dispatch(setSettingData(settings))
              createLog(
                'debug',
                settingData.language === 'ko_KR' ? '설정 로드됨:' : 'Settings loaded:',
                settings,
              )

              if (['ko_KR', 'en_US', 'ja_JP'].includes(settings.language)) {
                void i18n.changeLanguage(settings.language)
              } else {
                void i18n.changeLanguage('ko_KR')
                dispatch(setSettingData({ ...settings, language: 'ko_KR' }))
                window.electron.saveSettings({ ...settings, language: 'ko_KR' })
              }

              // 설정 로드 후 잠시 지연
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
          } catch (error) {
            createLog(
              'error',
              settingData.language === 'ko_KR' ? '설정 로드 실패:' : 'Settings load failed:',
              error.message,
            )
            // 오류 발생 시에도 계속 진행
            await new Promise((resolve) => setTimeout(resolve, 500))
          }

          // 2. 세션 데이터 로드 및 자동 로그인
          try {
            if (window.electron?.getSession) {
              const session = await window.electron.getSession()

              // 세션 로드 후 잠시 지연
              await new Promise((resolve) => setTimeout(resolve, 300))

              if (session?.playerId && session?.playerToken) {
                try {
                  createLog(
                    'debug',
                    settingData.language === 'ko_KR'
                      ? '세션 데이터가 존재하여 자동 로그인 요청:'
                      : 'Session data exists, requesting auto-login:',
                    session,
                  )

                  const response = await apiClient.post<SessionData>(
                    `/v3/racla/player/login`,
                    {
                      playerId: session.playerId,
                      playerToken: session.playerToken,
                    },
                    {
                      timeout: 10000,
                    },
                  )

                  if (response.status === 200) {
                    const sessionData = response.data.data

                    // API 응답 이후 잠시 지연
                    await new Promise((resolve) => setTimeout(resolve, 300))

                    const success = await window.electron.login({
                      playerId: sessionData.playerId,
                      playerToken: sessionData.playerToken,
                    })
                    if (success) {
                      createLog(
                        'debug',
                        settingData.language === 'ko_KR' ? '로그인 성공:' : 'Login successful:',
                        sessionData,
                      )
                      // 사용자 정보 설정
                      dispatch(setUserData(response.data.data))
                      dispatch(setIsLoggedIn(true))
                      showNotification(
                        {
                          mode: 'i18n',
                          value: 'auth.loginSuccess',
                          props: { userName: sessionData.playerName },
                        },
                        'success',
                      )
                    }
                  } else {
                    createLog(
                      'error',
                      settingData.language === 'ko_KR' ? '세션 로드 실패:' : 'Session load failed:',
                      session,
                    )
                    logout()
                  }
                } catch (error) {
                  createLog(
                    'error',
                    settingData.language === 'ko_KR' ? '로그인 API 오류:' : 'Login API error:',
                    error.message,
                  )
                  logout()
                }
              }
            }
          } catch (error) {
            createLog(
              'error',
              settingData.language === 'ko_KR' ? '세션 로드 실패:' : 'Session load failed:',
              error.message,
            )
            logout()
          }

          // 3. 곡 데이터 로드 이전에 추가 지연
          await new Promise((resolve) => setTimeout(resolve, 1000))

          createLog(
            'debug',
            settingData.language === 'ko_KR' ? '곡 데이터 로드 시작' : 'Starting song data loading',
          )

          // 곡 데이터 로드 (초기 로딩 시에만 알림 표시)
          await loadAllSongData(true)

          createLog(
            'debug',
            settingData.language === 'ko_KR' ? '앱 초기화 완료' : 'App initialization completed',
          )

          dispatch(setIsLoading(false))
        } catch (error) {
          createLog(
            'error',
            settingData.language === 'ko_KR' ? '앱 초기화 실패:' : 'App initialization failed:',
            error.message,
          )

          // 오류가 발생해도 로딩 상태는 해제
          dispatch(setIsLoading(false))
        }
      }

      // 5분마다 곡 데이터 리프레시 (알림 표시 없음)
      const songRefreshInterval = setInterval(
        () => {
          createLog(
            'debug',
            settingData.language === 'ko_KR'
              ? '5분 주기 곡 데이터 새로고침 중...'
              : '5-minute song data refresh in progress...',
          )

          // 재시도 횟수와 지연 설정
          const retryRefresh = async (retries = 2, delayMs = 3000) => {
            try {
              // 곡 데이터 로드 전에 잠시 지연
              await new Promise((resolve) => setTimeout(resolve, delayMs))
              await loadAllSongData(false) // 알림 표시 안함
              createLog(
                'debug',
                settingData.language === 'ko_KR'
                  ? '곡 데이터 새로고침 완료'
                  : 'Song data refresh completed',
              )
            } catch (error) {
              createLog(
                'error',
                settingData.language === 'ko_KR'
                  ? `곡 데이터 새로고침 실패: ${error.message}`
                  : `Song data refresh failed: ${error.message}`,
              )

              // 재시도 로직
              if (retries > 0) {
                createLog(
                  'debug',
                  settingData.language === 'ko_KR'
                    ? `${retries}회 재시도 중...`
                    : `Retrying ${retries} more times...`,
                )
                await new Promise((resolve) => setTimeout(resolve, delayMs * 2))
                await retryRefresh(retries - 1, delayMs)
              }
            }
          }

          void retryRefresh()
        },
        5 * 60 * 1000,
      ) // 5분마다 실행

      return () => {
        // 이벤트 리스너 정리
        clearInterval(songRefreshInterval)
      }
    }
  }, [isLoading, location.pathname, settingData.language])

  // 오버레이 메시지 처리 이벤트 리스너 추가
  useEffect(() => {
    if (!window.electron) return

    // 메인 윈도우 메시지 핸들러
    const mainWindowMessageHandler = (message: string) => {
      try {
        const parsedMessage = JSON.parse(message)

        // OCR 결과 처리
        if (parsedMessage.type === 'ocr-result' && parsedMessage.data) {
          createLog('debug', 'OCR Result:', parsedMessage.data)
          dispatch(addOcrResult(parsedMessage.data))
        }
      } catch (error) {
        createLog('error', 'Main window message parsing error:', error)
      }
    }

    // 오버레이 결과 핸들러
    const overlayResultHandler = (data: any) => {
      if (data) {
        createLog('debug', 'Overlay Result:', data)
        dispatch(addOcrResult(data))
      }
    }

    // 이벤트 리스너 등록
    window.electron.onMainWindowMessage(mainWindowMessageHandler)
    window.electron.onOverlayResult(overlayResultHandler)

    // 정리 함수
    return () => {
      // 이벤트 리스너 정리 (필요하다면 구현)
    }
  }, [dispatch])

  // 페이지 로드 및 오버레이 감지
  useEffect(() => {
    // 오버레이 모드 감지
    const isOverlayPath = location.pathname == '/overlay'
    createLog('debug', 'Overlay Mode:', isOverlayPath)
    dispatch(setOverlayMode(isOverlayPath))
    if (isLoading && isOverlayPath) {
      dispatch(setIsLoading(false))
    }
  }, [])

  useEffect(() => {
    const isTrackMakerPath =
      location.pathname.startsWith('/track-maker') ||
      location.pathname.startsWith('/overlay') ||
      location.pathname.startsWith('/feedback')
    if (isTrackMakerPath) {
      dispatch(setSidebarCollapsed(true))
    } else {
      if (!location.pathname.includes('games')) {
        dispatch(setSidebarCollapsed(false))
      }
    }
    if (location.pathname.includes('djmax_respect_v')) {
      dispatch(setSelectedGame('djmax_respect_v'))
      dispatch(setRefresh(!refresh))
    } else if (location.pathname.includes('wjmax')) {
      dispatch(setSelectedGame('wjmax'))
      dispatch(setRefresh(!refresh))
    } else if (location.pathname.includes('platina_lab')) {
      dispatch(setSelectedGame('platina_lab'))
      dispatch(setRefresh(!refresh))
    }
  }, [location.pathname])

  if (isOverlayMode) {
    return <>{!isLoading && <Outlet />}</>
  } else {
    return (
      <ThemeProvider>
        {!isOverlayMode && <LoadingSkeleton />}

        {/* 하위 라우트 렌더링 */}
        {!isLoading && <Outlet />}

        {/* 알림 컴포넌트 (오버레이 모드가 아닐 때만 표시) */}
        {!isOverlayMode && (
          <Suspense fallback={<div />}>
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
          </Suspense>
        )}

        {/* 외부 링크 모달 (오버레이 모드가 아닐 때만 표시) */}
        {!isOverlayMode && (
          <Suspense fallback={<div />}>
            <ExternalLinkModal />
          </Suspense>
        )}
        {!isOverlayMode && (
          <Suspense fallback={<div />}>
            <SettingModal />
          </Suspense>
        )}
        {!isOverlayMode && isTrackMaker && (
          <Suspense fallback={<div />}>
            <TrackMakerModal />
          </Suspense>
        )}
        {!isOverlayMode && (
          <Suspense fallback={<div />}>
            <AlertModal
              isOpen={alertModal.isOpen}
              onClose={hideAlert}
              title={alertModal.title}
              message={alertModal.message}
              type={alertModal.type}
              confirmMode={alertModal.confirmMode}
              onConfirm={handleConfirm}
              confirmText={alertModal.confirmText}
              cancelText={alertModal.cancelText}
            />
          </Suspense>
        )}
      </ThemeProvider>
    )
  }
}
