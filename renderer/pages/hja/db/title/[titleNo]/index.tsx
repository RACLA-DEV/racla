import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useNotificationSystem } from '@/libs/client/useNotifications'
import { globalDictionary } from '@/libs/server/globalDictionary'
import axios from 'axios'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { FaDatabase } from 'react-icons/fa6'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

interface Record {
  nickname: string
  max_combo: boolean
  rate: number
  score: number
}

interface PatternRecord {
  hard: Record | null
  max: Record | null
}

interface Pattern {
  button: string
  level: string
  type: 'MX' | 'SC'
}

export default function VArchiveDbTitlePage() {
  const { showNotification } = useNotificationSystem()
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)

  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch()
  const { songData, userData, vArchiveUserData } = useSelector((state: RootState) => state.app)

  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)

  const [records, setRecords] = useState<{ [key: string]: PatternRecord }>({})
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false)

  useEffect(() => {
    if (params?.titleNo) {
      // 항상 baseSongData[0].title로 backgroundBgaName 설정
      dispatch(setBackgroundBgaName(String(params?.titleNo)))
    }
  }, [params?.titleNo, backgroundBgaName])

  useEffect(() => {
    if (params?.titleNo) {
      setBaseSongData(
        songData.filter((songItem) => String(songItem.title) == String(params?.titleNo)),
      )
    }
  }, [params?.titleNo])

  useEffect(() => {
    if (baseSongData.length > 0) {
      setIsLoading(false)
    }
  }, [baseSongData])

  // 패턴 필터링 함수
  const getValidPatterns = (songData: any) => {
    const validPatterns: Pattern[] = []
    const buttons = ['4B', '5B', '6B', '8B']

    buttons.forEach((button) => {
      const patterns = songData.patterns[button]
      if (!patterns) return

      // SC 패턴 체크 (8 이상)
      if (patterns.SC?.level >= 8) {
        validPatterns.push({
          button,
          level: `SC${Math.floor(patterns.SC.level)}`,
          type: 'SC',
        })
      }

      // MX 패턴 체크 (15 이상)
      if (patterns.MX?.level >= 15) {
        validPatterns.push({
          button,
          level: `MX${Math.floor(patterns.MX.level)}`,
          type: 'MX',
        })
      }
    })

    // SC와 MX 패턴을 각각 그룹화
    const scPatterns = validPatterns.filter((p) => p.type === 'SC')
    const mxPatterns = validPatterns.filter((p) => p.type === 'MX')

    return { scPatterns, mxPatterns }
  }

  // 기록 가져오기
  const fetchRecords = async () => {
    setIsLoadingRecords(true)
    try {
      const { scPatterns, mxPatterns } = getValidPatterns(baseSongData[0])
      const allRecordPromises = []

      // SC 패턴 기록 가져오기
      if (scPatterns.length > 0) {
        const scPromises = scPatterns.map(async ({ button, level }) => {
          try {
            const [hardResponse, maxResponse] = await Promise.all([
              axios.post(`${process.env.NEXT_PUBLIC_PROXY_API_URL}`, {
                url: 'https://hard-archive.com/api/v2/record',
                queryString: `button=${button}&lv=${level}&song=${baseSongData[0].hardArchiveTitle}&judge=hard`,
              }),
              axios.post(`${process.env.NEXT_PUBLIC_PROXY_API_URL}`, {
                url: 'https://hard-archive.com/api/v2/record',
                queryString: `button=${button}&lv=${level}&song=${baseSongData[0].hardArchiveTitle}&judge=max`,
              }),
            ])

            return {
              key: `${button}_${level}`,
              data: {
                hard: hardResponse.data.data[0] || null,
                max: maxResponse.data.data[0] || null,
              },
            }
          } catch (error) {
            console.error(`Error fetching SC pattern records for ${button} ${level}:`, error)
            return {
              key: `${button}_${level}`,
              data: { hard: null, max: null },
            }
          }
        })
        allRecordPromises.push(...scPromises)
      }

      /* MX 패턴 기록 가져오기 - 임시 비활성화
      if (mxPatterns.length > 0) {
        const mxPromises = mxPatterns.map(async ({ button, level }) => {
          try {
            const [hardResponse, maxResponse] = await Promise.all([
              axios.post(`${process.env.NEXT_PUBLIC_PROXY_API_URL}`, {
                url: 'https://hard-archive.com/api/v2/record',
                queryString: `button=${button}&lv=${level}&song=${baseSongData[0].hardArchiveTitle}&judge=hard`,
              }),
              axios.post(`${process.env.NEXT_PUBLIC_PROXY_API_URL}`, {
                url: 'https://hard-archive.com/api/v2/record',
                queryString: `button=${button}&lv=${level}&song=${baseSongData[0].hardArchiveTitle}&judge=max`,
              }),
            ])

            return {
              key: `${button}_${level}`,
              data: {
                hard: hardResponse.data.data[0] || null,
                max: maxResponse.data.data[0] || null,
              },
            }
          } catch (error) {
            console.error(`Error fetching MX pattern records for ${button} ${level}:`, error)
            return {
              key: `${button}_${level}`,
              data: { hard: null, max: null }
            }
          }
        })
        allRecordPromises.push(...mxPromises)
      }
      */

      const records = await Promise.all(allRecordPromises)
      const recordMap = records.reduce((acc, { key, data }) => {
        acc[key] = data
        return acc
      }, {})

      setRecords(recordMap)
    } catch (error) {
      console.error('Error in fetchRecords:', error)
      showNotification('기록을 불러오는데 실패했습니다.', 'tw-bg-red-600')
    } finally {
      setIsLoadingRecords(false)
    }
  }

  // 곡 데이터가 로드되면 기록 가져오기
  useEffect(() => {
    if (baseSongData.length > 0) {
      fetchRecords()
    }
  }, [baseSongData])

  if (params?.titleNo && baseSongData.length > 0) {
    return (
      <React.Fragment>
        <Head>
          <title>
            {baseSongData.length !== 0 ? baseSongData[0].name : '로딩중'} - 데이터베이스 - RACLA
          </title>
        </Head>
        <div className='tw-flex tw-gap-4 vh-screen'>
          {/* 곡 데이터 */}
          <div className={`tw-flex tw-flex-col tw-transition-all tw-w-full duration-300`}>
            <div
              className={
                'tw-flex tw-flex-col tw-gap-1 tw-relative tw-bg-opacity-10 tw-rounded-md tw-mb-4 tw-h-auto p-0'
              }
            >
              <div className='tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md'>
                <Image
                  src={`/images/djmax_respect_v/jackets/${params?.titleNo}.jpg`}
                  layout='fill'
                  objectFit='cover'
                  alt=''
                  className='tw-opacity-50 tw-blur-xl'
                />
                <div className='tw-absolute tw-inset-0 tw-bg-gray-900 tw-bg-opacity-50' />
              </div>

              <div className='tw-flex tw-justify-between tw-animate-fadeInLeft flex-equal tw-bg-gray-900 tw-bg-opacity-30 tw-rounded-md p-4'>
                {/* 하단 */}
                <div className='tw-flex tw-gap-3 tw-mt-auto tw-items-end'>
                  <Image
                    loading='lazy' // "lazy" | "eager"
                    blurDataURL={globalDictionary.blurDataURL}
                    src={`/images/djmax_respect_v/jackets/${params?.titleNo}.jpg`}
                    height={90}
                    width={90}
                    alt=''
                    className='tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm'
                  />
                  <div className='tw-flex tw-flex-col tw-w-full'>
                    {/* 제목 */}
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

            {!isLoading && (
              <div className='tw-w-full tw-h-full tw-overflow-hidden tw-p-4 tw-rounded-md tw-shadow-lg tw-bg-gray-600 tw-bg-opacity-20'>
                <div className='tw-grid tw-grid-cols-4 tw-gap-4 tw-h-full'>
                  {['4B', '5B', '6B', '8B'].map((buttonType) => {
                    // 해당 키모드의 패턴들 필터링
                    const buttonPatterns = Object.entries(records).filter(([key]) =>
                      key.startsWith(buttonType),
                    )

                    return (
                      <div key={buttonType} className='tw-flex tw-flex-col tw-gap-4'>
                        {/* 키모드 헤더 수정 */}
                        <div className='tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-2 tw-border tw-border-gray-800 tw-overflow-hidden tw-border-opacity-50 tw-rounded-md tw-bg-gray-900 tw-bg-opacity-50'>
                          <div
                            className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b${buttonType.replace('B', '')}`}
                          />
                          <div className='tw-flex tw-items-end tw-gap-1'>
                            <span className='tw-relative tw-text-xl tw-font-extrabold'>
                              {buttonType.replace('B', '')}
                            </span>
                            <span className='tw-relative tw-text-base tw-font-base tw-text-gray-300'>
                              Button
                            </span>
                          </div>
                        </div>

                        {/* 스크롤 가능한 패턴 목록 */}
                        <div className='tw-flex-1 tw-overflow-y-auto custom-scrollbar'>
                          <div className='tw-flex tw-flex-col tw-gap-4'>
                            {buttonPatterns.length > 0 ? (
                              buttonPatterns.map(([key, record]) => {
                                const [, level] = key.split('_')
                                return (
                                  <div
                                    key={key}
                                    className='tw-bg-gray-700 tw-bg-opacity-25 tw-rounded-lg tw-flex tw-flex-col tw-gap-2 tw-p-3 tw-h-[190px]'
                                  >
                                    {/* 기존 패턴 표시 코드 유지 */}
                                    <div className='tw-border-gray-700 tw-text-center'>
                                      <span
                                        className={`tw-font-bold ${level.startsWith('MX') ? 'tw-text-respect-nm-15' : 'tw-text-respect-sc-15'}`}
                                      >
                                        {level.replace('MX', 'MX ').replace('SC', 'SC ')}
                                      </span>
                                    </div>

                                    <div className='tw-grid tw-grid-cols-2 tw-text-center tw-gap-3'>
                                      {/* HARD 판정 */}
                                      <div
                                        className={`tw-bg-gray-600 tw-bg-opacity-25 tw-rounded-lg tw-py-2 tw-h-full ${
                                          record?.hard
                                            ? 'hover:tw-bg-gray-600 hover:tw-bg-opacity-50 tw-cursor-pointer'
                                            : ''
                                        }`}
                                        onClick={() => {
                                          if (record?.hard) {
                                            router.push(
                                              `/hja/db/title/${params?.titleNo}/${buttonType}-${level}-HARD`,
                                            )
                                          }
                                        }}
                                      >
                                        <div className='tw-text-sm tw-font-bold tw-text-gray-400 tw-mb-2'>
                                          HARD
                                        </div>
                                        {record?.hard ? (
                                          <div className='tw-flex tw-flex-col tw-gap-1'>
                                            <div className='tw-font-bold tw-text-cyan-200'>
                                              {record.hard.nickname}
                                            </div>
                                            <div className='tw-font-bold'>
                                              {record.hard.score.toLocaleString()}
                                            </div>
                                            <div className='tw-text-sm'>
                                              {record.hard.rate.toFixed(2)}%
                                            </div>
                                            {record.hard.max_combo && (
                                              <div className='tw-text-yellow-400 tw-text-sm'>
                                                MAX COMBO
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className='tw-text-gray-500'>기록 없음</div>
                                        )}
                                      </div>

                                      {/* MAX 판정 */}
                                      <div
                                        className={`tw-bg-gray-600 tw-bg-opacity-25 tw-rounded-lg tw-py-2 tw-h-full ${
                                          record?.max
                                            ? 'hover:tw-bg-gray-600 hover:tw-bg-opacity-50 tw-cursor-pointer'
                                            : ''
                                        }`}
                                        onClick={() => {
                                          if (record?.max) {
                                            router.push(
                                              `/hja/db/title/${params?.titleNo}/${buttonType}-${level}-MAX`,
                                            )
                                          }
                                        }}
                                      >
                                        <div className='tw-text-sm tw-font-bold tw-text-gray-400 tw-mb-2'>
                                          MAX
                                        </div>
                                        {record?.max ? (
                                          <div className='tw-flex tw-flex-col tw-gap-1'>
                                            <div className='tw-font-bold tw-text-cyan-200'>
                                              {record.max.nickname}
                                            </div>
                                            <div className='tw-font-bold'>
                                              {record.max.score.toLocaleString()}
                                            </div>
                                            <div className='tw-text-sm'>
                                              {record.max.rate.toFixed(2)}%
                                            </div>
                                            {record.max.max_combo && (
                                              <div className='tw-text-yellow-400 tw-text-sm'>
                                                MAX COMBO
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className='tw-text-gray-500'>기록 없음</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <div className='tw-text-center tw-text-gray-500 tw-bg-gray-900 tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-break-keep tw-rounded-lg tw-p-3 tw-h-[190px]'>
                                해당 수록곡의 {buttonType} 모드는 SC8(MX15) 이상의 패턴이 존재하지
                                않거나 전일 아카이브에 등록되지 않은 패턴으로 조회 결과가 없습니다.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </React.Fragment>
    )
  } else {
    return <></>
  }
}
