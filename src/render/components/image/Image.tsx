import { ImageProps } from '@src/types/render/ImageProps'
import { useEffect, useRef, useState } from 'react'

export default function Image({
  src,
  alt,
  width,
  height,
  className = '',
  blurClassName = 'tw:blur-sm',
  style,
  loading = 'lazy',
  onLoad,
  onError,
  placeholder,
  fallbackSrc,
}: ImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const mainImageRef = useRef<HTMLImageElement>(null)

  // src가 변경되면 상태 초기화
  useEffect(() => {
    setStatus('loading')

    // 이미지 프리로딩
    const img = new globalThis.Image()
    img.src = src

    img.onload = () => {
      setStatus('loaded')
      onLoad?.()
    }

    img.onerror = () => {
      if (fallbackSrc) {
        // 대체 이미지가 있으면 교체
        if (mainImageRef.current) {
          mainImageRef.current.src = fallbackSrc
        }
        setStatus('loaded')
      } else {
        setStatus('error')
      }
      onError?.()
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, fallbackSrc, onLoad, onError])

  return (
    <div
      className='tw:relative tw:overflow-hidden tw:flex tw:items-center tw:justify-center'
      style={{ width, height }}
    >
      {/* 스켈레톤 로딩 효과 */}
      {status === 'loading' && (
        <div className='tw:absolute tw:inset-0 tw:bg-gray-200 tw:dark:bg-slate-700 tw:overflow-hidden tw:rounded-md'>
          <div className='tw:h-full tw:w-full tw:relative'>
            <div className='tw:absolute tw:inset-0 tw:bg-gradient-to-r tw:from-transparent tw:via-white/20 tw:to-transparent tw:animate-shimmer'></div>
          </div>
        </div>
      )}

      {/* 오류 상태 표시 */}
      {status === 'error' && !fallbackSrc && (
        <div className='tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center tw:bg-gray-200 tw:dark:bg-slate-700'>
          <span className='tw:text-sm tw:text-gray-500 tw:dark:text-slate-400'>
            이미지 로드 실패
          </span>
        </div>
      )}

      {/* 메인 이미지 */}
      <img
        ref={mainImageRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} tw:transition-opacity tw:duration-300`}
        style={{
          ...style,
          opacity: status === 'loaded' ? 1 : 0,
        }}
        loading={loading}
      />
    </div>
  )
}
