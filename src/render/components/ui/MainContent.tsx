import { RootState } from '@render/store'
import type { ChildrenReactNodeProps } from '@src/types/render/ChildrenReactNodeProps'
import { motion } from 'framer-motion'
import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

// 애니메이션 변수를 컴포넌트 외부로 분리
const contentAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      delay: 0.3,
      when: 'beforeChildren',
      staggerChildren: 0.2,
    },
  },
}

const childAnimation = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

const MainContent: React.FC<ChildrenReactNodeProps> = ({ children }) => {
  const { theme, sidebarCollapsed } = useSelector((state: RootState) => state.ui)
  const { refresh } = useSelector((state: RootState) => state.app)
  const location = useLocation()

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={contentAnimation}
      className={`tw:flex-1 tw:overflow-x-hidden tw:overflow-y-auto tw:transition-all tw:duration-300 tw:custom-scrollbar tw:pr-3 ${
        theme === 'dark'
          ? 'tw:dark:text-slate-200 tw:border-slate-700/50'
          : 'light-theme tw:text-gray-800 tw:border-indigo-100/50'
      } ${!sidebarCollapsed ? 'tw:border-l' : ''}`}
    >
      {/* 컨텐츠 영역 */}
      <motion.div
        variants={childAnimation}
        key={location.pathname + refresh}
        className='tw:p-4 tw:h-full'
      >
        {/* 무조건 자식 컴포넌트 렌더링 */}
        {children}
      </motion.div>
    </motion.div>
  )
}

export default MainContent
