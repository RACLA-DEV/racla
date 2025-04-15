import { useCallback, useEffect, useState } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { Outlet, RouterProvider, useLocation } from 'react-router-dom'
import { SyncLoader } from 'react-spinners'
import { PersistGate } from 'redux-persist/integration/react'
import './App.css'
import { NotificationContainer } from './components/ui/Notification'
import { ThemeProvider } from './components/ui/ThemeProvider'
import { globalDictionary } from './constants/globalDictionary'
import { useNotificationSystem } from './hooks/useNotifications'
import { createLog } from './libs/logging'
import { router } from './routes'
import { persistor, RootState, store } from './store'
import {
  setIsLoggedIn,
  setSettingData,
  setSongData,
  setUserData,
  setVArchiveUserData,
} from './store/slices/appSlice'

// 프로세스 정보를 위한 타입 정의
interface ProcessDescriptor {
  pid: number
  name: string
  cmd?: string
  ppid?: number
  [key: string]: any
}

// 외부 링크 모달 컴포넌트
const ExternalLinkModal = ({
  url,
  isOpen,
  onClose,
  onConfirm,
  theme,
}: {
  url: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  theme: string
}) => {
  // 모달 외부 클릭 처리
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // ESC 키 누름 감지
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])

  return (
    <div
      className={`tw:fixed tw:inset-0 tw:z-[9999] tw:transition-opacity tw:duration-300 ${
        isOpen ? 'tw:opacity-100 tw:pointer-events-auto' : 'tw:opacity-0 tw:pointer-events-none'
      }`}
    >
      <div
        className={`tw:fixed tw:inset-0 ${theme === 'dark' ? 'tw:bg-slate-950/90' : 'tw:bg-indigo-50/90'}`}
        onClick={handleBackdropClick}
      />
      <div className='tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center'>
        <div
          className={`tw:p-6 tw:rounded-lg tw:shadow-lg tw:max-w-md tw:w-full tw:mx-4 tw:transition-all tw:duration-300 ${
            isOpen ? 'tw:opacity-100 tw:translate-y-0' : 'tw:opacity-0 tw:translate-y-4'
          } ${
            theme === 'dark'
              ? 'tw:bg-slate-800 tw:text-slate-200'
              : 'tw:bg-white tw:text-indigo-950'
          }`}
        >
          <h3 className='tw:text-lg tw:font-bold tw:mb-4 tw:text-center'>외부 링크 열기</h3>
          <p className='tw:mb-6 tw:text-center tw:font-light tw:text-sm'>
            이 링크는 사용자의 브라우저에서 열립니다.
            <br />
            신뢰할 수 있는 링크인지 확인 후 이동해주세요.
          </p>
          <div
            className={`tw:mb-6 tw:h-20 tw:overflow-y-auto tw:rounded tw:p-2 ${
              theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-50'
            }`}
          >
            <p
              className={`tw:break-all tw:text-sm ${
                theme === 'dark' ? 'tw:text-blue-400' : 'tw:text-blue-600'
              }`}
            >
              {url}
            </p>
          </div>
          <div className='tw:flex tw:justify-end tw:gap-2'>
            <button
              className={`tw:px-4 tw:py-1.5 tw:text-sm tw:rounded tw:cursor-pointer ${
                theme === 'dark'
                  ? 'tw:bg-slate-700 hover:tw:bg-slate-600'
                  : 'tw:bg-indigo-100 hover:tw:bg-indigo-200'
              }`}
              onClick={onClose}
            >
              취소
            </button>
            <button
              className={`tw:px-4 tw:py-1.5 tw:text-sm tw:rounded tw:cursor-pointer tw:text-white ${
                theme === 'dark'
                  ? 'tw:bg-blue-600 hover:tw:bg-blue-700'
                  : 'tw:bg-indigo-600 hover:tw:bg-indigo-700'
              }`}
              onClick={onConfirm}
            >
              열기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 로딩 스켈레톤 컴포넌트
const LoadingSkeleton = ({ theme, isLoading }: { theme: string; isLoading: boolean }) => {
  return (
    <div
      className={`tw:fixed tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center tw:z-[1000000] tw:transition-all tw:duration-1000 ${
        isLoading ? 'tw:opacity-100' : 'tw:opacity-0 tw:pointer-events-none'
      } ${theme === 'dark' ? 'tw:bg-slate-900/95' : 'tw:bg-indigo-50/95'}`}
    >
      <div className='tw:flex tw:flex-col tw:gap-8 tw:items-center'>
        <div className='tw:flex tw:items-center tw:justify-center'>
          <div className='tw:animate-pulse tw:flex tw:space-x-4'>
            <div
              className={`tw:h-12 tw:w-12 tw:rounded-full ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
            ></div>
            <div className='tw:flex-1 tw:space-y-4 tw:py-1'>
              <div
                className={`tw:h-4 tw:w-36 tw:rounded ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
              ></div>
              <div className='tw:space-y-2'>
                <div
                  className={`tw:h-4 tw:w-40 tw:rounded ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className='tw:flex tw:flex-col tw:gap-2 tw:items-center'>
          <div
            className={`tw:h-2 tw:w-48 tw:rounded tw:animate-pulse ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
          ></div>
          <div
            className={`tw:h-2 tw:w-32 tw:rounded tw:animate-pulse ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
          ></div>
        </div>

        <div className='tw:flex tw:items-center tw:mt-4'>
          <SyncLoader size={8} color={theme === 'dark' ? '#c3dafe' : '#667eea'} />
        </div>
      </div>

      <div className='tw:absolute tw:bottom-6 tw:left-0 tw:right-0 tw:flex tw:flex-col tw:gap-2 tw:justify-center tw:items-center'>
        <span
          className={`tw:text-xs tw:font-light ${theme === 'dark' ? 'tw:text-slate-400' : 'tw:text-indigo-500'}`}
        >
          Developed by RACLA from 공감대로0번길(GGDRN0 STUDIO)
        </span>
      </div>
    </div>
  )
}

// 초기화 및 데이터 로드를 담당하는 컴포넌트
const InitializeApp = () => {
  const dispatch = useDispatch()
  const location = useLocation()

  // 곡 데이터 로드 함수
  const loadSongDataFromAPI = useCallback(
    async (gameCode: string) => {
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
    },
    [dispatch],
  )

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
    createLog('info', '현재 경로:', location.pathname, '오버레이 모드:', isOverlayPath)

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

      // 외부 링크 처리 이벤트 설정
      const handleExternalLink = (url: string) => {
        if (window.electron) {
          window.electron.openExternalUrl(url)
        } else if (globalDictionary.openExternalLink) {
          globalDictionary.openExternalLink(url)
        } else {
          window.open(url, '_blank')
        }
      }

      // 1. Electron IPC 이벤트 리스너 등록 (메인 프로세스에서 온 메시지)
      if (window.electron && window.electron.onConfirmExternalLink) {
        window.electron.onConfirmExternalLink(handleExternalLink)
      }

      // 2. globalDictionary 이벤트 리스너 등록 (다른 컴포넌트에서 요청한 경우)
      let cleanup = null
      if (globalDictionary.onExternalLinkRequested) {
        cleanup = globalDictionary.onExternalLinkRequested(handleExternalLink)
      }

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
      initializeApp()

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
        if (cleanup) {
          cleanup()
        }
        clearInterval(songRefreshInterval)
      }
    }
  }, [dispatch, location.pathname, loadAllSongData])

  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}

// Provider 내부에서 사용할 래핑된 앱 컴포넌트
export function WrappedApp() {
  const { theme } = useSelector((state: RootState) => state.ui)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingVisible, setIsLoadingVisible] = useState(true)
  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')
  const [isOverlayMode, setIsOverlayMode] = useState(false)
  const location = useLocation()
  const { notifications, removeNotification } = useNotificationSystem()

  // 페이지 로드 및 오버레이 감지
  useEffect(() => {
    // 오버레이 모드 감지
    const isOverlayPath = location.pathname.includes('overlay')
    setIsOverlayMode(isOverlayPath)

    // 로딩 상태 처리
    if (isOverlayPath) {
      // 오버레이 모드일 때는 로딩 화면 바로 숨김
      setIsLoading(false)
      setIsLoadingVisible(false)
    } else {
      // 일반 모드일 때는 지연 후 로딩 숨김
      setTimeout(() => {
        setIsLoading(false)
        setTimeout(() => {
          setIsLoadingVisible(false)
        }, 500)
      }, 2000)
    }

    // 외부 링크 처리 이벤트 설정
    const handleExternalLink = (url: string) => {
      setExternalUrl(url)
      setShowExternalLinkModal(true)
    }

    // Electron IPC 이벤트 리스너 등록
    if (window.electron && window.electron.onConfirmExternalLink) {
      window.electron.onConfirmExternalLink(handleExternalLink)
    }

    // globalDictionary 이벤트 리스너 등록
    let cleanup = null
    if (globalDictionary.onExternalLinkRequested) {
      cleanup = globalDictionary.onExternalLinkRequested(handleExternalLink)
    }

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [location.pathname])

  // 외부 링크 열기 처리
  const handleOpenExternalLink = () => {
    if (window.electron) {
      window.electron.openExternalUrl(externalUrl)
    } else if (globalDictionary.openExternalLink) {
      globalDictionary.openExternalLink(externalUrl)
    } else {
      window.open(externalUrl, '_blank')
    }
    setShowExternalLinkModal(false)
  }

  return (
    <ThemeProvider>
      {!isOverlayMode && <LoadingSkeleton theme={theme} isLoading={isLoadingVisible} />}

      {/* 앱 초기화 컴포넌트 (UI 없음) */}
      <InitializeApp />

      {/* 하위 라우트 렌더링 */}
      <Outlet />

      {/* 알림 컴포넌트 (오버레이 모드가 아닐 때만 표시) */}
      {!isOverlayMode && (
        <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      )}

      {/* 외부 링크 모달 (오버레이 모드가 아닐 때만 표시) */}
      {!isOverlayMode && (
        <ExternalLinkModal
          url={externalUrl}
          isOpen={showExternalLinkModal}
          onClose={() => setShowExternalLinkModal(false)}
          onConfirm={handleOpenExternalLink}
          theme={theme}
        />
      )}
    </ThemeProvider>
  )
}

// 메인 앱 컴포넌트
function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  )
}

export default App
