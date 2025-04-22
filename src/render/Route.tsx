import { createHashRouter, Outlet } from 'react-router-dom'
import WrappedApp from './components/app/WrappedApp'
import AppLayout from './components/ui/AppLayout'

// 기본 레이아웃이 적용된 라우트를 위한 컴포넌트
const DefaultLayout = () => {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

// 페이지 파일 가져오기 (파일 기반 라우팅)
const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })

// 라우트 생성 함수
function generateRoutes() {
  const routes = []

  for (const path of Object.keys(pages)) {
    // 파일 경로에서 페이지 경로 추출
    const fileName = path.match(/\.\/pages\/(.*)\.tsx$/)?.[1]
    if (!fileName) continue

    // 파일이 index.tsx인 경우 루트 경로로 처리
    const isIndex = fileName.endsWith('/index') || fileName === 'index'

    // 동적 라우팅 처리
    // $id.tsx -> :id, $slug.tsx -> :slug 등으로 변환
    let normalizedPath = isIndex ? fileName.replace(/\/index$/, '') : fileName

    normalizedPath = normalizedPath
      .replace(/\/\$([^\/]+)/g, '/:$1') // /users/$id -> /users/:id
      .replace(/^\$([^\/]+)/g, ':$1') // /$id -> /:id

    // 컴포넌트 가져오기
    // @ts-ignore
    const Component = pages[path].default

    // 경로가 overlay인 경우 레이아웃이 없는 경로로 처리
    const pathKey = normalizedPath === '' ? '/' : `/${normalizedPath}`

    // 정확히 '/overlay'인 경우에만 레이아웃 없이 처리
    if (pathKey === '/overlay') {
      routes.push({
        path: pathKey,
        element: <Component />,
      })
    } else {
      // 레이아웃이 필요한 페이지용 라우트 추가
      routes.push({
        path: pathKey,
        element: <DefaultLayout />,
        children: [
          {
            index: true,
            element: <Component />,
          },
        ],
      })
    }
  }

  return routes
}

// 라우터 설정
const router = createHashRouter([
  {
    path: '/',
    element: <WrappedApp />,
    children: [
      ...generateRoutes(),
      // 404 페이지 처리
      {
        path: '*',
        element: <DefaultLayout />,
        children: [
          {
            index: true,
            element: <div>페이지를 찾을 수 없습니다.</div>,
          },
        ],
      },
    ],
  },
])

// 컴포넌트를 기본 내보내기로 변경하여 HMR 호환성 문제 해결
export default router
