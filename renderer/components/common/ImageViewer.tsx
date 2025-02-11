import { FaMinus, FaPlus, FaXmark } from 'react-icons/fa6'
import { MouseEvent, WheelEvent, useEffect, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

interface ImageViewerProps {
  src: string
  alt?: string
  onClose: () => void
}

export default function ImageViewerComponent({ src, alt = '', onClose }: ImageViewerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleBackdropClick = (e: MouseEvent) => {
    // if (e.target === e.currentTarget) {
    //   onClose()
    // }
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 3))
    } else {
      setScale((prev) => Math.max(prev - 0.25, 0.5))
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className={`tw-fixed tw-inset-0 tw-transition-opacity tw-duration-300 ${isVisible ? 'tw-opacity-100' : 'tw-opacity-0'}`}
      style={{ zIndex: 99999 }}
    >
      {/* 배경 */}
      <div
        className='tw-fixed tw-h-screen tw-w-screen tw-inset-0 tw-bg-gray-950 tw-bg-opacity-75'
        style={{ position: 'fixed', left: 0, top: 0, zIndex: 99998 }}
      />

      {/* 메인 컨테이너 - 트랜지션 효과 추가 */}
      <div
        className={`tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-300 ${
          isVisible ? 'tw-opacity-100 tw-translate-y-0' : 'tw-opacity-0 tw-translate-y-4'
        }`}
        style={{ position: 'fixed', left: 0, top: 0, zIndex: 99999 }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
        {/* 컨트롤 버튼 */}
        <div
          className='tw-absolute tw-bottom-20 tw-flex tw-gap-4 tw-bg-gray-900 tw-shadow-lg tw-border tw-border-gray-800 tw-rounded-md tw-p-2'
          style={{ zIndex: 100000 }}
        >
          <button
            onClick={handleZoomOut}
            className='tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white'
          >
            <FaMinus className='tw-w-4 tw-h-4' />
          </button>
          <button
            onClick={handleZoomIn}
            className='tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white'
          >
            <FaPlus className='tw-w-4 tw-h-4' />
          </button>
          <button
            onClick={handleClose}
            className='tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white'
          >
            <FaXmark className='tw-w-4 tw-h-4' />
          </button>
        </div>

        {/* 이미지 컨테이너 */}
        <div
          ref={imageRef}
          className={`tw-cursor-${isDragging ? 'grabbing' : 'grab'} tw-relative`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <img
            src={src}
            alt={alt}
            className='tw-transition-transform tw-duration-200 tw-pointer-events-none'
            style={{
              transform: `scale(${scale})`,
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
