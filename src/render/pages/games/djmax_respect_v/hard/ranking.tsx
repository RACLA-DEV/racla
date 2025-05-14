import 'dayjs/locale/ko'

import React, { useEffect, useState } from 'react'

import { Icon } from '@iconify/react'
import { setIsOpenExternalLink, setOpenExternalLink } from '@render/store/slices/uiSlice'
import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import { useDispatch } from 'react-redux'
import { PuffLoader } from 'react-spinners'
import { v4 as uuidv4 } from 'uuid'
import apiClient from '../../../../..//libs/apiClient'
dayjs.locale('ko')
dayjs.extend(LocalizedFormat)

interface Score {
  a: number
  b: number
  c: number
}

interface TotalRankingEntry {
  nickname: string
  rank: number
  score: Score
}

interface DailyRankingEntry {
  nickname: string
  rank: number
  count: number
}

interface TotalRankingData {
  renew_time: number
  chart: TotalRankingEntry[]
}

interface DailyRankingData {
  renew_time: number
  chart: DailyRankingEntry[]
}

interface DailyRankingResponse {
  data: DailyRankingData
  code: string
}

interface TotalRankingResponse {
  data: TotalRankingData
  code: string
}

type RankingType = 'daily' | 'total'

const DmrvHardRankingPage = () => {
  const [totalRankingData, setTotalRankingData] = useState<TotalRankingData | null>(null)
  const [dailyRankingData, setDailyRankingData] = useState<DailyRankingData | null>(null)
  const [selectedRanking, setSelectedRanking] = useState<RankingType>('daily')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useDispatch()

  const fetchRankingData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [dailyResponse, totalResponse] = await Promise.all([
        apiClient.getProxy<DailyRankingResponse>(
          `https://hard-archive.com/api/v2/ranking/top-rank`,
        ),
        apiClient.getProxy<TotalRankingResponse>(`https://hard-archive.com/api/v2/ranking/total`),
      ])

      setDailyRankingData(dailyResponse.data.data.data)
      setTotalRankingData(totalResponse.data.data.data)
    } catch (err) {
      setError('랭킹 데이터를 불러오는 데 실패했습니다.')
      console.error('Error fetching ranking data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!dailyRankingData || !totalRankingData) {
      fetchRankingData()
    }
  }, [])

  const handleRankingTypeChange = (type: RankingType) => {
    setSelectedRanking(type)
  }

  const handleRefresh = () => {
    fetchRankingData()
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

  const getRankIconBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'tw:border-yellow-500 tw:dark:border-yellow-400'
      case 2:
        return 'tw:border-slate-400 tw:dark:border-slate-300'
      case 3:
        return 'tw:border-amber-700 tw:dark:border-amber-600'
      default:
        return 'tw:border-slate-300 tw:dark:border-slate-600'
    }
  }

  const getMergedRankingData = () => {
    if (selectedRanking === 'daily') {
      return (
        dailyRankingData?.chart.map((entry) => {
          const totalEntry = totalRankingData?.chart.find(
            (item) => item.nickname === entry.nickname,
          )
          return {
            ...entry,
            subRank: totalEntry?.rank,
            subScore: totalEntry?.score,
          }
        }) || []
      )
    } else {
      return (
        totalRankingData?.chart.map((entry) => {
          const dailyEntry = dailyRankingData?.chart.find(
            (item) => item.nickname === entry.nickname,
          )
          return {
            ...entry,
            subRank: dailyEntry?.rank,
            subScore: { count: dailyEntry?.count },
          }
        }) || []
      )
    }
  }

  const renderTopRankers = () => {
    const topThree = getMergedRankingData().slice(0, 3)
    if (topThree.length === 0) return null

    return (
      <div className='tw:grid tw:grid-cols-3 tw:gap-4 tw:mb-8'>
        {topThree.map((entry) => {
          const isDaily = selectedRanking === 'daily'
          return (
            <div
              key={`top_${entry.rank}_${uuidv4()}`}
              className={`tw:flex tw:flex-col tw:items-center tw:justify-between tw:rounded-lg tw:p-4 tw:cursor-pointer tw:transition-all tw:border tw:border-opacity-50 hover:tw:brightness-110 ${getRankBgColor(entry.rank)}`}
              onClick={() => {
                dispatch(setIsOpenExternalLink(true))
                dispatch(setOpenExternalLink(`https://hard-archive.com/user/${entry.nickname}`))
              }}
            >
              <div className='tw:flex tw:flex-col tw:items-center tw:space-y-3 tw:w-full'>
                <div
                  className={`tw:relative tw:w-20 tw:h-20 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:border-2 ${getRankBgColor(entry.rank)}`}
                >
                  <Icon
                    icon='lucide:user'
                    className='tw:w-10 tw:h-10 tw:text-slate-700 tw:dark:text-slate-300'
                  />
                  <div
                    className={`tw:absolute tw:-bottom-1 tw:-right-1 tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:border tw:border-opacity-50 tw:bg-white tw:dark:bg-slate-800 ${getRankIconBgColor(entry.rank)}`}
                  >
                    <span className={`tw:text-sm tw:font-bold ${getRankColor(entry.rank)}`}>
                      {entry.rank}
                    </span>
                  </div>
                </div>

                <div className='tw:flex tw:flex-col tw:items-center tw:w-full'>
                  <span className='tw:text-base tw:font-bold tw:text-slate-900 tw:dark:text-white tw:text-center tw:truncate tw:w-full'>
                    {entry.nickname === '#탈퇴한사용자' ? (
                      <span className='tw:text-slate-500 tw:dark:text-slate-400'>
                        {entry.nickname}
                      </span>
                    ) : (
                      entry.nickname
                    )}
                  </span>
                  {entry.subRank && (
                    <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                      {isDaily ? '종합' : '전일'} #{entry.subRank}
                    </span>
                  )}
                </div>
              </div>

              <div className='tw:flex tw:flex-col tw:items-center tw:mt-3 tw:w-full'>
                {isDaily ? (
                  <div className='tw:flex tw:flex-col tw:items-center tw:gap-1'>
                    <div className='tw:flex tw:items-center tw:gap-1'>
                      <Icon
                        icon='lucide:trophy'
                        className='tw:w-4 tw:h-4 tw:text-indigo-600 tw:dark:text-indigo-400'
                      />
                      <span className='tw:text-sm tw:font-medium tw:text-slate-900 tw:dark:text-white'>
                        {entry.count}개 달성
                      </span>
                    </div>
                    {entry.subScore && (
                      <div className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                        종합 : {entry.subScore.c?.toFixed(1) ?? '-'}점
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='tw:flex tw:flex-col tw:items-center tw:gap-1'>
                    <div className='tw:flex tw:items-center tw:gap-1'>
                      <Icon
                        icon='lucide:bar-chart-2'
                        className='tw:w-4 tw:h-4 tw:text-indigo-600 tw:dark:text-indigo-400'
                      />
                      <span className='tw:text-sm tw:font-medium tw:text-slate-900 tw:dark:text-white'>
                        {entry.score.c.toFixed(1) ?? '-'}점
                      </span>
                    </div>
                    {entry.subScore && (
                      <div className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                        전일: {entry.subScore.count ?? '-'}개
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderRankingEntry = (entry: any, index: number) => {
    // 상위 3등은 별도로 표시하므로 건너뜀
    if (index < 3) return null

    const isDaily = selectedRanking === 'daily'
    return (
      <div
        key={`${entry.rank}_${uuidv4()}`}
        className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:cursor-pointer tw:rounded-lg tw:p-3 tw:flex tw:justify-between tw:items-center tw:border tw:border-slate-200 tw:dark:border-slate-700 hover:tw:bg-slate-100 hover:tw:dark:bg-slate-700 tw:transition-all'
        onClick={() => {
          dispatch(setIsOpenExternalLink(true))
          dispatch(setOpenExternalLink(`https://hard-archive.com/user/${entry.nickname}`))
        }}
      >
        <div className='tw:flex tw:items-center tw:space-x-3'>
          <div
            className={`tw:w-9 tw:h-9 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:border ${getRankBgColor(entry.rank)}`}
          >
            <span className={`tw:text-sm tw:font-bold ${getRankColor(entry.rank)}`}>
              {entry.rank}
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
                <span className='tw:text-slate-400 tw:dark:text-slate-500'>{entry.nickname}</span>
              ) : (
                entry.nickname
              )}
            </span>
            {entry.subRank && (
              <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                {isDaily ? '종합' : '전일'} #{entry.subRank}
              </span>
            )}
          </div>
        </div>
        <div className='tw:flex tw:flex-col tw:items-end tw:gap-1'>
          {isDaily ? (
            <>
              <div className='tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-medium tw:text-slate-900 tw:dark:text-white'>
                <Icon
                  icon='lucide:trophy'
                  className='tw:w-4 tw:h-4 tw:text-indigo-600 tw:dark:text-indigo-400'
                />
                <span>{entry.count}개 달성</span>
              </div>
              {entry.subScore && (
                <div className='tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                  <span>종합 : {entry.subScore.c?.toFixed(1) ?? '-'}점</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className='tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-medium tw:text-slate-900 tw:dark:text-white'>
                <Icon
                  icon='lucide:bar-chart-2'
                  className='tw:w-4 tw:h-4 tw:text-indigo-600 tw:dark:text-indigo-400'
                />
                <span>{entry.score.c.toFixed(1) ?? '-'}점</span>
              </div>
              {entry.subScore && (
                <div className='tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                  <span>전일: {entry.subScore.count ?? '-'}개</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <React.Fragment>
      <div id='ContentHeader' />
      <div className='tw:flex tw:flex-col tw:gap-4'>
        <div className='tw:flex tw:flex-col tw:gap-6 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:shadow-md tw:p-6 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
          {/* 헤더 */}
          <div className='tw:flex tw:justify-between tw:items-center tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:pb-4'>
            <div className='tw:flex tw:items-center tw:gap-4'>
              <h1 className='tw:text-xl tw:font-bold tw:text-slate-900 tw:dark:text-white'>랭킹</h1>
              <div className='tw:flex tw:gap-2'>
                <button
                  onClick={() => handleRankingTypeChange('daily')}
                  className={`tw:px-4 tw:py-1.5 tw:text-sm tw:rounded-md tw:transition-all tw:flex tw:items-center tw:gap-1 ${
                    selectedRanking === 'daily'
                      ? 'tw:bg-indigo-600 tw:text-white'
                      : 'tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-600 tw:dark:text-slate-300 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600'
                  }`}
                >
                  <Icon icon='lucide:trophy' className='tw:w-4 tw:h-4' />
                  <span>전일 랭킹</span>
                </button>
                <button
                  onClick={() => handleRankingTypeChange('total')}
                  className={`tw:px-4 tw:py-1.5 tw:text-sm tw:rounded-md tw:transition-all tw:flex tw:items-center tw:gap-1 ${
                    selectedRanking === 'total'
                      ? 'tw:bg-indigo-600 tw:text-white'
                      : 'tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-600 tw:dark:text-slate-300 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600'
                  }`}
                >
                  <Icon icon='lucide:bar-chart-2' className='tw:w-4 tw:h-4' />
                  <span>종합 랭킹</span>
                </button>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className='tw:bg-indigo-600 hover:tw:bg-indigo-700 tw:text-white tw:px-4 tw:py-1.5 tw:text-sm tw:rounded-md tw:transition-all tw:flex tw:items-center tw:gap-1'
            >
              <Icon icon='lucide:refresh-cw' className='tw:w-4 tw:h-4' />
              <span>새로고침</span>
            </button>
          </div>

          {/* 업데이트 시간 */}
          <div className='tw:flex tw:items-center tw:mb-2'>
            {selectedRanking === 'daily' && dailyRankingData?.renew_time ? (
              <span className='tw:ms-auto tw:text-slate-500 tw:dark:text-slate-400 tw:text-sm tw:flex tw:items-center tw:gap-1'>
                <Icon icon='lucide:clock' className='tw:w-4 tw:h-4' />
                <span>
                  전일 랭킹 최종 업데이트:{' '}
                  {dayjs.unix(dailyRankingData.renew_time).locale('ko').format('LLL')}
                </span>
              </span>
            ) : selectedRanking === 'total' && totalRankingData?.renew_time ? (
              <span className='tw:ms-auto tw:text-slate-500 tw:dark:text-slate-400 tw:text-sm tw:flex tw:items-center tw:gap-1'>
                <Icon icon='lucide:clock' className='tw:w-4 tw:h-4' />
                <span>
                  종합 랭킹 최종 업데이트:{' '}
                  {dayjs.unix(totalRankingData.renew_time).locale('ko').format('LLL')}
                </span>
              </span>
            ) : null}
          </div>

          {/* 랭킹 데이터 */}
          {isLoading ? (
            <div className='tw:flex tw:justify-center tw:py-12'>
              <PuffLoader color='#6366f1' size={32} />
            </div>
          ) : error ? (
            <div className='tw:text-red-500 tw:dark:text-red-400 tw:text-center tw:py-12 tw:flex tw:flex-col tw:items-center tw:gap-2'>
              <Icon icon='lucide:alert-triangle' className='tw:w-8 tw:h-8' />
              <span>{error}</span>
            </div>
          ) : getMergedRankingData().length === 0 ? (
            <div className='tw:text-slate-500 tw:dark:text-slate-400 tw:text-center tw:py-12 tw:flex tw:flex-col tw:items-center tw:gap-2'>
              <Icon icon='lucide:info' className='tw:w-8 tw:h-8' />
              <span>랭킹 데이터가 없습니다</span>
            </div>
          ) : (
            <>
              {/* 상위 3명 */}
              {renderTopRankers()}

              {/* 나머지 랭킹 */}
              <div className='tw:space-y-2'>{getMergedRankingData().map(renderRankingEntry)}</div>
            </>
          )}
        </div>
      </div>
      <div id='ContentFooter' />
    </React.Fragment>
  )
}

export default DmrvHardRankingPage
