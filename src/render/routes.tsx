import { createHashRouter, Outlet } from 'react-router-dom'
import WrappedApp from './components/app/WrappedApp'
import AppLayout from './components/ui/AppLayout'
import MainPage from './pages'
import Login from './pages/login'
import Overlay from './pages/overlay'

// 기본 레이아웃이 적용된 라우트를 위한 컴포넌트
const DefaultLayout = () => {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

// 라우터 설정 - 이 객체는 App.tsx에서 사용됩니다
export const router = createHashRouter([
  {
    path: '/',
    element: <WrappedApp />,
    children: [
      // 레이아웃이 필요한 페이지들은 DefaultLayout 하위로 그룹화
      {
        element: <DefaultLayout />,
        children: [
          {
            index: true,
            element: <MainPage />,
          },
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: '*',
            element: <div>페이지를 찾을 수 없습니다.</div>,
          },
        ],
      },
      // 레이아웃이 필요 없는 페이지들
      {
        path: 'overlay',
        element: <Overlay />,
      },
    ],
  },
])
