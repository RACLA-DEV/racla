import { RootState } from '@render/store'
import type { TooltipProps } from '@src/types/render/TooltipProps'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'right' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const { theme } = useSelector((state: RootState) => state.ui)

  // 위치에 따른 클래스 선택
  const getPositionClass = () => {
    switch (position) {
      case 'top':
        return 'tw:bottom-full tw:left-1/2 tw:-translate-x-1/2 tw:-translate-y-2'
      case 'right':
        return 'tw:left-full tw:top-1/2 tw:-translate-y-1/2 tw:translate-x-2'
      case 'bottom':
        return 'tw:top-full tw:left-1/2 tw:-translate-x-1/2 tw:translate-y-2'
      case 'left':
        return 'tw:right-full tw:top-1/2 tw:-translate-y-1/2 tw:-translate-x-2'
      default:
        return 'tw:right-full tw:top-1/2 tw:-translate-y-1/2 tw:-translate-x-2'
    }
  }

  return (
    <div
      className='tw:relative tw:inline-block'
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`tw:absolute tw:z-50 tw:px-2 tw:py-1 tw:text-xs tw:rounded tw:whitespace-nowrap tw:pointer-events-none tw:opacity-90 ${
            theme === 'dark'
              ? 'tw:bg-slate-900 tw:text-slate-200 tw:shadow-lg'
              : 'tw:bg-gray-700 tw:text-white tw:shadow-md'
          } ${getPositionClass()}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export default Tooltip
