import { useSelector } from 'react-redux'
import { Navigate, createHashRouter } from 'react-router-dom'
import AppLayout from './components/ui/AppLayout'
import HomePage from './pages/index'
import LoginPage from './pages/login'
import OverlayPage from './pages/overlay'
import { RootState } from './store'

// 보호된 라우트 컴포넌트
interface ProtectedRouteProps {
  children: React.ReactNode
  isAuthenticated: boolean
}

const ProtectedRoute = ({ children, isAuthenticated }: ProtectedRouteProps) => {
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  return <>{children}</>
}

// 라우트 정의
interface RouteConfig {
  path: string
  Element: React.ComponentType<any>
  ErrorBoundary?: React.ComponentType<any>
  skipLayout?: boolean
  children?: RouteConfig[]
}

const routes: RouteConfig[] = [
  {
    path: '/',
    Element: () => {
      const isLoggedIn = useSelector((state: RootState) => state.app.isLoggedIn)
      return (
        <ProtectedRoute isAuthenticated={isLoggedIn}>
          <HomePage />
        </ProtectedRoute>
      )
    },
  },
  {
    path: '/login',
    Element: LoginPage,
  },
  {
    path: '/overlay',
    Element: OverlayPage,
    skipLayout: true, // 오버레이 페이지는 레이아웃 없이 표시
  },
  {
    path: '/overlay/setting',
    Element: () => {
      const isLoggedIn = useSelector((state: RootState) => state.app.isLoggedIn)
      return (
        <ProtectedRoute isAuthenticated={isLoggedIn}>
          <OverlayPage />
        </ProtectedRoute>
      )
    },
    skipLayout: true, // 오버레이 세팅 페이지도 레이아웃 없이 표시
  },
  // 추가 라우트는 여기에 설정
]

// 라우트 설정을 재귀적으로 처리하는 함수
const processRoutes = (routes: RouteConfig[]) => {
  return routes.map(({ Element, ErrorBoundary, skipLayout, children, ...rest }) => ({
    ...rest,
    element: skipLayout ? (
      <Element />
    ) : (
      <AppLayout>
        <Element />
      </AppLayout>
    ),
    ...(ErrorBoundary && { errorElement: <ErrorBoundary /> }),
    ...(children && { children: processRoutes(children) }),
  }))
}

// createHashRouter로 라우터 생성
export const router = createHashRouter([
  ...processRoutes(routes),
  // 404 처리를 위한 와일드카드 경로 추가
  {
    path: '*',
    element: <Navigate to='/' replace />,
  },
])
