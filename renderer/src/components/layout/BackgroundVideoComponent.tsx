import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

const BackgroundVideoComponent = React.memo(() => {
  const defaultVideoRef = useRef<HTMLVideoElement>(null)
  const dynamicVideoRef = useRef<HTMLVideoElement>(null)
  const dispatch = useDispatch()
  const router = useRouter()
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)
  const { selectedGame, isDetectedGame, settingData } = useSelector((state: RootState) => state.app)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (!router.pathname.includes('/db/title')) {
      dispatch(setBackgroundBgaName(''))
    }
  }, [router.pathname, selectedGame, dispatch])

  useEffect(() => {
    // 새로운 backgroundBgaName이 설정되면 opacity를 부드럽게 변경
    setOpacity(backgroundBgaName ? 1 : 0)
  }, [backgroundBgaName])

  const baseUrl = `https://ribbon.r-archive.zip/${selectedGame.toLowerCase()}`
  const defaultVideoSrc = `${baseUrl}/bg_title.mp4`
  const dynamicVideoSrc = backgroundBgaName ? `${baseUrl}/preview/title/${backgroundBgaName}.${selectedGame === 'djmax_respect_v' ? 'webm' : 'mp4'}` : ''

  if (isDetectedGame || !settingData?.visibleBga) {
    return null
  }

  return (
    <>
      {/* 기본 배경 비디오 */}
      <video
        ref={defaultVideoRef}
        key="default-video"
        src={defaultVideoSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -2,
          opacity: dynamicVideoSrc ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        className="background-video tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-screen"
        onError={(e) => console.error('기본 비디오 로드 에러:', e)}
      />

      {/* 동적 배경 비디오 */}
      {dynamicVideoSrc && (
        <video
          ref={dynamicVideoRef}
          key={dynamicVideoSrc}
          src={dynamicVideoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            position: 'fixed',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1,
            opacity: opacity,
            transition: 'opacity 0.3s ease-in-out',
          }}
          className="background-video tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-screen"
          onError={(e) => console.error('동적 비디오 로드 에러:', e)}
        />
      )}
      <div className="background-image-color" />
    </>
  )
})

BackgroundVideoComponent.displayName = 'BackgroundVideoComponent'

export default BackgroundVideoComponent
