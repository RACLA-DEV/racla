import { globalDictionary } from '@render/constants/globalDictionary'
import { useAuth } from '@render/hooks/useAuth'
import { setOverlayMode } from '@render/store/slices/uiSlice'
import { GameType } from '@src/types/common/GameType'
import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react'
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
  setSettingData,
  setSongData,
  setUserData,
  setVArchiveUserData,
} from '../../store/slices/appSlice'
import { ThemeProvider } from '../ui/ThemeProvider'

// 지연 로딩을 위한 컴포넌트 임포트
const NotificationContainer = lazy(() =>
  import('../ui/Notification').then((module) => ({ default: module.NotificationContainer })),
)
const ExternalLinkModal = lazy(() => import('./ExternalLinkModal'))
const LoadingSkeleton = lazy(() => import('./LoadingSkeleton'))
const SettingModal = lazy(() => import('./SettingModal'))

// 하드코딩된 배열 대신 타입에서 유효한 게임 배열 생성
const VALID_GAMES: GameType[] = globalDictionary.supportGameList as GameType[]

export default function WrappedApp() {
  const { isLoading, settingData } = useSelector((state: RootState) => state.app)
  const isOverlayMode = useSelector((state: RootState) => state.ui.isOverlayMode)
  const location = useLocation()
  const { notifications, removeNotification, showNotification } = useNotificationSystem()
  const dispatch = useDispatch()
  const { logout } = useAuth()
  const [updateNotificationId, setUpdateNotificationId] = useState<string | null>(null)
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  // 앱 초기화 상태를 추적하는 ref 추가
  const appInitialized = React.useRef(false)

  // 업데이트 관련 이벤트 리스너
  useEffect(() => {
    if (!window.electron) return

    // 업데이트 초기화 상태 추적을 위한 플래그
    const updateInitialized = { current: false }

    // 업데이트 초기화
    createLog(
      'debug',
      settingData.language === 'ko_KR'
        ? '업데이트 매니저 초기화 시작'
        : 'Update manager initialization started',
    )

    // 한 번만 초기화
    if (!updateInitialized.current) {
      window.electron.initializeUpdate()
      updateInitialized.current = true
      createLog(
        'debug',
        settingData.language === 'ko_KR'
          ? '업데이트 매니저 초기화 완료'
          : 'Update manager initialization completed',
      )
    }

    // 이벤트 리스너 등록 상태 추적을 위한 플래그
    const listenersRegistered = { current: false }

    // 이벤트 리스너 등록 지연 함수
    const registerEventListeners = () => {
      // 이미 등록되었다면 다시 등록하지 않음
      if (listenersRegistered.current) {
        createLog(
          'debug',
          settingData.language === 'ko_KR'
            ? '이벤트 리스너가 이미 등록되어 있습니다.'
            : 'Event listeners are already registered.',
        )
        return
      }

      createLog(
        'debug',
        settingData.language === 'ko_KR'
          ? '업데이트 이벤트 리스너 등록 준비 중...'
          : 'Preparing to register update event listeners...',
      )

      // 이벤트 리스너 등록 전 2초 지연
      setTimeout(() => {
        createLog(
          'debug',
          settingData.language === 'ko_KR'
            ? '업데이트 이벤트 리스너 등록 시작'
            : 'Starting update event listeners registration',
        )

        // 업데이트 가용 시 이벤트 리스너
        const updateAvailableHandler = (version: string) => {
          createLog('info', 'Update Available:', version)
          const id = uuidv4()
          setUpdateNotificationId(id)
          setUpdateVersion(version)
          dispatch({
            type: 'app/addNotification',
            payload: {
              id,
              message: {
                mode: 'i18n',
                value: 'update.updateAvailable',
                ns: 'common',
                props: { version },
              },
              type: 'update',
              updateInfo: { version },
              isRemoving: false,
            },
          })
        }

        // 다운로드 진행 상황 이벤트 리스너
        const downloadProgressHandler = (progress: {
          percent: number
          transferred: number
          total: number
        }) => {
          createLog('info', 'Update Download Progress:', progress)
          if (updateNotificationId) {
            dispatch({
              type: 'app/updateNotification',
              payload: {
                id: updateNotificationId,
                data: {
                  message: {
                    mode: 'i18n',
                    value: 'update.downloading',
                    ns: 'common',
                    props: {
                      version: updateVersion,
                      percent: Math.round(progress.percent),
                    },
                  },
                  updateInfo: { progress },
                },
              },
            })
          }
        }

        // 업데이트 다운로드 완료 이벤트 리스너
        const updateDownloadedHandler = (version: string) => {
          createLog('info', 'Update Downloaded:', version)
          if (updateNotificationId) {
            dispatch({
              type: 'app/updateNotification',
              payload: {
                id: updateNotificationId,
                data: {
                  message: {
                    mode: 'i18n',
                    value: 'update.downloaded',
                    ns: 'common',
                    props: { version },
                  },
                  updateInfo: { version, isDownloaded: true },
                },
              },
            })
          }
        }

        // 이벤트 리스너 등록
        if (window.electron.onUpdateAvailable) {
          window.electron.onUpdateAvailable(updateAvailableHandler)
          createLog('debug', 'Update Available 이벤트 리스너 등록됨')
        }

        if (window.electron.onDownloadProgress) {
          window.electron.onDownloadProgress(downloadProgressHandler)
          createLog('debug', 'Download Progress 이벤트 리스너 등록됨')
        }

        if (window.electron.onUpdateDownloaded) {
          window.electron.onUpdateDownloaded(updateDownloadedHandler)
          createLog('debug', 'Update Downloaded 이벤트 리스너 등록됨')
        }

        // 리스너 등록 완료 플래그 설정
        listenersRegistered.current = true

        createLog(
          'debug',
          settingData.language === 'ko_KR'
            ? '모든 업데이트 이벤트 리스너 등록 완료'
            : 'All update event listeners registration completed',
        )
      }, 2000)
    }

    // 이벤트 리스너 등록 함수 실행
    registerEventListeners()

    // 정리 함수
    return () => {
      // 이벤트 리스너 정리 (필요하다면 구현)
      createLog(
        'debug',
        settingData.language === 'ko_KR'
          ? '업데이트 이벤트 리스너 정리'
          : 'Cleaning up update event listeners',
      )
    }
  }, []) // 의존성 배열을 비워 처음 한 번만 실행되도록 함

  // 곡 데이터 로드 함수
  const loadSongDataFromAPI = useCallback(async (gameCode: GameType, showNotifications = false) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      let endpoint = ''

      switch (gameCode) {
        case 'djmax_respect_v':
          endpoint = '/v2/racla/songs/djmax_respect_v/processed'
          break
        case 'wjmax':
          endpoint = '/v2/racla/songs/wjmax'
          break
        case 'platina_lab':
          endpoint = '/v2/racla/songs/platina_lab'
          break
        default:
          return null
      }

      const response = await fetch(`${apiUrl}${endpoint}`)
      if (!response.ok) {
        throw new Error(
          settingData.language === 'ko_KR'
            ? `API 요청 실패: ${response.status}`
            : `API request failed: ${response.status}`,
        )
      }

      const data = await response.json()

      // 곡 데이터 저장 (Redux 및 로컬)
      dispatch(setSongData({ data, gameCode }))

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

              if (session?.userNo && session?.userToken) {
                try {
                  createLog(
                    'debug',
                    settingData.language === 'ko_KR'
                      ? '세션 데이터가 존재하여 자동 로그인 요청:'
                      : 'Session data exists, requesting auto-login:',
                    session,
                  )

                  const response = await apiClient.post<{
                    userNo: string
                    userToken: string
                    userName?: string
                    discordUid?: string
                    discordLinked?: boolean
                    vArchiveLinked?: boolean
                    vArchiveUserNo?: number
                    vArchiveUserToken?: string
                    vArchiveUserName?: string | { success: boolean; nickname: string }
                  }>(`/v2/racla/user/login`, {
                    userNo: session.userNo,
                    userToken: session.userToken,
                  })

                  if (response.status === 200) {
                    const data = response.data
                    session.userNo = data.userNo
                    session.userToken = data.userToken
                    session.userName = (data.userName ?? session.userName) || ''
                    session.discordUid = (data.discordUid ?? session.discordUid) || ''
                    session.discordLinked = (data.discordLinked ?? session.discordLinked) || false
                    session.vArchiveLinked =
                      (data.vArchiveLinked ?? session.vArchiveLinked) || false
                    session.vArchiveUserNo = (data.vArchiveUserNo ?? session.vArchiveUserNo) || 0
                    session.vArchiveUserToken =
                      (data.vArchiveUserToken ?? session.vArchiveUserToken) || ''
                    session.vArchiveUserName =
                      (data.vArchiveUserName ?? session.vArchiveUserName) || ''
                  }

                  // API 응답 이후 잠시 지연
                  await new Promise((resolve) => setTimeout(resolve, 300))

                  const success = await window.electron.login(session)
                  if (success) {
                    createLog(
                      'debug',
                      settingData.language === 'ko_KR' ? '로그인 성공:' : 'Login successful:',
                      session,
                    )
                    // 사용자 정보 설정
                    dispatch(
                      setUserData({
                        userName: session.userName || '',
                        userNo: session.userNo,
                        userToken: session.userToken,
                        discordUid: session.discordUid || '',
                        discordLinked: session.discordLinked || false,
                        vArchiveLinked: session.vArchiveLinked || false,
                      }),
                    )

                    // V-ARCHIVE 정보 설정
                    if (session.vArchiveUserNo && session.vArchiveUserToken) {
                      dispatch(
                        setVArchiveUserData({
                          userName:
                            typeof session.vArchiveUserName === 'object' &&
                            session.vArchiveUserName?.success
                              ? session.vArchiveUserName.nickname
                              : typeof session.vArchiveUserName === 'string'
                                ? session.vArchiveUserName
                                : '',
                          userNo: session.vArchiveUserNo,
                          userToken: session.vArchiveUserToken,
                        }),
                      )
                    }
                    dispatch(setIsLoggedIn(true))
                    showNotification(
                      {
                        mode: 'i18n',
                        value: 'auth.loginSuccess',
                        props: { userName: session.userName },
                      },
                      'success',
                    )
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
  }, [])

  // 페이지 로드 및 오버레이 감지
  useEffect(() => {
    // 오버레이 모드 감지
    const isOverlayPath = location.pathname == '/overlay'
    createLog('debug', 'Overlay Mode:', isOverlayPath)
    dispatch(setOverlayMode(isOverlayPath))
    if (isLoading && isOverlayPath) {
      dispatch(setIsLoading(false))
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
      </ThemeProvider>
    )
  }
}
