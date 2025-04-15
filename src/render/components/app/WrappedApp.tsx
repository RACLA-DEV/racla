import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import { useNotificationSystem } from '../../hooks/useNotifications'
import { createLog } from '../../libs/logging'
import { RootState } from '../../store'
import {
  setIsLoggedIn,
  setSettingData,
  setSongData,
  setUserData,
  setVArchiveUserData,
} from '../../store/slices/appSlice'
import { NotificationContainer } from '../ui/Notification'
import { ThemeProvider } from '../ui/ThemeProvider'
import ExternalLinkModal from './ExternalLinkModal'
import LoadingSkeleton from './LoadingSkeleton'

export default function WrappedApp() {
  const { theme } = useSelector((state: RootState) => state.ui)
  const [isLoading, setIsLoading] = useState(true)
  const [isOverlayMode, setIsOverlayMode] = useState(false)
  const location = useLocation()
  const { notifications, removeNotification } = useNotificationSystem()
  const dispatch = useDispatch()

  // 곡 데이터 로드 함수
  const loadSongDataFromAPI = useCallback(async (gameCode: string) => {
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
        throw new Error(`API 요청 실패: ${response.status}`)
      }

      const data = await response.json()

      // 곡 데이터 저장 (Redux 및 로컬)
      dispatch(setSongData({ data, gameCode }))

      if (window.electron && window.electron.saveSongData) {
        createLog(
          'info',
          `${gameCode} 저장 전 데이터 타입: ${typeof data}, 배열 여부: ${Array.isArray(data)}, 길이: ${data?.length || 0}`,
        )

        // gameCode와 data가 뒤바뀌지 않도록 확인
        if (!Array.isArray(data)) {
          await createLog('error', `${gameCode} 곡 데이터가 배열이 아님:`, data)
          return data
        }

        await window.electron.saveSongData({ gameCode, songData: data })
      }

      createLog('info', `${gameCode} 곡 데이터 로드 및 저장 완료`)
      return data
    } catch (error) {
      await createLog('error', `${gameCode} 곡 데이터 로드 실패:`, error)

      // 로컬에 저장된 데이터 로드 시도
      try {
        if (window.electron && window.electron.loadSongData) {
          const localData = await window.electron.loadSongData(gameCode)
          if (localData && localData.length > 0) {
            dispatch(setSongData({ data: localData, gameCode }))
            await createLog('info', `${gameCode} 로컬 곡 데이터 로드 완료`)
            return localData
          }
        }
      } catch (localError) {
        await createLog('error', `${gameCode} 로컬 곡 데이터 로드 실패:`, localError)
      }

      return null
    }
  }, [])

  // 모든 게임 데이터 로드
  const loadAllSongData = useCallback(async () => {
    const games = ['djmax_respect_v', 'wjmax', 'platina_lab']
    const promises = games.map((game) => loadSongDataFromAPI(game))
    await Promise.allSettled(promises)
  }, [loadSongDataFromAPI])

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

      // 서버에서 데이터 로드 및 초기화 로직
      const initializeApp = async () => {
        // 1. 설정 로드
        try {
          if (window.electron && window.electron.loadSettings) {
            const settings = await window.electron.loadSettings()
            dispatch(setSettingData(settings))
            createLog('info', '설정 로드됨:', settings)
          }
        } catch (error) {
          createLog('error', '설정 로드 실패:', error)
        }

        // 2. 세션 데이터 로드 및 자동 로그인
        try {
          if (window.electron && window.electron.getSession) {
            const session = await window.electron.getSession()
            if (session && session.userNo && session.userToken) {
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
                    userName: session.vArchiveUserName || '',
                    userNo: session.vArchiveUserNo,
                    userToken: session.vArchiveUserToken,
                  }),
                )
              }

              dispatch(setIsLoggedIn(true))
            }
          }
        } catch (error) {
          createLog('error', '세션 로드 실패:', error)
        }

        // 3. 곡 데이터 로드
        await loadAllSongData()
      }

      // 앱 초기화 실행
      if (isLoading) {
        initializeApp()
      }

      // 5분마다 곡 데이터 리프레시
      const songRefreshInterval = setInterval(
        () => {
          createLog('info', '5분 주기 곡 데이터 새로고침 중...')
          loadAllSongData()
        },
        5 * 60 * 1000,
      ) // 5분마다 실행

      return () => {
        // 이벤트 리스너 정리
        clearInterval(songRefreshInterval)
      }
    }
  }, [dispatch, location.pathname, loadAllSongData])

  // 페이지 로드 및 오버레이 감지
  useEffect(() => {
    // 오버레이 모드 감지
    const isOverlayPath = location.pathname == '/overlay'
    setIsOverlayMode(isOverlayPath)

    // 로딩 상태 처리
    if (isOverlayPath) {
      // 오버레이 모드일 때는 로딩 화면 바로 숨김
      setIsLoading(false)
    } else {
      // 일반 모드일 때는 지연 후 로딩 숨김
      setTimeout(() => {
        setTimeout(() => {
          setIsLoading(false)
        }, 500)
      }, 2000)
    }
  }, [location.pathname])

  return (
    <ThemeProvider>
      {!isOverlayMode && <LoadingSkeleton theme={theme} isLoading={isLoading} />}

      {/* 하위 라우트 렌더링 */}
      {!isLoading && <Outlet />}

      {/* 알림 컴포넌트 (오버레이 모드가 아닐 때만 표시) */}
      {!isOverlayMode && (
        <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      )}

      {/* 외부 링크 모달 (오버레이 모드가 아닐 때만 표시) */}
      {!isOverlayMode && <ExternalLinkModal theme={theme} />}
    </ThemeProvider>
  )
}
