import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { globalDictionary } from '@constants/globalDictionary'
import { useNotificationSystem } from '@hooks/useNotifications'
import axios from 'axios'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FaDatabase } from 'react-icons/fa6'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

interface RankingEntry {
  nickname: string
  score: number
  rate: number
  max_combo: boolean
}

export default function VArchiveDbTitlePatternPage() {
  const { showNotification } = useNotificationSystem()
  const params = useParams()
  const dispatch = useDispatch()
  const { songData } = useSelector((state: RootState) => state.app)

  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [rankingData, setRankingData] = useState<RankingEntry[]>([])
  const [isLoadingRanking, setIsLoadingRanking] = useState<boolean>(false)

  useEffect(() => {
    if (params?.titleNo) {
      dispatch(setBackgroundBgaName(String(params?.titleNo)))
      setBaseSongData(
        songData.filter((songItem) => String(songItem.title) == String(params?.titleNo)),
      )
    }
  }, [params?.titleNo])

  useEffect(() => {
    if (baseSongData.length > 0) {
      setIsLoading(false)
      fetchRankingData()
    }
  }, [baseSongData])

  const fetchRankingData = async () => {
    if (!params?.hjaPattern) return

    setIsLoadingRanking(true)
    try {
      const [button, level, judge] = String(params.hjaPattern).split('-')

      const response = await axios.post(`${process.env.NEXT_PUBLIC_PROXY_API_URL}`, {
        url: 'https://hard-archive.com/api/v2/record',
        queryString: `button=${button}&lv=${level}&song=${baseSongData[0].hardArchiveTitle}&judge=${judge.toLowerCase()}&limit=30`,
      })

      setRankingData(response.data.data || [])
    } catch (error) {
      console.error('Error fetching ranking data:', error)
      showNotification('랭킹 데이터를 불러오는데 실패했습니다.', 'tw-bg-red-600')
    } finally {
      setIsLoadingRanking(false)
    }
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

  if (!isLoading && baseSongData.length > 0 && params?.hjaPattern) {
    const [button, level, judge] = String(params?.hjaPattern).split('-')

    return (
      <React.Fragment>
        <Head>
          <title>
            {baseSongData[0].name} - {button} - {level} - {judge} JUDGEMENT - 데이터베이스 - RACLA
          </title>
        </Head>
        <div className='tw-flex tw-gap-4 vh-screen'>
          {/* 곡 정보 상단부 (기존 코드 유지) */}
          <div className={`tw-flex tw-flex-col tw-transition-all tw-w-full duration-300`}>
            <div className='tw-flex tw-flex-col tw-gap-1 tw-relative tw-bg-opacity-10 tw-rounded-md tw-mb-4 tw-h-auto p-0'>
              <div className='tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md'>
                <Image
                  src={`https://cdn.racla.app/djmax_respect_v/jackets/${params?.titleNo}.jpg`}
                  layout='fill'
                  objectFit='cover'
                  alt=''
                  className='tw-opacity-50 tw-blur-xl'
                />
                <div className='tw-absolute tw-inset-0 tw-bg-gray-800 tw-bg-opacity-75' />
              </div>

              <div className='tw-flex tw-justify-between tw-animate-fadeInLeft flex-equal tw-bg-gray-900 tw-bg-opacity-30 tw-rounded-md p-4'>
                <div className='tw-flex tw-gap-3 tw-mt-auto tw-items-end'>
                  <Image
                    loading='lazy'
                    blurDataURL={globalDictionary.blurDataURL}
                    src={`https://cdn.racla.app/djmax_respect_v/jackets/${params?.titleNo}.jpg`}
                    height={90}
                    width={90}
                    alt=''
                    className='tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm'
                  />
                  <div className='tw-flex tw-flex-col tw-w-full'>
                    <span className='tw-flex tw-font-light tw-text-gray-300'>
                      {baseSongData[0].composer}
                    </span>
                    <span className='tw-text-lg tw-font-bold me-auto'>
                      {baseSongData[0].name}
                      <sup className='tw-text-xs tw-font-light tw-text-gray-300'>
                        {' '}
                        (전일 아카이브 : {baseSongData[0].hardArchiveTitle} / RACLA :{' '}
                        {baseSongData[0].title})
                      </sup>
                    </span>
                  </div>
                </div>
                <div className='tw-relative'>
                  <div className='tw-absolute tw-w-96 tw-top-0 tw-right-0 tw-flex tw-gap-2'>
                    <Link
                      href={`/vArchive/db/title/${baseSongData[0].title}`}
                      className='tw-ms-auto tw-inline-flex tw-items-center tw-gap-2 tw-animate-fadeInLeft tw-bg-gray-950 tw-bg-opacity-75 tw-rounded-md hover:tw-bg-gray-700 tw-transition-colors tw-text-sm p-1 px-2'
                    >
                      <FaDatabase className='tw-text-gray-300 tw-mt-0.5' />
                      <span className='tw-text-gray-300'>내 기록(V-ARCHIVE)</span>
                    </Link>
                    <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-950 tw-bg-opacity-75 p-1'>
                      <span className='respect_dlc_code_wrap'>
                        <span
                          className={`respect_dlc_code respect_dlc_code_${baseSongData[0].dlcCode}`}
                        >
                          {baseSongData[0].dlc}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 랭킹 목록 */}
            <div className='tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-4'>
              <div className='tw-flex tw-justify-between tw-items-center tw-mb-4'>
                <div className='tw-flex tw-items-center tw-gap-2'>
                  <h2 className='tw-text-xl tw-font-bold'>
                    {button} - {level.replace('MX', 'MX ').replace('SC', 'SC ')} - {judge} JUDGEMENT
                  </h2>
                  <span className='tw-text-gray-400 tw-text-sm'>상위 30위</span>
                </div>
              </div>

              {isLoadingRanking ? (
                <div className='tw-flex tw-justify-center tw-py-8'>
                  <SyncLoader color='#ffffff' size={8} />
                </div>
              ) : rankingData.length === 0 ? (
                <div className='tw-text-gray-400 tw-text-center tw-py-8'>
                  등록된 기록이 없습니다.
                </div>
              ) : (
                <div className='tw-space-y-4'>
                  {rankingData.map((entry, index) => (
                    <div
                      key={`${index}_${encodeURIComponent(entry.nickname)}`}
                      className='tw-bg-gray-800 tw-bg-opacity-75 tw-cursor-pointer tw-rounded-lg tw-p-4 tw-flex tw-justify-between tw-items-center hover:tw-bg-gray-600 tw-transition-all'
                      onClick={() => {
                        window.ipc.send(
                          'openBrowser',
                          `https://hard-archive.com/user/${entry.nickname}`,
                        )
                      }}
                    >
                      <div className='tw-flex tw-items-center tw-space-x-4'>
                        <span className={`tw-text-xl tw-font-extrabold ${getRankColor(index + 1)}`}>
                          #{index + 1}
                        </span>
                        <span className='tw-text-lg'>
                          {entry.nickname === '#탈퇴한사용자' ? (
                            <span className='tw-text-gray-500'>{entry.nickname}</span>
                          ) : (
                            entry.nickname
                          )}
                        </span>
                      </div>
                      <div className='tw-flex tw-items-center tw-gap-6'>
                        <div className='tw-flex tw-flex-col tw-items-end'>
                          <div className='tw-font-bold'>{entry.score.toLocaleString()}</div>
                          <div className='tw-text-sm tw-text-gray-300'>
                            {entry.rate.toFixed(2)}%
                          </div>
                        </div>
                        {entry.max_combo && <div className='tw-text-yellow-400'>MAX COMBO</div>}
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

  return <></>
}
