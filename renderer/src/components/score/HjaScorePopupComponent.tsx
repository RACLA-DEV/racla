import {
  getDifficultyClassName,
  getDifficultyStarImage,
  getDifficultyTextClassName,
  getSCPatternScoreDisplayText,
  getScoreDisplayText,
} from '@/libs/client/respectUtils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { globalDictionary } from '@/libs/server/globalDictionary'
import Image from 'next/image'
import Link from 'next/link'
import { useInView } from 'react-intersection-observer'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

interface ScorePopupComponentProps {
  songItem?: any
  songItemTitle?: string
  keyMode: string
  isScored?: boolean
  isVisibleCode?: boolean
  rivalName?: string
  songDataPackIndex?: number
  isFlatten?: boolean
  delay?: { show: number; hide: number }
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  size?: number
}

const ScorePopupComponent = ({
  songItem,
  songItemTitle,
  keyMode,
  isScored = false,
  isVisibleCode = false,
  rivalName = '',
  songDataPackIndex,
  delay = { show: 500, hide: 0 },
  onMouseEnter,
  onMouseLeave,
  size = 80,
}: ScorePopupComponentProps) => {
  const dispatch = useDispatch()
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)
  const userData = useSelector((state: RootState) => state.app.vArchiveUserData)
  const vArchiveUserData = useSelector((state: RootState) => state.app.vArchiveUserData)
  const songDataList = useSelector((state: RootState) => state.app.songData)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  const [songData, setSongData] = useState<any>(null)
  const [rivalSongData, setRivalSongData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [showScore, setShowScore] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: true,
  })
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!userData.userName || (!songItem && !songItemTitle)) {
        return
      }

      if (userData.userName && isHovered && !isScored) {
        setIsLoading(true)
        try {
          const title = songItem?.title || songItemTitle
          if (title !== undefined && title !== null) {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${userData.userName}/title/${title}`,
            )
            if (response.ok && isMounted) {
              const data = await response.json()
              if (songItem) {
                setSongData({ ...songItem, patterns: data.patterns })
              } else {
                setSongData(data)
              }
            }
          }
        } catch (error) {
          console.error('Error fetching song data:', error)
        }

        if (rivalName && rivalName !== userData.userName) {
          try {
            const title = songItem?.title || songItemTitle
            if (title !== undefined && title !== null) {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${rivalName}/title/${title}`,
              )
              if (response.ok && isMounted) {
                const data = await response.json()
                setRivalSongData(data)
              }
            }
          } catch (error) {
            console.error('Error fetching rival data:', error)
          }
        }

        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [songItem, songItemTitle, userData.userName, rivalName, isHovered, isScored, songDataList])

  useEffect(() => {
    if (isHovered && !isLoading && displayData !== null) {
      const timer = setTimeout(() => {
        setMounted(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setMounted(false)
    }
  }, [isHovered, isLoading])

  const handleMouseEnter = () => {
    setIsHovered(true)
    onMouseEnter?.()
    if (songItem) {
      dispatch(setBackgroundBgaName(String(songItem.title)))
    }
    if (songItemTitle) {
      dispatch(setBackgroundBgaName(String(songItemTitle)))
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onMouseLeave?.()
    dispatch(setBackgroundBgaName(''))
  }

  const displayData = isScored ? songItem : songData || songItem

  const imageUrl = useMemo(() => {
    if (!songItem && !songItemTitle) return ''
    return `/images/djmax_respect_v/jackets/${displayData?.title ?? songItemTitle}.jpg`
  }, [songItem, displayData?.title, songItemTitle])

  return (
    <OverlayTrigger
      key={'songDataPack_item' + (displayData?.title ?? songItemTitle)}
      placement='auto'
      delay={delay}
      show={isHovered && !isLoading && displayData !== null}
      overlay={
        <Tooltip
          id='btn-nav-home'
          className={`tw-bg-gray-950 tw-bg-opacity-100 tw-text-xs tw-min-h-48 ${fontFamily}`}
        >
          <div className='tw-flex tw-gap-2'>
            <style jsx global>{`
              .tooltip-inner {
                opacity: 1 !important;
                background-color: rgb(3 7 18) !important;
              }
              .tooltip.show {
                opacity: 1 !important;
              }
            `}</style>
            <div className='tw-flex tw-flex-col'>
              <div className='tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-mb-2 tw-mt-1 tw-bg-gray-900 tw-bg-opacity-100 tw-overflow-hidden tw-rounded-md'>
                {inView && (
                  <Image
                    loading='lazy'
                    blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy02Mi45OEA6PTo4OTZCRk1RUVdaWHJ4jZeGnJ2krbS/v7v/2wBDARUXFx4aHR4eHb+7pqC7v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7//wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
                    placeholder='blur'
                    src={imageUrl}
                    className='tw-absolute tw-animate-fadeInLeft tw-rounded-md tw-blur tw-brightness-50 tw-bg-opacity-90'
                    fill
                    alt=''
                    onLoad={handleImageLoad}
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <span className='tw-absolute tw-left-0 tw-bottom-0 tw-px-2 tw-font-bold tw-text-left tw-break-keep'>
                  <span className='tw-font-medium tw-text-md'>{displayData?.composer}</span>
                  <br />
                  <span className='tw-text-xl'>{displayData?.name}</span>
                </span>
                <span className='tw-absolute tw-top-1 tw-right-1 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-950 p-1'>
                  <span
                    className={`respect_dlc_code respect_dlc_code_${displayData?.dlcCode ?? ''}`}
                  >
                    {displayData?.dlc ?? ''}
                  </span>
                </span>
              </div>
              <div className='tw-flex tw-flex-col tw-gap-2 tw-w-80 tw-p-2 tw-rounded-md tw-mb-1 tw-bg-gray-700 tw-bg-opacity-20'>
                {['NM', 'HD', 'MX', 'SC'].map(
                  (value, difficultyIndex) =>
                    displayData?.patterns[`${keyMode}B`]?.[value] !== undefined &&
                    displayData?.patterns[`${keyMode}B`]?.[value] !== null && (
                      <div
                        className='tw-flex tw-flex-col tw-gap-2'
                        key={'songDataPack_item' + displayData.title + '_hover' + value}
                      >
                        <div className='tw-flex tw-items-center tw-gap-1'>
                          <span className={getDifficultyTextClassName(value)}>
                            {globalDictionary[selectedGame].difficulty[value].fullName}
                          </span>
                          <Image
                            loading='lazy' // "lazy" | "eager"
                            blurDataURL={globalDictionary.blurDataURL}
                            src={getDifficultyStarImage(
                              displayData.patterns[`${keyMode}B`][value].level,
                              value,
                            )}
                            height={14}
                            width={14}
                            alt=''
                          />
                          <span
                            className={getDifficultyClassName(
                              displayData.patterns[`${keyMode}B`][value].level,
                              value,
                            )}
                          >
                            {displayData.patterns[`${keyMode}B`][value].level}{' '}
                            <sup className='tw-text-xs'>
                              {displayData.patterns[`${keyMode}B`][value].floor !== undefined &&
                              displayData.patterns[`${keyMode}B`][value].floor !== null
                                ? `(${displayData.patterns[`${keyMode}B`][value].floor}F)`
                                : null}
                            </sup>
                          </span>
                        </div>
                        {vArchiveUserData.userName !== '' &&
                        (displayData.patterns[`${keyMode}B`][value] !== undefined || isScored) ? (
                          <div className='tw-relative tw-w-full tw-h-6 tw-bg-gray-900 tw-rounded-sm tw-overflow-hidden'>
                            <div
                              className='tw-h-full tw-transition-all tw-duration-1000 tw-ease-out'
                              style={{
                                width: mounted
                                  ? `${displayData.patterns[`${keyMode}B`][value]?.score ? Number(displayData.patterns[`${keyMode}B`][value].score) : 0}%`
                                  : '0%',
                                backgroundColor:
                                  value === 'NM'
                                    ? '#f5bb01' // respect-nm-5
                                    : value === 'HD'
                                      ? '#f95b08aa' // respect-nm-10
                                      : value === 'MX'
                                        ? '#f30253aa' // respect-nm-15
                                        : value === 'SC'
                                          ? '#3d66ff'
                                          : '', // respect-sc-15
                              }}
                            />
                            <div className='tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-white'>
                              {getScoreDisplayText(displayData.patterns[`${keyMode}B`][value])}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ),
                )}
              </div>
              {vArchiveUserData.userName !== '' && (
                <span className='tw-text-xs tw-font-light tw-text-gray-300 tw-my-2'>
                  <span className=''>{vArchiveUserData.userName}</span>님의 성과 기록(V-ARCHIVE)
                </span>
              )}
            </div>

            {rivalName && rivalName !== vArchiveUserData.userName && rivalSongData && (
              <div className='tw-flex tw-flex-col'>
                <div className='tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-mb-2 tw-mt-1 tw-bg-gray-900 tw-bg-opacity-100 tw-overflow-hidden tw-rounded-md'>
                  {inView && (
                    <Image
                      loading='lazy'
                      blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy02Mi45OEA6PTo4OTZCRk1RUVdaWHJ4jZeGnJ2krbS/v7v/2wBDARUXFx4aHR4eHb+7pqC7v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7//wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
                      placeholder='blur'
                      src={imageUrl}
                      className='tw-absolute tw-animate-fadeInLeft tw-rounded-md tw-blur tw-brightness-50 tw-bg-opacity-90'
                      fill
                      alt=''
                      onLoad={handleImageLoad}
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                  <span className='tw-absolute tw-left-0 tw-bottom-0 tw-px-2 tw-font-bold tw-text-left tw-break-keep'>
                    <span className='tw-font-medium tw-text-md'>{rivalSongData.composer}</span>
                    <br />
                    <span className='tw-text-xl'>{rivalSongData.name}</span>
                  </span>
                  <span className='tw-absolute tw-top-1 tw-right-1 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-950 p-1'>
                    <span className={`respect_dlc_code respect_dlc_code_${rivalSongData.dlcCode}`}>
                      {rivalSongData.dlc}
                    </span>
                  </span>
                </div>
                <div className='tw-flex tw-flex-col tw-gap-2 tw-w-80 tw-p-2 tw-rounded-md tw-mb-1 tw-bg-gray-700 tw-bg-opacity-20'>
                  {['NM', 'HD', 'MX', 'SC'].map(
                    (value, difficultyIndex) =>
                      rivalSongData.patterns[`${keyMode}B`][value] !== undefined &&
                      rivalSongData.patterns[`${keyMode}B`][value] !== null && (
                        <div
                          className='tw-flex tw-flex-col tw-gap-2'
                          key={'songDataPack_item' + rivalSongData.title + '_hover' + value}
                        >
                          <div className='tw-flex tw-items-center tw-gap-1'>
                            <span className={getDifficultyTextClassName(value)}>
                              {globalDictionary[selectedGame].difficulty[value].fullName}
                            </span>
                            <Image
                              loading='lazy' // "lazy" | "eager"
                              blurDataURL={globalDictionary.blurDataURL}
                              src={getDifficultyStarImage(
                                rivalSongData.patterns[`${keyMode}B`][value].level,
                                value,
                              )}
                              height={14}
                              width={14}
                              alt=''
                            />
                            <span
                              className={getDifficultyClassName(
                                rivalSongData.patterns[`${keyMode}B`][value].level,
                                value,
                              )}
                            >
                              {rivalSongData.patterns[`${keyMode}B`][value].level}{' '}
                              <sup className='tw-text-xs'>
                                {rivalSongData.patterns[`${keyMode}B`][value].floor !== undefined &&
                                rivalSongData.patterns[`${keyMode}B`][value].floor !== null
                                  ? `(${rivalSongData.patterns[`${keyMode}B`][value].floor}F)`
                                  : null}
                              </sup>
                            </span>
                          </div>
                          {vArchiveUserData.userName !== '' &&
                          (rivalSongData.patterns[`${keyMode}B`][value] !== undefined ||
                            isScored) ? (
                            <div className='tw-relative tw-w-full tw-h-6 tw-bg-gray-900 tw-rounded-sm tw-overflow-hidden'>
                              <div
                                className='tw-h-full tw-transition-all tw-duration-1000 tw-ease-out'
                                style={{
                                  width: mounted
                                    ? `${rivalSongData.patterns[`${keyMode}B`][value]?.score ? Number(rivalSongData.patterns[`${keyMode}B`][value].score) : 0}%`
                                    : '0%',
                                  backgroundColor:
                                    value === 'NM'
                                      ? '#f5bb01' // respect-nm-5
                                      : value === 'HD'
                                        ? '#f95b08aa' // respect-nm-10
                                        : value === 'MX'
                                          ? '#f30253aa' // respect-nm-15
                                          : value === 'SC'
                                            ? '#3d66ff'
                                            : '', // respect-sc-15
                                }}
                              />
                              <div className='tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-white'>
                                {getScoreDisplayText(rivalSongData.patterns[`${keyMode}B`][value])}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ),
                  )}
                </div>
                {rivalName !== '' && (
                  <span className='tw-text-xs tw-font-light tw-text-gray-300 tw-my-2'>
                    <span className=''>{rivalName}</span>님의 성과 기록
                  </span>
                )}
              </div>
            )}
          </div>
        </Tooltip>
      }
    >
      <div
        ref={ref}
        className='tw-inline-flex tw-flex-col tw-transition-all'
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={`/hja/db/title/${displayData?.title ?? songItemTitle}`}
          className='tw-relative tw-rounded-md hover-scale-110 respect_record tw-cursor-pointer'
          style={{ width: size, height: size }}
        >
          {inView && (
            <Image
              loading='lazy'
              src={imageUrl}
              className={`tw-absolute tw-rounded-md tw-shadow-lg ${imageLoaded ? 'tw-animate-fadeIn' : 'tw-opacity-0'}`}
              width={rivalName ? 70 : size}
              height={rivalName ? 70 : size}
              alt=''
              onLoad={handleImageLoad}
              style={{ objectFit: 'cover' }}
            />
          )}
          {isVisibleCode ? (
            <span className='tw-absolute tw-top-0 tw-left-0 respect_dlc_code_wrap tw-rounded-tl-md'>
              <span className={`respect_dlc_code respect_dlc_code_${displayData?.dlcCode ?? ''}`}>
                {displayData?.dlcCode ?? ''}
              </span>
            </span>
          ) : null}
          {displayData?.pattern && (
            <span
              className={`tw-absolute tw-right-0 tw-bottom-0 pattern tw-rounded-br-md ${displayData.pattern}`}
            >
              <span className={`tw-text-white`}>
                {String(displayData.pattern)} {String(displayData.level).replace('.5', '')}
              </span>
            </span>
          )}
        </Link>
        {vArchiveUserData.userName !== '' && isScored && displayData ? (
          <span
            className={
              'tw-w-full tw-bg-gray-950 tw-text-center tw-rounded-md tw-text-xs tw-font-bold mt-2'
            }
          >
            {getSCPatternScoreDisplayText(displayData.patterns, keyMode)}
          </span>
        ) : null}
      </div>
    </OverlayTrigger>
  )
}

export default ScorePopupComponent
