import { lazy, Suspense } from 'react'
import { createHashRouter, Navigate, Outlet } from 'react-router-dom'
import PageLoading from './components/app/PageLoading'

const WrappedApp = lazy(() => import('./components/app/WrappedApp'))
const AppLayout = lazy(() => import('./components/ui/AppLayout'))
const Login = lazy(() => import('./pages/auth/login'))
const MainPage = lazy(() => import('./pages/home'))
const Overlay = lazy(() => import('./pages/overlay'))
const TrackMakerHub = lazy(() => import('./pages/track-maker'))
const CheatsheetPage = lazy(() => import('./pages/test/cheatsheet'))
const OverlaySettingsPage = lazy(() => import('./pages/overlay/settings'))
const DmrvDbPage = lazy(() => import('./pages/games/djmax_respect_v/db'))
const DmrvDbDetailPage = lazy(() => import('./pages/games/djmax_respect_v/db/detail'))
const DmrvHardDbPage = lazy(() => import('./pages/games/djmax_respect_v/hard/db'))
const DmrvHardDbDetailPage = lazy(() => import('./pages/games/djmax_respect_v/hard/db/detail'))
const DmrvHardDbPatternPage = lazy(() => import('./pages/games/djmax_respect_v/hard/db/pattern'))
const DmrvHardGradePage = lazy(() => import('./pages/games/djmax_respect_v/hard/grade'))
const DmrvHardRankingPage = lazy(() => import('./pages/games/djmax_respect_v/hard/ranking'))
const DmrvBoardPage = lazy(() => import('./pages/games/djmax_respect_v/board'))
const DmrvGradePage = lazy(() => import('./pages/games/djmax_respect_v/grade'))
const DmrvDjpowerPage = lazy(() => import('./pages/games/djmax_respect_v/djpower'))
const DmrvRegScorePage = lazy(() => import('./pages/games/djmax_respect_v/regScore'))
const PlatinaLabDbPage = lazy(() => import('./pages/games/platina_lab/db'))
const PlatinaLabDbDetailPage = lazy(() => import('./pages/games/platina_lab/db/detail'))
const PlatinaLabBoardPage = lazy(() => import('./pages/games/platina_lab/board'))
const PlatinaLabRegScorePage = lazy(() => import('./pages/games/platina_lab/regScore'))
const WjmaxDbPage = lazy(() => import('./pages/games/wjmax/db'))
const WjmaxDbDetailPage = lazy(() => import('./pages/games/wjmax/db/detail'))
const WjmaxBoardPage = lazy(() => import('./pages/games/wjmax/board'))
const WjmaxRegScorePage = lazy(() => import('./pages/games/wjmax/regScore'))
const LicensePage = lazy(() => import('./pages/license'))
const FeedbackListPage = lazy(() => import('./pages/feedback'))
const FeedbackDetailPage = lazy(() => import('./pages/feedback/detail'))

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
            element: <Navigate to='/home' />,
          },
          {
            path: 'home',
            element: (
              <Suspense fallback={<PageLoading />}>
                <MainPage />
              </Suspense>
            ),
          },
          {
            path: '/auth/login',
            element: (
              <Suspense fallback={<PageLoading />}>
                <Login />
              </Suspense>
            ),
          },
          {
            path: '/overlay/settings',
            element: (
              <Suspense fallback={<PageLoading />}>
                <OverlaySettingsPage />
              </Suspense>
            ),
          },
          {
            path: 'track-maker',
            element: (
              <Suspense fallback={<PageLoading />}>
                <TrackMakerHub />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/db',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvDbPage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/db/:id',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvDbDetailPage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/hard/db',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvHardDbPage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/hard/db/:id',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvHardDbDetailPage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/hard/db/:id/:patternName',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvHardDbPatternPage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/hard/grade',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvHardGradePage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/hard/ranking',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvHardRankingPage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/board',
            element: <Navigate to='/games/djmax_respect_v/board/4/1' />,
          },
          {
            path: '/games/djmax_respect_v/board/:keyMode/:board',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvBoardPage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/grade',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvGradePage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/djpower',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvDjpowerPage />
              </Suspense>
            ),
          },
          {
            path: '/games/djmax_respect_v/regScore',
            element: (
              <Suspense fallback={<PageLoading />}>
                <DmrvRegScorePage />
              </Suspense>
            ),
          },
          {
            path: '/games/platina_lab/db',
            element: (
              <Suspense fallback={<PageLoading />}>
                <PlatinaLabDbPage />
              </Suspense>
            ),
          },
          {
            path: '/games/platina_lab/db/:id',
            element: (
              <Suspense fallback={<PageLoading />}>
                <PlatinaLabDbDetailPage />
              </Suspense>
            ),
          },
          {
            path: '/games/platina_lab/board',
            element: <Navigate to='/games/platina_lab/board/4B/1' />,
          },
          {
            path: '/games/platina_lab/board/:keyMode/:board',
            element: (
              <Suspense fallback={<PageLoading />}>
                <PlatinaLabBoardPage />
              </Suspense>
            ),
          },
          {
            path: '/games/platina_lab/regScore',
            element: (
              <Suspense fallback={<PageLoading />}>
                <PlatinaLabRegScorePage />
              </Suspense>
            ),
          },
          {
            path: '/games/wjmax/db',
            element: (
              <Suspense fallback={<PageLoading />}>
                <WjmaxDbPage />
              </Suspense>
            ),
          },
          {
            path: '/games/wjmax/db/:id',
            element: (
              <Suspense fallback={<PageLoading />}>
                <WjmaxDbDetailPage />
              </Suspense>
            ),
          },
          {
            path: '/games/wjmax/board',
            element: <Navigate to='/games/wjmax/board/4B/1' />,
          },
          {
            path: '/games/wjmax/board/:keyMode/:board',
            element: (
              <Suspense fallback={<PageLoading />}>
                <WjmaxBoardPage />
              </Suspense>
            ),
          },
          {
            path: '/games/wjmax/regScore',
            element: (
              <Suspense fallback={<PageLoading />}>
                <WjmaxRegScorePage />
              </Suspense>
            ),
          },
          process.env.NODE_ENV === 'development' && {
            path: '/test/cheatsheet',
            element: (
              <Suspense fallback={<PageLoading />}>
                <CheatsheetPage />
              </Suspense>
            ),
          },
          {
            path: '/feedback',
            element: (
              <Suspense fallback={<PageLoading />}>
                <FeedbackListPage />
              </Suspense>
            ),
          },
          {
            path: '/feedback/:feedbackId',
            element: (
              <Suspense fallback={<PageLoading />}>
                <FeedbackDetailPage />
              </Suspense>
            ),
          },
          {
            path: '/license',
            element: (
              <Suspense fallback={<PageLoading />}>
                <LicensePage />
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
          <Suspense fallback={<PageLoading />}>
            <Overlay />
          </Suspense>
        ),
      },
    ],
  },
])
