import React, { useEffect, useState } from 'react'

import axios from 'axios'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import Head from 'next/head'
import { SyncLoader } from 'react-spinners'
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

type RankingType = 'daily' | 'total'

const HjaRankingPage = () => {
  const [totalRankingData, setTotalRankingData] = useState<TotalRankingData | null>(null)
  const [dailyRankingData, setDailyRankingData] = useState<DailyRankingData | null>(null)
  const [selectedRanking, setSelectedRanking] = useState<RankingType>('daily')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRankingData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [dailyResponse, totalResponse] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://hard-archive.com/api/v2/ranking/top-rank`,
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://hard-archive.com/api/v2/ranking/total`,
        ),
      ])

      setDailyRankingData(dailyResponse.data.data)
      setTotalRankingData(totalResponse.data.data)
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
        return 'tw-text-yellow-400'
      case 2:
        return 'tw-text-gray-300'
      case 3:
        return 'tw-text-amber-600'
      default:
        return 'tw-text-gray-400'
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

  const renderRankingEntry = (entry: any) => {
    const isDaily = selectedRanking === 'daily'
    return (
      <div
        key={`${entry.rank}_${Buffer.from(entry.nickname).toString('base64')}`}
        className='tw-bg-gray-700 tw-bg-opacity-25 tw-cursor-pointer tw-rounded-lg tw-p-4 tw-flex tw-justify-between tw-items-center hover:tw-bg-gray-600 tw-transition-all'
        onClick={() => {
          window.ipc.send('openBrowser', `https://hard-archive.com/user/${entry.nickname}`)
        }}
      >
        <div className='tw-flex tw-items-center tw-space-x-4'>
          <span className={`tw-text-xl tw-font-bold ${getRankColor(entry.rank)}`}>
            #{entry.rank}
          </span>
          <div className='tw-flex tw-flex-col'>
            <span className='tw-text-lg tw-text-white'>
              {entry.nickname === '#탈퇴한사용자' ? (
                <span className='tw-text-gray-500'>{entry.nickname}</span>
              ) : (
                entry.nickname
              )}
            </span>
            {entry.subRank && (
              <span className='tw-text-sm tw-text-gray-400'>
                {isDaily ? '종합' : '전일'} 랭킹: #{entry.subRank}
              </span>
            )}
          </div>
        </div>
        <div className='tw-flex tw-flex-col tw-items-end tw-gap-2'>
          {isDaily ? (
            <>
              <div className='tw-flex tw-items-center tw-gap-4 tw-text-gray-200'>
                <span>{entry.count}개 전일 달성</span>
              </div>
              {entry.subScore && (
                <div className='tw-flex tw-items-center tw-gap-4 tw-text-sm tw-text-gray-400'>
                  <span>환산: {entry.subScore.a?.toFixed(1) ?? '-'}</span>
                  <span>퍼펙트: {entry.subScore.b ?? '-'}</span>
                  <span>종합: {entry.subScore.c?.toFixed(1) ?? '-'}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className='tw-flex tw-items-center tw-gap-4 tw-text-gray-200'>
                <span>환산: {entry.score.a.toFixed(1)}</span>
                <span>퍼펙트: {entry.score.b}</span>
                <span>종합: {entry.score.c.toFixed(1)}</span>
              </div>
              {entry.subScore && (
                <div className='tw-flex tw-items-center tw-gap-4 tw-text-sm tw-text-gray-400'>
                  <span>전일 달성: {entry.subScore.count ?? '-'}개</span>
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
      <Head>
        <title>전일 아카이브 랭킹 - RACLA</title>
      </Head>
      <div className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-shadow-lg p-4'>
        <div className='tw-flex tw-justify-between tw-items-center'>
          <div className='tw-flex tw-items-center tw-gap-4'>
            <h1 className='tw-text-3xl tw-font-bold tw-text-white'>랭킹</h1>
            <div className='tw-flex tw-gap-2'>
              <button
                onClick={() => handleRankingTypeChange('daily')}
                className={`tw-px-4 tw-py-1.5 tw-text-sm tw-rounded tw-transition-all ${
                  selectedRanking === 'daily'
                    ? 'tw-bg-blue-600 tw-text-white'
                    : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                }`}
              >
                전일 랭킹
              </button>
              <button
                onClick={() => handleRankingTypeChange('total')}
                className={`tw-px-4 tw-py-1.5 tw-text-sm tw-rounded tw-transition-all ${
                  selectedRanking === 'total'
                    ? 'tw-bg-blue-600 tw-text-white'
                    : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                }`}
              >
                종합 랭킹
              </button>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className='tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-4 tw-py-1.5 tw-text-sm tw-rounded tw-transition-all'
          >
            새로고침
          </button>
        </div>

        <div className='tw-flex tw-items-center'>
          {selectedRanking === 'daily' && dailyRankingData?.renew_time ? (
            <span className='tw-ms-auto tw-text-gray-400 tw-text-sm'>
              전일 랭킹 최종 업데이트:{' '}
              {dayjs.unix(dailyRankingData.renew_time).locale('ko').format('LLL')}
            </span>
          ) : selectedRanking === 'total' && totalRankingData?.renew_time ? (
            <span className='tw-ms-auto tw-text-gray-400 tw-text-sm'>
              종합 랭킹 최종 업데이트:{' '}
              {dayjs.unix(totalRankingData.renew_time).locale('ko').format('LLL')}
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className='tw-flex tw-justify-center tw-py-8'>
            <SyncLoader color='#ffffff' size={8} />
          </div>
        ) : error ? (
          <div className='tw-text-red-400 tw-text-center tw-py-8'>{error}</div>
        ) : getMergedRankingData().length === 0 ? (
          <div className='tw-text-gray-400 tw-text-center tw-py-8'>랭킹 데이터가 없습니다</div>
        ) : (
          <div className='tw-space-y-4'>{getMergedRankingData().map(renderRankingEntry)}</div>
        )}
      </div>
    </React.Fragment>
  )
}

export default HjaRankingPage
