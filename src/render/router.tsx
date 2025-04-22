import { lazy, Suspense } from 'react'
import { createHashRouter, Navigate, Outlet } from 'react-router-dom'
import ComponentLoading from './components/app/ComponentLoading'

const WrappedApp = lazy(() => import('./components/app/WrappedApp'))
const AppLayout = lazy(() => import('./components/ui/AppLayout'))
const Login = lazy(() => import('./pages/auth/login'))
const MainPage = lazy(() => import('./pages/home'))
const Overlay = lazy(() => import('./pages/overlay'))

// 기본 레이아웃이 적용된 라우트를 위한 컴포넌트
const DefaultLayout = () => {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </Suspense>
  )
}

// 라우터 설정 - 이 객체는 App.tsx에서 사용됩니다
export const router = createHashRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<ComponentLoading />}>
        <WrappedApp />
      </Suspense>
    ),
    children: [
      // 레이아웃이 필요한 페이지들은 DefaultLayout 하위로 그룹화
      {
        element: <DefaultLayout />,
        children: [
          {
            index: true,
            element: <Navigate to='/home' />,
          },
          {
            path: 'home',
            element: (
              <Suspense fallback={<ComponentLoading />}>
                <MainPage />
              </Suspense>
            ),
          },
          {
            path: '/auth/login',
            element: (
              <Suspense fallback={<ComponentLoading />}>
                <Login />
              </Suspense>
            ),
          },
          {
            path: '*',
            element: <Navigate to='/home' />,
          },
        ],
      },
      // 레이아웃이 필요 없는 페이지들
      {
        path: 'overlay',
        element: (
          <Suspense fallback={<ComponentLoading />}>
            <Overlay />
          </Suspense>
        ),
      },
    ],
  },
])
