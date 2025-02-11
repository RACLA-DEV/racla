import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Image from 'next/image'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'
import { useRouter } from 'next/router'

const BackgroundVideoComponent = React.memo(() => {
  const defaultVideoRef = useRef<HTMLVideoElement>(null)
  const dynamicVideoRef = useRef<HTMLVideoElement>(null)
  const dispatch = useDispatch()
  const router = useRouter()
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)
  const { selectedGame, isDetectedGame, settingData } = useSelector((state: RootState) => state.app)
  const [dynamicVideoSrc, setDynamicVideoSrc] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [opacity, setOpacity] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('router.pathname', router.pathname)
    if (!router.pathname.includes('/db/title')) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        dispatch(setBackgroundBgaName(''))
      }, 500)
    }
  }, [router.pathname])

  useEffect(() => {
    // 새로운 backgroundBgaName이 설정되면 opacity를 부드럽게 변경

    if (backgroundBgaName !== '') {
      setDynamicVideoSrc(
        `${baseUrl}/preview/title/${backgroundBgaName}.${selectedGame === 'djmax_respect_v' ? 'webm' : 'mp4'}`,
      )
      setOpacity(1)
    } else {
      setOpacity(0)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setDynamicVideoSrc('')
      }, 500)
    }

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [backgroundBgaName])

  useEffect(() => {
    setBaseUrl(`https://ribbon.r-archive.zip/${selectedGame.toLowerCase()}`)
  }, [selectedGame])

  if (isDetectedGame || !settingData?.visibleBga) {
    return null
  }

  return (
    <>
      {/* 기본 배경 비디오 */}
      <Image
        src={
          selectedGame === 'djmax_respect_v'
            ? '/images/djmax_respect_v/bg.png'
            : '/images/wjmax/bg.png'
        }
        alt='default-video'
        fill
        style={{
          objectFit: 'cover',
          zIndex: -2,
        }}
      />

      {/* 동적 배경 비디오 */}
      {dynamicVideoSrc !== '' && (
        <video
          ref={dynamicVideoRef}
          key={dynamicVideoSrc}
          src={dynamicVideoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload='auto'
          style={{
            position: 'fixed',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1,
            opacity: opacity,
            transition: 'opacity 0.5s ease-in-out',
          }}
          className='background-video tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-screen'
          onError={(e) => console.error('동적 비디오 로드 에러:', e)}
        />
      )}
      <div className='background-image-color' />
    </>
  )
})

BackgroundVideoComponent.displayName = 'BackgroundVideoComponent'

export default BackgroundVideoComponent
