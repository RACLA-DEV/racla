import { RootState } from '@render/store'
import React, { ReactNode } from 'react'
import { useSelector } from 'react-redux'

interface MainContentProps {
  children: ReactNode
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { theme, sidebarCollapsed } = useSelector((state: RootState) => state.ui)

  return (
    <div
      className={`tw:flex-1 tw:overflow-auto tw:transition-all tw:duration-300 tw:border-l tw:custom-scrollbar tw:pr-3 ${
        theme === 'dark'
          ? 'tw:text-slate-100 tw:border-slate-700/50'
          : 'light-theme tw:text-indigo-900 tw:border-indigo-100/50'
      }`}
    >
      {/* 컨텐츠 영역 */}
      <div className='tw:p-6 tw:h-full tw:pr-9 tw:pb-12'>{children}</div>
    </div>
  )
}

export default MainContent
