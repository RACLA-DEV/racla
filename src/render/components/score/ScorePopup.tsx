import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { Icon } from '@iconify/react/dist/iconify.js'
import { globalDictionary } from '@render/constants/globalDictionary'
import { useAuth } from '@render/hooks/useAuth'
import {
  getDifficultyClassName,
  getDifficultyColor,
  getDifficultyTextClassName,
  getScoreDisplayText,
} from '@render/libs/gameUtils'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { GameType } from '@src/types/games/GameType'
import { SongData } from '@src/types/games/SongData'
import * as R from 'ramda'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import apiClient from '../../../libs/apiClient'

interface ScorePopupComponentProps {
  songTitle: number
  keyMode: string
  isVisibleCode?: boolean
  size?: number
}

const ScorePopupComponent = ({
  songTitle,
  keyMode,
  isVisibleCode = false,
  size = 80,
}: ScorePopupComponentProps) => {
  const { songData } = useSelector((state: RootState) => state.app)
  const { userData, isLoggedIn } = useAuth()
  const { theme } = useSelector((state: RootState) => state.ui)
  const { font } = useSelector((state: RootState) => state.app.settingData)
  const [songItem, setSongItem] = useState<SongData | null>(null)
  const [scoreData, setScoreData] = useState<SongData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [game, setGame] = useState<GameType>('djmax_respect_v')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])
  const { t } = useTranslation(['games'])

  // 툴팁 위치 계산
  useEffect(() => {
    if (isHovered && !isLoading && songItem && triggerRef.current) {
      // triggerRef의 위치 기반으로 고정 위치 계산
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // 고정 크기로 가정하여 툴팁 위치 계산 (툴팁 ref가 없어도 작동)
      const tooltipWidth = 400 // 대략적인 툴팁 너비
      const tooltipHeight = 300 // 대략적인 툴팁 높이

      // 기본 위치 (오른쪽)
      let posX = triggerRect.right
      let posY = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2

      // 오른쪽에 공간이 부족한 경우 왼쪽에 표시
      if (posX + tooltipWidth > viewportWidth) {
        posX = triggerRect.left - tooltipWidth - 10
      }

      // 상하단에 공간이 부족한 경우 조정
      if (posY < 10) {
        posY = 10
      } else if (posY + tooltipHeight > viewportHeight - 10) {
        posY = viewportHeight - tooltipHeight - 10
      }

      setTooltipPosition({ x: posX, y: posY })
    } else {
      setTooltipPosition(null)
    }
  }, [isHovered, isLoading, songItem])

  useEffect(() => {
    const fetchData = async () => {
      const title = String(songTitle)

      setGame(
        ((): GameType => {
          switch (true) {
            case songTitle < 1000000:
              return 'djmax_respect_v'
            case songTitle >= 1000000 && songTitle < 20000000:
              return 'wjmax'
            case songTitle >= 40000000 && songTitle < 50000000:
              return 'platina_lab'
            default:
              return 'djmax_respect_v'
          }
        })(),
      )

      setSongItem(
        R.pipe(
          R.values,
          R.flatten,
        )(songData).find((item: SongData) => String(item.title) === title) as SongData,
      )

      if (!isLoggedIn || !songTitle) {
        setIsLoading(false)
        return
      }

      try {
        // 10000000 이상은 RACLA 고유 번호로 사용
        if (game !== 'djmax_respect_v') {
          const response = await apiClient.get<SongData>(
            `/v3/racla/songs/${game}/${title}/user/${userData.playerId}`,
            {
              headers: {
                Authorization: `${userData.playerId}|${userData.playerToken}`,
              },
              withCredentials: true,
            },
          )
          if (response.status === 200) {
            const { data } = response.data
            setScoreData(data)
          }
        } else {
          if (userData.vArchiveUserInfo.isLinked && userData.vArchiveUserInfo.nickname !== '') {
            const response = await apiClient.getProxy<SongData>(
              `https://v-archive.net/api/archive/${userData.vArchiveUserInfo.nickname}/title/${title}`,
            )
            if (response.status === 200) {
              const { data } = response.data
              setScoreData(data)
            }
          }
        }
      } catch (error) {
        createLog('error', 'fetching song data', { ...userData })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [songTitle])

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return songItem && !isLoading ? (
    <>
      <div
        ref={triggerRef}
        className={`tw:inline-flex tw:flex-col tw:transition-all tw:duration-300 ${
          isHovered ? 'tw:scale-105' : ''
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          to={`/${game}/db/title/${songTitle}`}
          className={`tw:relative tw:rounded-md hover-scale-110 tw:cursor-pointer ${game}_record`}
          style={{ width: size, height: size }}
        >
          <img
            loading='lazy'
            src={`${import.meta.env.VITE_CDN_URL}${
              globalDictionary.gameDictionary[game]?.jacketsUrl || ''
            }/${songTitle}.jpg`}
            className={`tw:absolute tw:rounded-md tw:shadow-lg ${
              imageLoaded ? 'tw:animate-fadeIn' : 'tw:opacity-0'
            }`}
            width={size}
            height={size}
            alt={songItem?.name || ''}
            onLoad={handleImageLoad}
            style={{ objectFit: 'cover' }}
          />
          {isVisibleCode ? (
            <span className='tw:absolute tw:top-0 tw:left-0 respect_dlc_code_wrap tw:rounded-tl-md'>
              <span className={`${game}_dlc_code ${game}_dlc_code_${songItem?.dlcCode ?? ''}`}>
                {songItem?.dlcCode ?? ''}
              </span>
            </span>
          ) : null}
          {/* {songItem?.pattern && (
            <span
              className={`tw:absolute tw:right-0 tw:bottom-0 pattern tw:rounded-br-md ${songItem.pattern}`}
            >
              <span className={`tw:text-white`}>
                {String(songItem.pattern)} {String(songItem.level)}
              </span>
            </span>
          )} */}
        </Link>
        {/* {((game === 'djmax_respect_v' && userData.vArchiveUserInfo.nickname !== '') ||
          game != 'djmax_respect_v') &&
        scoreData ? (
          <span
            className={
              'tw:w-full tw:bg-gray-950 tw:text-center tw:rounded-md tw:text-xs tw:font-bold mt-2'
            }
          >
            {getSCPatternScoreDisplayText(game, scoreData?.patterns)}
          </span>
        ) : null} */}
      </div>

      {/* 커스텀 툴팁 - 임시로 항상 표시하도록 수정 */}
      <div
        ref={tooltipRef}
        className={`tw:fixed tw:z-50 tw:rounded-md tw:shadow-lg tw:border tw:backdrop-blur-sm tw:transition-opacity ${
          isHovered && tooltipPosition
            ? 'tw:opacity-100 tw:animate-fadeIn'
            : 'tw:opacity-0 tw:pointer-events-none'
        } ${
          theme === 'dark'
            ? 'tw:bg-slate-800/95 tw:border-slate-700/40'
            : 'tw:bg-white/95 tw:border-indigo-100/40'
        } ${font != 'default' ? 'tw:font-medium' : ''}`}
        style={{
          left: tooltipPosition ? tooltipPosition.x : 0,
          top: tooltipPosition ? tooltipPosition.y : 0,
          maxWidth: '400px',
          display: tooltipPosition ? 'block' : 'none',
        }}
      >
        <div className='tw:flex tw:gap-2 tw:p-2'>
          <div className='tw:flex tw:flex-col'>
            <div className='tw:flex tw:flex-col tw:w-80 tw:h-32 tw:relative tw:mb-2 tw:overflow-hidden tw:rounded-md'>
              <img
                loading='lazy'
                src={`${import.meta.env.VITE_CDN_URL}${
                  globalDictionary.gameDictionary[game]?.jacketsUrl || ''
                }/${songTitle}.jpg`}
                className={`tw:absolute tw:blur-sm`}
                alt=''
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className={`tw:absolute tw:inset-0 tw:bg-slate-800/75`} />
              <span className='tw:absolute tw:left-0 tw:bottom-1 tw:px-2 tw:font-bold tw:text-left tw:break-keep'>
                <span className={`tw:font-medium tw:text-xs tw:text-slate-200`}>
                  {songItem?.composer || songItem?.artist}
                </span>
                <br />
                <span className={`tw:text-xl tw:text-white`}>{songItem?.name}</span>
              </span>
              <span
                className={`tw:absolute tw:text-xs tw:p-1 tw:top-1 tw:right-1 ${game}_dlc_code_wrap tw:animate-fadeInLeft tw:rounded-md tw:bg-opacity-80 tw:bg-slate-900 } p-1`}
              >
                <span className={`${game}_dlc_code ${game}_dlc_code_${songItem?.dlcCode ?? ''}`}>
                  {songItem?.dlc ?? ''}
                </span>
              </span>
            </div>
            <div
              className={`tw:flex tw:flex-col tw:gap-2 tw:w-80 tw:p-2 tw:rounded-md ${
                theme === 'dark' ? 'tw:bg-slate-700/25' : 'tw:bg-indigo-100/25'
              }`}
            >
              {[
                'NM',
                'HD',
                'MX',
                'SC',
                'DPC',
                'EASY',
                'HARD',
                'OVER',
                'PLUS_1',
                'PLUS_2',
                'PLUS_3',
              ].map(
                (value) =>
                  songItem?.patterns[`${keyMode}B`]?.[value] !== undefined &&
                  songItem?.patterns[`${keyMode}B`]?.[value] !== null && (
                    <div
                      className='tw:flex tw:flex-col tw:gap-2'
                      key={'songDataPack_item' + songItem.title + '_hover' + value}
                    >
                      <div className='tw:flex tw:items-center tw:gap-1'>
                        <span className={getDifficultyTextClassName(game, value)}>
                          {t(globalDictionary.gameDictionary[game].difficulty[value].fullName)}
                        </span>
                        <Icon
                          icon='lucide:star'
                          height={14}
                          width={14}
                          className={getDifficultyColor(game, value)}
                        />
                        <span className={getDifficultyClassName(game, value)}>
                          {songItem?.patterns[`${keyMode}B`][value].level}{' '}
                          <sup className='tw:text-xs'>
                            {songItem?.patterns[`${keyMode}B`][value].floor !== undefined &&
                            songItem?.patterns[`${keyMode}B`][value].floor !== null &&
                            songItem?.patterns[`${keyMode}B`][value].floor > 0
                              ? `(${songItem?.patterns[`${keyMode}B`][value].floor}F)`
                              : null}
                          </sup>
                        </span>
                      </div>
                      {scoreData && scoreData.patterns[`${keyMode}B`][value] !== undefined ? (
                        <div
                          className={`tw:relative tw:w-full tw:h-6 tw:rounded-sm tw:overflow-hidden ${
                            theme === 'dark' ? 'tw:bg-slate-900' : 'tw:bg-slate-400'
                          }`}
                        >
                          <div
                            className='tw:h-full tw:transition-all tw:duration-1000 tw:ease-out'
                            style={{
                              width: `${scoreData.patterns[`${keyMode}B`][value]?.score ? Number(scoreData.patterns[`${keyMode}B`][value].score) : 0}%`,
                              backgroundColor: getDifficultyColor(game, value),
                            }}
                          />
                          <div className='tw:absolute tw:text-xs tw:inset-0 tw:flex tw:items-center tw:justify-center tw:font-bold tw:text-white'>
                            {getScoreDisplayText(game, songItem?.patterns[`${keyMode}B`][value])}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null
}

export default ScorePopupComponent
