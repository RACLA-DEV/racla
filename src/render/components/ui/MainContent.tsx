import { RootState } from '@render/store'
import type { ChildrenReactNodeProps } from '@src/types/render/ChildrenReactNodeProps'
import { motion } from 'framer-motion'
import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

const MainContent: React.FC<ChildrenReactNodeProps> = ({ children }) => {
  const { theme } = useSelector((state: RootState) => state.ui)
  const location = useLocation()

  // 애니메이션 변수
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
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={contentAnimation}
      className={`tw:flex-1 tw:overflow-x-hidden tw:overflow-y-auto tw:transition-all tw:duration-300 tw:border-l tw:custom-scrollbar tw:pr-3 ${
        theme === 'dark'
          ? 'tw:text-slate-100 tw:border-slate-700/50'
          : 'light-theme tw:text-indigo-900 tw:border-indigo-100/50'
      }`}
    >
      {/* 컨텐츠 영역 */}
      <motion.div
        variants={childAnimation}
        key={location.pathname}
        className='tw:p-6 tw:h-full tw:pr-9 tw:pb-12'
      >
        {/* 무조건 자식 컴포넌트 렌더링 */}
        {children}
      </motion.div>
    </motion.div>
  )
}

export default MainContent
