import { RootState } from '@render/store'
import type { ChildrenReactNodeProps } from '@src/types/render/ChildrenReactNodeProps'
import React from 'react'
import { useSelector } from 'react-redux'
import Footer from './Footer'
import TitleBar from './Header'
import IconSidebar from './IconSidebar'
import MainContent from './MainContent'
import MenuSidebar from './MenuSidebar'

const AppLayout: React.FC<ChildrenReactNodeProps> = ({ children }) => {
  const { theme } = useSelector((state: RootState) => state.ui)
  const { font } = useSelector((state: RootState) => state.app.settingData)
  return (
    <div
      className={`tw:flex tw:flex-col tw:h-screen ${font != 'default' ? 'tw:font-medium' : ''} ${
        theme === 'dark'
          ? 'tw:bg-gradient-to-br tw:from-slate-900/95 tw:via-slate-900/95 tw:to-slate-900'
          : 'tw:bg-gradient-to-br tw:from-indigo-50 tw:via-white/90 tw:to-white/40'
      }`}
    >
      {/* 커스텀 타이틀바 */}
      <TitleBar />

      <div className='tw:flex tw:flex-1 tw:overflow-hidden'>
        {/* 아이콘 사이드바 */}
        <div className='tw:relative tw:z-10'>
          <IconSidebar />
        </div>

        {/* 내부 콘텐츠 컨테이너 - 둥근 모서리 적용 */}
        <div
          className={`tw:flex tw:flex-1 tw:overflow-hidden tw:rounded-tl-xl tw:rounded-bl-xl tw:ml-0 tw:border-t tw:border-l tw:border-b tw:relative tw:mb-8 ${
            theme === 'dark'
              ? 'tw:bg-slate-800 tw:border-slate-700/40 tw:backdrop-blur-sm'
              : 'tw:bg-white tw:border-indigo-100/40 tw:backdrop-blur-sm'
          }`}
        >
          {/* 메뉴 사이드바 */}
          <MenuSidebar />

          {/* 메인 컨텐츠 영역 */}
          <MainContent>{children}</MainContent>
        </div>
      </div>

      {/* 푸터 영역 */}
      <Footer />
    </div>
  )
}

export default AppLayout
