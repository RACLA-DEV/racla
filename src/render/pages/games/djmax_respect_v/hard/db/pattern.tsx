import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Icon } from '@iconify/react/dist/iconify.js'
import Image from '@render/components/image/Image'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { setIsOpenExternalLink, setOpenExternalLink } from '@render/store/slices/uiSlice'
import { SongData } from '@src/types/games/SongData'
import { Link, useParams } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'
import { v4 as uuidv4 } from 'uuid'
import apiClient from '../../../../../../libs/apiClient'

interface RankingEntry {
  nickname: string
  score: number
  rate: number
  max_combo: boolean
}

interface RankingData {
  code: string
  data: RankingEntry[]
}

const DmrvHardDbPatternPage = () => {
  const { showNotification } = useNotificationSystem()
  const params = useParams()
  const dispatch = useDispatch()
  const { songData, selectedGame } = useSelector((state: RootState) => state.app)

  const [baseSongData, setBaseSongData] = useState<SongData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [rankingData, setRankingData] = useState<RankingEntry[]>([])
  const [isLoadingRanking, setIsLoadingRanking] = useState<boolean>(false)

  useEffect(() => {
    if (params.id && params.patternName) {
      setBaseSongData(
        songData[selectedGame].filter((songItem) => String(songItem.title) == String(params.id)),
      )
    }
  }, [params.id, params.patternName])

  useEffect(() => {
    if (baseSongData.length > 0) {
      setIsLoading(false)
      void fetchRankingData()
    }
  }, [baseSongData])

  const fetchRankingData = async () => {
    if (!params.patternName) return

    setIsLoadingRanking(true)
    try {
      const [button, level, judge] = String(params.patternName).split('-')

      const response = await apiClient.getProxy<RankingData>(
        `https://hard-archive.com/api/v2/record?button=${button}&lv=${level}&song=${baseSongData[0].uuid}&judge=${judge.toLowerCase()}&limit=30`,
      )

      setRankingData(response.data.data.data || [])
    } catch (error) {
      createLog('error', 'Error fetching ranking data:', error)
      showNotification(
        {
          ns: 'db',
          value: 'failedToFetchRanking',
          mode: 'i18n',
        },
        'error',
      )
    } finally {
      setIsLoadingRanking(false)
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'tw:text-yellow-500 tw:dark:text-yellow-400'
      case 2:
        return 'tw:text-slate-400 tw:dark:text-slate-300'
      case 3:
        return 'tw:text-amber-700 tw:dark:text-amber-600'
      default:
        return 'tw:text-slate-500 tw:dark:text-slate-400'
    }
  }

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'tw:bg-yellow-500/20 tw:dark:bg-yellow-400/20 tw:border-yellow-500 tw:dark:border-yellow-400'
      case 2:
        return 'tw:bg-slate-400/20 tw:dark:bg-slate-300/20 tw:border-slate-400 tw:dark:border-slate-300'
      case 3:
        return 'tw:bg-amber-700/20 tw:dark:bg-amber-600/20 tw:border-amber-700 tw:dark:border-amber-600'
      default:
        return 'tw:bg-slate-500/10 tw:dark:bg-slate-400/10 tw:border-slate-300 tw:dark:border-slate-600'
    }
  }

  if (!isLoading && baseSongData.length > 0 && params.patternName) {
    const [button, level, judge] = String(params.patternName).split('-')

    return (
      <React.Fragment>
        <div className='tw:flex tw:flex-col tw:gap-4 tw:h-full'>
          {/* 곡 정보 상단부 */}
          <div className='tw:w-full'>
            <div className='tw:flex tw:flex-col tw:gap-1 tw:relative tw:bg-opacity-10 tw:rounded-md tw:mb-4 tw:h-auto tw:border tw:border-slate-200 tw:dark:border-slate-700'>
              <div className='tw:absolute tw:inset-0 tw:overflow-hidden'>
                <Image
                  src={`${import.meta.env.VITE_CDN_URL}/djmax_respect_v/jackets/${params.id}.jpg`}
                  alt=''
                  className='tw:opacity-50 tw:blur-xl'
                  style={{
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
                <div className='tw:absolute tw:inset-0 tw:bg-white/90 tw:dark:bg-slate-800/75' />
              </div>

              <div className='tw:flex tw:justify-between tw:animate-fadeInLeft tw:rounded-lg tw:backdrop-blur-sm tw:relative'>
                <div className='tw:flex tw:relative tw:p-2 tw:gap-2 tw:backdrop-blur-sm tw:rounded-md'>
                  <Image
                    loading='lazy'
                    src={`${import.meta.env.VITE_CDN_URL}/djmax_respect_v/jackets/${params.id}.jpg`}
                    height={80}
                    width={80}
                    alt=''
                    className='tw:rounded-md tw:shadow-md'
                  />
                  <div className='tw:flex tw:flex-col tw:w-full tw:flex-1 tw:justify-end tw:leading-none tw:p-1'>
                    <span className='tw:flex tw:text-sm tw:font-light tw:text-slate-600 tw:dark:text-slate-300'>
                      {baseSongData[0].composer}
                    </span>
                    <span className='tw:text-lg tw:font-extrabold tw:tracking-tight'>
                      {baseSongData[0].name}
                    </span>
                  </div>
                </div>
                <div className='tw:flex tw:absolute tw:right-2 tw:text-xs tw:top-2 tw:gap-1'>
                  <Link
                    to={`/games/djmax_respect_v/db/${baseSongData[0].title}`}
                    className='tw:inline-flex tw:items-center tw:gap-2 tw:bg-slate-100 tw:border tw:dark:border-0 tw:border-slate-200 tw:dark:bg-slate-700 tw:text-slate-800 tw:dark:text-slate-300 tw:rounded-md hover:tw:bg-indigo-600 tw:transition-colors tw:text-xs tw:py-1 tw:px-2'
                  >
                    <Icon icon='lucide:database' />
                    <span>내 기록 (V-ARCHIVE)</span>
                  </Link>
                  <div className='tw:rounded-md tw:bg-slate-100 tw:border tw:dark:border-0 tw:border-slate-200 tw:dark:bg-slate-700 tw:text-slate-800 tw:dark:text-slate-300 tw:p-1'>
                    <span className='djmax_respect_v_dlc_code_wrap'>
                      <span
                        className={`djmax_respect_v_dlc_code djmax_respect_v_dlc_code_${baseSongData[0].dlcCode}`}
                      >
                        {baseSongData[0].dlc}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 랭킹 목록 */}
            <div className='tw:flex tw:flex-col tw:gap-4 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:shadow-md tw:p-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
              {/* 헤더 */}
              <div className='tw:flex tw:justify-between tw:items-center tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:pb-4'>
                <div className='tw:flex tw:items-center tw:gap-4'>
                  <h1 className='tw:text-xl tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                    {button} - {level.replace('MX', 'MX ').replace('SC', 'SC ')} - {judge} 판정
                  </h1>
                  <span className='tw:text-slate-500 tw:dark:text-slate-400 tw:text-sm'>
                    상위 30위
                  </span>
                </div>
                <Link
                  to={`/games/djmax_respect_v/hard/db/${params.id}`}
                  className='tw:bg-indigo-600 hover:tw:bg-indigo-700 tw:text-white tw:px-4 tw:py-1.5 tw:text-sm tw:rounded-md tw:transition-all tw:flex tw:items-center tw:gap-1'
                >
                  <Icon icon='lucide:arrow-left' className='tw:w-4 tw:h-4' />
                  <span>돌아가기</span>
                </Link>
              </div>

              {/* 랭킹 데이터 */}
              {isLoadingRanking ? (
                <div className='tw:flex tw:justify-center tw:py-12'>
                  <PuffLoader color='#6366f1' size={32} />
                </div>
              ) : rankingData.length === 0 ? (
                <div className='tw:text-slate-500 tw:dark:text-slate-400 tw:text-center tw:py-12 tw:flex tw:flex-col tw:items-center tw:gap-2'>
                  <Icon icon='lucide:info' className='tw:w-8 tw:h-8' />
                  <span>등록된 기록이 없습니다</span>
                </div>
              ) : (
                <div className='tw:space-y-2'>
                  {rankingData.map((entry, index) => (
                    <div
                      key={`${index}_${uuidv4()}`}
                      className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:cursor-pointer tw:rounded-lg tw:p-3 tw:flex tw:justify-between tw:items-center tw:border tw:border-slate-200 tw:dark:border-slate-700 hover:tw:bg-slate-100 hover:tw:dark:bg-slate-700 tw:transition-all'
                      onClick={() => {
                        dispatch(setIsOpenExternalLink(true))
                        dispatch(
                          setOpenExternalLink(`https://hard-archive.com/user/${entry.nickname}`),
                        )
                      }}
                    >
                      <div className='tw:flex tw:items-center tw:space-x-3'>
                        <div
                          className={`tw:w-9 tw:h-9 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:border ${getRankBgColor(index + 1)}`}
                        >
                          <span className={`tw:text-sm tw:font-bold ${getRankColor(index + 1)}`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className='tw:h-9 tw:w-9 tw:rounded-full tw:bg-slate-200 tw:dark:bg-slate-700 tw:flex tw:items-center tw:justify-center'>
                          <Icon
                            icon='lucide:user'
                            className='tw:w-5 tw:h-5 tw:text-slate-700 tw:dark:text-slate-300'
                          />
                        </div>
                        <div className='tw:flex tw:flex-col'>
                          <span className='tw:text-sm tw:font-medium tw:text-slate-900 tw:dark:text-white'>
                            {entry.nickname === '#탈퇴한사용자' ? (
                              <span className='tw:text-slate-400 tw:dark:text-slate-500'>
                                {entry.nickname}
                              </span>
                            ) : (
                              entry.nickname
                            )}
                          </span>
                        </div>
                      </div>
                      <div className='tw:flex tw:flex-col tw:items-end tw:gap-1'>
                        <div className='tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-medium tw:text-slate-900 tw:dark:text-white'>
                          <Icon
                            icon='lucide:bar-chart-2'
                            className='tw:w-4 tw:h-4 tw:text-indigo-600 tw:dark:text-indigo-400'
                          />
                          <span>{entry.score.toLocaleString()}</span>
                        </div>
                        <div className='tw:flex tw:items-center tw:gap-2'>
                          <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                            정확도: {entry.rate.toFixed(2)}%
                          </span>
                          {entry.max_combo && (
                            <span className='tw:flex tw:items-center tw:gap-0.5 tw:text-xs tw:text-yellow-500 tw:dark:text-yellow-400'>
                              <Icon icon='lucide:zap' className='tw:w-3 tw:h-3' />
                              <span>MAX COMBO</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }

  return (
    <div className='tw:flex tw:justify-center tw:items-center tw:h-full'>
      <PuffLoader color='#6366f1' size={32} />
    </div>
  )
}

export default DmrvHardDbPatternPage
