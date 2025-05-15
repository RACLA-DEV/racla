import type { TooltipProps } from '@src/types/tooltip/TooltipProps'
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'right', className }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  // 툴팁 위치 계산
  const updatePosition = () => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = rect.top + scrollTop - 8
        left = rect.left + scrollLeft + rect.width / 2
        break
      case 'right':
        top = rect.top + scrollTop + rect.height / 2
        left = rect.left + scrollLeft + rect.width + 8
        break
      case 'bottom':
        top = rect.top + scrollTop + rect.height + 8
        left = rect.left + scrollLeft + rect.width / 2
        break
      case 'left':
        top = rect.top + scrollTop + rect.height / 2
        left = rect.left + scrollLeft - 8
        break
      default:
        top = rect.top + scrollTop + rect.height / 2
        left = rect.left + scrollLeft + rect.width + 8
    }

    setTooltipPosition({ top, left })
  }

  // 위치에 따른 클래스 선택
  const getPositionClass = () => {
    switch (position) {
      case 'top':
        return 'tw:translate-x-[-50%] tw:translate-y-[-100%]'
      case 'right':
        return 'tw:translate-y-[-50%]'
      case 'bottom':
        return 'tw:translate-x-[-50%]'
      case 'left':
        return 'tw:translate-x-[-100%] tw:translate-y-[-50%]'
      default:
        return 'tw:translate-y-[-50%]'
    }
  }

  // 마우스 올리면 위치 계산
  useEffect(() => {
    if (isVisible) {
      updatePosition()
    }
  }, [isVisible])

  // 리사이즈 이벤트 리스너
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition)
    }

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isVisible])

  return (
    <div
      ref={triggerRef}
      className={`tw:relative tw:inline-block ${className}`}
      onMouseEnter={() => {
        setIsVisible(true)
      }}
      onMouseLeave={() => {
        setIsVisible(false)
      }}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            className={`tw:fixed tw:z-[999999] tw:px-2 tw:py-1 tw:text-xs tw:rounded tw:whitespace-nowrap tw:pointer-events-none tw:opacity-90 tw:dark:bg-slate-900 tw:dark:text-slate-200 tw:dark:shadow-lg tw:bg-gray-700 tw:text-white tw:shadow-md ${getPositionClass()}`}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  )
}

export default Tooltip
