import React, { useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

const BackgroundVideoComponent = React.memo(() => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)
  const { selectedGame, isDetectedGame, settingData } = useSelector((state: RootState) => state.app)

  const baseUrl = `https://cdn.lunatica.kr/${selectedGame.toLowerCase()}`
  const videoSrc = backgroundBgaName ? `${baseUrl}/preview/title/${backgroundBgaName}.webm` : `${baseUrl}/bg_title.mp4`

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
