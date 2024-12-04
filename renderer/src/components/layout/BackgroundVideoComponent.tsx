import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

const BackgroundVideoComponent = React.memo(() => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const dispatch = useDispatch()
  const router = useRouter()
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)
  const { selectedGame, isDetectedGame, settingData } = useSelector((state: RootState) => state.app)

  useEffect(() => {
    if (!router.pathname.includes('/db/title')) {
      dispatch(setBackgroundBgaName(''))
    }
  }, [router.pathname, selectedGame, dispatch])

  const baseUrl = `https://cdn.lunatica.kr/${selectedGame.toLowerCase()}`
  const videoSrc = backgroundBgaName
    ? `${baseUrl}/preview/title/${backgroundBgaName}.${selectedGame === 'djmax_respect_v' ? 'webm' : 'mp4'}`
    : `${baseUrl}/bg_title.mp4`

  if (isDetectedGame || !settingData?.visibleBga) {
    return null
  }

  return (
    <>
      <video
        ref={videoRef}
        key={videoSrc}
        src={videoSrc}
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
        }}
        className="background-video tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-screen tw-transition-opacity tw-duration-1000"
        onError={(e) => console.error('비디오 로드 에러:', e)}
      />
      <div className="background-image-color" />
    </>
  )
})

BackgroundVideoComponent.displayName = 'BackgroundVideoComponent'

export default BackgroundVideoComponent
