import { useEffect, useState } from 'react'
import { Provider, useSelector } from 'react-redux'
import type { ActionFunction, LoaderFunction } from 'react-router-dom'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import './App.css'
import AppLayout from './components/ui/AppLayout'
import { ThemeProvider } from './components/ui/ThemeProvider'
import { globalDictionary } from './constants/globalDictionary'
import { persistor, RootState, store } from './store'

interface RouteCommon {
  loader?: LoaderFunction
  action?: ActionFunction
  ErrorBoundary?: React.ComponentType<any>
}

interface IRoute extends RouteCommon {
  path: string
  Element: React.ComponentType<any>
}

interface Pages {
  [key: string]: {
    default: React.ComponentType<any>
  } & RouteCommon
}

const pages: Pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
const routes: IRoute[] = []
for (const path of Object.keys(pages)) {
  const fileName = path.match(/\.\/pages\/(.*)\.tsx$/)?.[1]
  if (!fileName) {
    continue
  }

  const normalizedPathName = fileName.includes('$')
    ? fileName.replace('$', ':')
    : fileName.replace(/\/index/, '')

  routes.push({
    path: fileName === 'index' ? '/' : `/${normalizedPathName.toLowerCase()}`,
    Element: pages[path].default,
    loader: pages[path]?.loader as LoaderFunction | undefined,
    action: pages[path]?.action as ActionFunction | undefined,
    ErrorBoundary: pages[path]?.ErrorBoundary,
  })
}

const router = createHashRouter(
  routes.map(({ Element, ErrorBoundary, ...rest }) => ({
    ...rest,
    element: (
      <AppLayout>
        <Element />
      </AppLayout>
    ),
    ...(ErrorBoundary && { errorElement: <ErrorBoundary /> }),
  })),
)

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
const LoadingSkeleton = ({ theme }: { theme: string }) => {
  return (
    <div
      className={`tw:fixed tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center tw:z-[1000000] ${
        theme === 'dark' ? 'tw:bg-slate-900/95' : 'tw:bg-indigo-50/95'
      }`}
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
          <div className='tw:w-2 tw:h-2 tw:rounded-full tw:mr-1 tw:animate-ping tw:bg-blue-500'></div>
          <div className='tw:w-2 tw:h-2 tw:rounded-full tw:mr-1 tw:animate-ping tw:delay-150 tw:bg-blue-500'></div>
          <div className='tw:w-2 tw:h-2 tw:rounded-full tw:animate-ping tw:delay-300 tw:bg-blue-500'></div>
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

// Provider 내부에서 사용할 래핑된 앱 컴포넌트
function WrappedApp() {
  const { theme } = useSelector((state: RootState) => state.ui)
  const [isLoading, setIsLoading] = useState(true)
  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')

  // 앱 초기화 및 설정 로드
  useEffect(() => {
    // 설정 로드
    const loadSettings = async () => {
      try {
        if (window.electron && window.electron.loadSettings) {
          const settings = await window.electron.loadSettings()
          console.log('설정 로드됨:', settings)

          // 서버에서 데이터 로드 시작
          loadData()
        }
      } catch (error) {
        console.error('설정 로드 실패:', error)
        // 실패해도 로딩 단계 진행
        loadData()
      }
    }

    // 서버에서 데이터 로드
    const loadData = async () => {
      try {
        // 여기에 서버 데이터 로드 로직 구현
        // 예: 곡 정보, 사용자 정보 등 로드
        console.log('서버 데이터 로드 중...')

        // 로딩 시간 시뮬레이션 (실제로는 제거하고 실제 데이터 로드 결과에 따라 처리)
        setTimeout(() => {
          setIsLoading(false)
          console.log('데이터 로드 완료')
        }, 2000)
      } catch (error) {
        console.error('데이터 로드 실패:', error)
        // 데이터 로드 실패해도 앱 실행
        setIsLoading(false)
      }
    }

    loadSettings()

    // 외부 링크 처리 이벤트 설정
    const handleExternalLink = (url: string) => {
      setExternalUrl(url)
      setShowExternalLinkModal(true)
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

    return () => {
      // 이벤트 리스너 정리
      if (cleanup) {
        cleanup()
      }
    }
  }, [])

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
      {isLoading && <LoadingSkeleton theme={theme} />}
      <RouterProvider router={router} />

      {/* 외부 링크 모달 */}
      <ExternalLinkModal
        url={externalUrl}
        isOpen={showExternalLinkModal}
        onClose={() => setShowExternalLinkModal(false)}
        onConfirm={handleOpenExternalLink}
        theme={theme}
      />
    </ThemeProvider>
  )
}

// 메인 앱 컴포넌트
function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <WrappedApp />
      </PersistGate>
    </Provider>
  )
}

export default App
