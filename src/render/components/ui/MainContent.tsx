import { RootState } from '@render/store'
import { motion } from 'framer-motion'
import React, { ReactNode } from 'react'
import { useSelector } from 'react-redux'

interface MainContentProps {
  children: ReactNode
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { theme, sidebarCollapsed } = useSelector((state: RootState) => state.ui)

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
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
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
      className={`tw:flex-1 tw:overflow-auto tw:transition-all tw:duration-300 tw:border-l tw:custom-scrollbar tw:pr-3 ${
        theme === 'dark'
          ? 'tw:text-slate-100 tw:border-slate-700/50'
          : 'light-theme tw:text-indigo-900 tw:border-indigo-100/50'
      }`}
    >
      {/* 컨텐츠 영역 */}
      <motion.div variants={childAnimation} className='tw:p-6 tw:h-full tw:pr-9 tw:pb-12'>
        {children}
      </motion.div>
    </motion.div>
  )
}

export default MainContent
