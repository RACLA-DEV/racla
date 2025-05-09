import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { logRendererError } from '@utils/rendererLoggerUtils'
import axios from 'axios'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Doughnut } from 'react-chartjs-2'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'
import RaScorePopupComponent from '../score/popup/ScorePopupRacla'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Pattern {
  title: number
  name: string
  composer: string
  pattern: string
  score: number | null
  maxCombo: boolean | null
  djpower: number
  rating: number
  dlc: string
  dlcCode: string
  floor: number
  level?: number
  board: number
}

interface BoardData {
  [key: string]: Pattern[]
}

interface KeyModeData {
  [keyMode: string]: Pattern[]
}

export default function PlatinaLabHomeComponent() {
  const dispatch = useDispatch()
  const userData = useSelector((state: RootState) => state.app.userData)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  const platinaLabSongData = useSelector((state: RootState) => state.app.platinaLabSongData)
  const [showProgress, setShowProgress] = useState(false)
  const [keyModeData, setKeyModeData] = useState<KeyModeData>({
    '4B': [],
    '6B': [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [totalStats, setTotalStats] = useState({
    perfect: 0,
    maxCombo: 0,
    clear: 0,
    totalPatterns: 0,
    over999: 0,
    over995: 0,
    over99: 0,
    over97: 0,
  })

  const [selectedKeyMode, setSelectedKeyMode] = useState<string>('4B')

  const KeyModeSelector = () => (
    <div className='tw-flex tw-gap-2'>
      {['4B', '6B'].map((mode) => (
        <button
          key={`mode_${mode}`}
          onClick={() => setSelectedKeyMode(String(mode))}
          className={`tw-flex tw-items-center tw-justify-center tw-min-w-16 tw-relative tw-px-4 tw-py-0.5 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md tw-flex-1 ${
            String(mode) === selectedKeyMode
              ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
              : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100'
          }`}
        >
          <div
            className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 ${selectedGame === 'djmax_respect_v' ? 'respect' : String(selectedGame)}_bg_b${String(
              mode,
            )
              .replace('_PLUS', '')
              .replace('B', '')}`}
          />
          <span className='tw-relative tw-text-base tw-font-bold'>
            {String(mode).replace('_PLUS', '')}
            {String(mode).includes('_PLUS') ? '+' : ''}
          </span>
        </button>
      ))}
    </div>
  )

  useEffect(() => {
    const fetchAllBoardData = async () => {
      if (!userData.userName) return
      setIsLoading(true)

      try {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/racla/board/platina_lab/flatten/user/${userData.userNo}`,
            {
              headers: {
                Authorization: `${userData.userNo}|${userData.userToken}`,
              },
            },
          )
          setKeyModeData({
            '4B': response.data.patterns_4B,
            '6B': response.data.patterns_6B,
          })
        } catch (error) {
          logRendererError(error, { message: 'Error fetching board data', ...userData })
          console.error(`Error fetching: `, error)
        }
      } catch (error) {
        logRendererError(error, { message: 'Error fetching all data', ...userData })
        console.error('Error fetching all data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllBoardData()
  }, [userData.userName])

  useEffect(() => {
    console.log('KeyMode Data:', keyModeData)
  }, [keyModeData])

  useEffect(() => {
    // 컴포넌트 마운트 후 약간의 딜레이를 주고 애니메이션 시작
    const timer = setTimeout(() => {
      setShowProgress(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const stats = {
      perfect: 0,
      maxCombo: 0,
      clear: 0,
      totalPatterns: 0,
      over999: 0,
      over995: 0,
      over99: 0,
      over97: 0,
    }

    // 모든 키모드의 데이터를
    Object.values(keyModeData).forEach((patterns) => {
      patterns.forEach((pattern) => {
        stats.totalPatterns++

        // 점수를 숫자로 변환
        const score = typeof pattern.score === 'string' ? parseFloat(pattern.score) : pattern.score

        if (pattern?.maxCombo || score === 100.0) stats.maxCombo++

        // 점수 기준을 중첩되게 처리
        if (score === 100.0) {
          stats.perfect++
          stats.over999++
          stats.over995++
          stats.over99++
          stats.over97++
        } else if (score >= 99.9) {
          stats.over999++
          stats.over995++
          stats.over99++
          stats.over97++
        } else if (score >= 99.5) {
          stats.over995++
          stats.over99++
          stats.over97++
        } else if (score >= 99.0) {
          stats.over99++
          stats.over97++
        } else if (score >= 97.0) {
          stats.over97++
        }

        if (score !== null && score > 0) stats.clear++
      })
    })

    setTotalStats(stats)
  }, [keyModeData]) // keyModeData가 변경될 때마다 전체 통계 다시 계산

  const calculateProgress = (value: number, total: number) => {
    if (total === 0) return 0
    return (value / total) * 100
  }

  // 난이도 표시 관련 함수 추가
  const getDifficultyClassName = (pattern: Pattern) => {
    if (pattern.floor != null && pattern.floor != 0) return 'SC'
    return pattern.pattern || 'NM'
  }

  const getLevelDisplay = (pattern: Pattern) => {
    if (pattern.level != null) {
      return (
        <span
          className={`tw-flex tw-gap-2 tw-font-extrabold tw-items-center tw-text-platina-lab-${String(pattern?.pattern).replace('PLUS_1', 'PLUS').replace('PLUS_2', 'PLUS').replace('PLUS_3', 'PLUS').toLowerCase()}`}
        >
          {selectedGame == 'wjmax' ? (
            <Image
              src={`https://cdn.racla.app/wjmax/nm_${Math.ceil((pattern.level || 0) / 5) * 5}_star.png`}
              alt='difficulty'
              width={pattern.level > 20 ? 16 : 20}
              height={pattern.level > 20 ? 16 : 20}
              className={pattern.level > 20 ? 'tw-w-4 tw-h-4' : 'tw-w-5 tw-h-5'}
            />
          ) : null}
          <span className='tw-font-extrabold'>{`${selectedGame == 'wjmax' ? Number(pattern.level).toFixed(1) : 'Lv.' + Number(pattern.level).toFixed(0)}`}</span>
        </span>
      )
    }
    return '난이도 정보 없음'
  }

  const getHighestLevelInfo = (patterns: Pattern[], condition: (pattern: Pattern) => boolean) => {
    // 조건에 맞는 패턴들만 필터링
    const filteredPatterns = patterns.filter(condition)

    // 패턴의 난이도를 비교하는 함수
    const compareDifficulty = (a: Pattern, b: Pattern) => {
      const aLevel = Number(a.level || 0).toFixed(1)
      const bLevel = Number(b.level || 0).toFixed(1)

      // level이 같은 경우 score로 비교
      if (aLevel === bLevel) {
        const aScore = Number(a.score || 0)
        const bScore = Number(b.score || 0)
        return bScore - aScore
      }

      return Number(bLevel) - Number(aLevel)
    }

    // 난이도 순으로 정렬하고 가장 높은 난이도의 패턴 반환
    return filteredPatterns.sort(compareDifficulty)[0]
  }

  const [randomHeaderBg, setRandomHeaderBg] = useState(
    Math.floor(Math.random() * platinaLabSongData.length) + 1,
  )
  const [randomHeaderBg2, setRandomHeaderBg2] = useState(
    Math.floor(Math.random() * platinaLabSongData.length) + 1,
  )

  // board 페이지의 통계 계산 함수와 동일한 로직
  const calculateStats = (patterns: Pattern[]) => {
    const stats = {
      maxCombo: 0,
      perfect: 0,
      over999: 0,
      over995: 0,
      over99: 0,
      over97: 0,
      clear: 0,
      total: patterns.length,
    }

    patterns.forEach((pattern) => {
      // 점수를 숫자로 변환
      const score = typeof pattern.score === 'string' ? parseFloat(pattern.score) : pattern.score

      if (pattern?.maxCombo) stats.maxCombo++

      // 점수 기준을 중첩되게 처리
      if (score === 100.0) {
        stats.perfect++
        stats.over999++
        stats.over995++
        stats.over99++
        stats.over97++
      } else if (score >= 99.9) {
        stats.over999++
        stats.over995++
        stats.over99++
        stats.over97++
      } else if (score >= 99.5) {
        stats.over995++
        stats.over99++
        stats.over97++
      } else if (score >= 99.0) {
        stats.over99++
        stats.over97++
      } else if (score >= 97.0) {
        stats.over97++
      }

      if (score !== null && score > 0) stats.clear++
    })

    return stats
  }

  // 그래프 표시 부분 수정
  const keyTitle = {
    maxCombo: 'MAX COMBO',
    perfect: 'PERFECT',
    over999: 'OVER 99.9%',
    over995: 'OVER 99.5%',
    over99: 'OVER 99%',
    over97: 'OVER 97%',
    clear: 'CLEAR',
    total: '전체',
  }

  return (
    <React.Fragment>
      {selectedGame === 'platina_lab' && (
        <>
          {isLoading ? (
            <div className='tw-flex tw-items-center tw-justify-center tw-h-screen tw-flex-1 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg'>
              <SyncLoader color='#ffffff' size={8} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* 헤더 섹션 */}
              <div className='tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-4 tw-mb-4'>
                <div className='tw-flex tw-justify-between tw-items-center'>
                  <span className='tw-text-xl tw-font-bold'>
                    {userData.userName !== '' ? `${userData.userName}` : 'Guest'}님 환영합니다.
                  </span>
                  <KeyModeSelector />
                </div>
              </div>

              {/* 패널들 - 래퍼 제거하고 직접 배치 */}
              <div className='tw-flex tw-gap-4 stats-section'>
                <div className='tw-flex tw-flex-col tw-gap-4 tw-w-3/5'>
                  {/* Button Mode Panel */}
                  <div className='tw-flex tw-flex-col tw-gap-4'>
                    <div className='tw-flex tw-justify-between tw-items-end tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-4'>
                      <span className='tw-flex tw-w-full tw-items-center tw-gap-1'>
                        <span className='tw-text-xl tw-font-bold tw-me-auto'>
                          {String(selectedKeyMode).replace('_PLUS', '')}
                          {String(selectedKeyMode).includes('_PLUS') ? '+' : ''} 통계
                        </span>
                      </span>
                    </div>

                    {/* 통계 정보 */}
                    <div className='tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-p-4'>
                      {/* 상단 통계 요약 */}
                      <div className='tw-grid tw-grid-cols-7 tw-gap-2 tw-mb-8'>
                        {[
                          { key: 'clear', label: '클리어', color: 'tw-text-blue-500' },

                          { key: 'perfect', label: '퍼펙트', color: 'tw-text-red-500' },
                          { key: 'over999', label: '99.9%+', color: 'tw-text-yellow-500' },
                          { key: 'over995', label: '99.5%+', color: 'tw-text-yellow-400' },
                          { key: 'over99', label: '99.0%+', color: 'tw-text-yellow-300' },
                          { key: 'over97', label: '97.0%+', color: 'tw-text-yellow-200' },
                          { key: 'maxCombo', label: '맥스 콤보', color: 'tw-text-green-500' },
                        ].map(({ key, label, color }) => (
                          <div
                            key={key}
                            className='tw-text-center tw-p-3 tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-lg'
                          >
                            <div className={`tw-text-lg tw-font-bold ${color}`}>
                              {calculateStats(keyModeData[selectedKeyMode])[key]}
                            </div>
                            <div className='tw-text-xs tw-text-gray-400'>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* 도넛 차트 */}
                      <div className='tw-relative tw-w-full tw-h-44 tw-flex tw-items-center tw-justify-center'>
                        <div className='tw-flex tw-justify-between tw-w-full tw-h-full'>
                          {/* 차트 1: 클리어 / 미클리어 */}
                          <div className='tw-relative tw-w-1/3 tw-flex tw-items-center tw-justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw-absolute tw-top-1/2 tw-left-1/2 tw-transform -tw-translate-x-1/2 -tw-translate-y-1/2 tw-text-center tw-w-[88px] tw-h-[88px] tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-z-0'>
                              <div className='tw-text-lg tw-font-bold'>
                                {calculateStats(keyModeData[selectedKeyMode]).total}
                              </div>
                              <div className='tw-text-xs tw-text-gray-300'>전체</div>
                            </div>
                            <div className='tw-relative tw-z-1'>
                              <Doughnut
                                data={{
                                  labels: ['클리어', '미클리어(기록 없음)'],
                                  datasets: [
                                    {
                                      data: [
                                        calculateStats(keyModeData[selectedKeyMode]).clear,
                                        calculateStats(keyModeData[selectedKeyMode]).total -
                                          calculateStats(keyModeData[selectedKeyMode]).clear,
                                      ],
                                      backgroundColor: [
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],

                                      borderColor: [
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        label: (context: any) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* 차트 3: 퍼펙트 점수 구간 (클리어한 것만) */}
                          <div className='tw-relative tw-w-1/3 tw-flex tw-items-center tw-justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw-absolute tw-top-1/2 tw-left-1/2 tw-transform -tw-translate-x-1/2 -tw-translate-y-1/2 tw-text-center tw-w-[88px] tw-h-[88px] tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-z-0'>
                              <div className='tw-text-lg tw-font-bold'>
                                {calculateStats(keyModeData[selectedKeyMode]).clear}
                              </div>
                              <div className='tw-text-xs tw-text-gray-300'>클리어</div>
                            </div>
                            <div className='tw-relative tw-z-1'>
                              <Doughnut
                                data={{
                                  labels: [
                                    '퍼펙트',
                                    '스코어 99.9% 이상',
                                    '스코어 99.5% 이상',
                                    '스코어 99.0% 이상',
                                    '스코어 97.0% 이상',
                                    '스코어 97.0% 이하',
                                  ],
                                  datasets: [
                                    {
                                      data: [
                                        calculateStats(keyModeData[selectedKeyMode]).perfect,
                                        calculateStats(keyModeData[selectedKeyMode]).over999,
                                        calculateStats(keyModeData[selectedKeyMode]).over995,
                                        calculateStats(keyModeData[selectedKeyMode]).over99,
                                        calculateStats(keyModeData[selectedKeyMode]).over97,
                                        calculateStats(keyModeData[selectedKeyMode]).clear -
                                          calculateStats(keyModeData[selectedKeyMode]).over97,
                                      ],
                                      backgroundColor: [
                                        'rgba(239, 68, 68, 0.8)',
                                        'rgba(234, 179, 8, 0.8)',
                                        'rgba(234, 179, 8, 0.6)',
                                        'rgba(234, 179, 8, 0.4)',
                                        'rgba(234, 179, 8, 0.2)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderColor: [
                                        'rgba(239, 68, 68, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234,179,8,1)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        label: (context: any) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* 차트 2: 퍼펙트 or 풀콤보 / 해당되지 않는 것 (클리어한 것만) */}
                          <div className='tw-relative tw-w-1/3 tw-flex tw-items-center tw-justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw-absolute tw-top-1/2 tw-left-1/2 tw-transform -tw-translate-x-1/2 -tw-translate-y-1/2 tw-text-center tw-w-[88px] tw-h-[88px] tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-z-0'>
                              <div className='tw-text-lg tw-font-bold'>
                                {calculateStats(keyModeData[selectedKeyMode]).maxCombo}
                              </div>
                              <div className='tw-text-xs tw-text-gray-300'>맥스 콤보</div>
                            </div>
                            <div className='tw-relative tw-z-1'>
                              <Doughnut
                                data={{
                                  labels: ['맥스 콤보', '맥스 콤보 외 클리어'],
                                  datasets: [
                                    {
                                      data: [
                                        calculateStats(keyModeData[selectedKeyMode]).maxCombo,
                                        calculateStats(keyModeData[selectedKeyMode]).clear -
                                          calculateStats(keyModeData[selectedKeyMode]).maxCombo,
                                      ],
                                      backgroundColor: [
                                        'rgba(34, 197, 94, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderColor: [
                                        'rgba(34, 197, 94, 1)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        label: (context: any) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Overall Panel */}
                  <div className='tw-flex tw-flex-col tw-gap-4'>
                    <div className='tw-bg-gray-800 tw-bg-opacity-75 tw-flex tw-justify-between tw-items-end tw-rounded-lg tw-p-4'>
                      <div className='tw-flex tw-flex-col'>
                        <span className='tw-text-xl tw-font-bold'>전체 통계</span>
                      </div>
                    </div>

                    <div className='tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-p-4 tw-pb-8'>
                      {/* 상단 통계 요약 */}
                      <div className='tw-grid tw-grid-cols-7 tw-gap-2 tw-mb-8'>
                        {[
                          { key: 'clear', label: '클리어', color: 'tw-text-blue-500' },

                          { key: 'perfect', label: '퍼펙트', color: 'tw-text-red-500' },
                          { key: 'over999', label: '99.9%+', color: 'tw-text-yellow-500' },
                          { key: 'over995', label: '99.5%+', color: 'tw-text-yellow-400' },
                          { key: 'over99', label: '99.0%+', color: 'tw-text-yellow-300' },
                          { key: 'over97', label: '97.0%+', color: 'tw-text-yellow-200' },
                          { key: 'maxCombo', label: '맥스 콤보', color: 'tw-text-green-500' },
                        ].map(({ key, label, color }) => (
                          <div
                            key={key}
                            className='tw-text-center tw-p-3 tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-lg'
                          >
                            <div className={`tw-text-lg tw-font-bold ${color}`}>
                              {totalStats[key]}
                            </div>
                            <div className='tw-text-xs tw-text-gray-400'>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* 도넛 차트 */}
                      <div className='tw-relative tw-w-full tw-h-44 tw-flex tw-items-center tw-justify-center'>
                        <div className='tw-flex tw-justify-between tw-w-full tw-h-full'>
                          {/* 차트 1: 클리어 / 미클리어 */}
                          <div className='tw-relative tw-w-1/3 tw-flex tw-items-center tw-justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw-absolute tw-top-1/2 tw-left-1/2 tw-transform -tw-translate-x-1/2 -tw-translate-y-1/2 tw-text-center tw-w-[88px] tw-h-[88px] tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-z-0'>
                              <div className='tw-text-lg tw-font-bold'>
                                {totalStats.totalPatterns}
                              </div>
                              <div className='tw-text-xs tw-text-gray-300'>전체</div>
                            </div>
                            <div className='tw-relative tw-z-1'>
                              <Doughnut
                                data={{
                                  labels: ['클리어', '미클리어(기록 없음)'],
                                  datasets: [
                                    {
                                      data: [
                                        totalStats.clear,
                                        totalStats.totalPatterns - totalStats.clear,
                                      ],
                                      backgroundColor: [
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],

                                      borderColor: [
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        label: (context: any) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* 차트 3: 퍼펙트 점수 구간 (클리어한 것만) */}
                          <div className='tw-relative tw-w-1/3 tw-flex tw-items-center tw-justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw-absolute tw-top-1/2 tw-left-1/2 tw-transform -tw-translate-x-1/2 -tw-translate-y-1/2 tw-text-center tw-w-[88px] tw-h-[88px] tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-z-0'>
                              <div className='tw-text-lg tw-font-bold'>{totalStats.clear}</div>
                              <div className='tw-text-xs tw-text-gray-300'>클리어</div>
                            </div>
                            <div className='tw-relative tw-z-1'>
                              <Doughnut
                                data={{
                                  labels: [
                                    '퍼펙트',
                                    '스코어 99.9% 이상',
                                    '스코어 99.5% 이상',
                                    '스코어 99.0% 이상',
                                    '스코어 97.0% 이상',
                                    '스코어 97.0% 이하',
                                  ],
                                  datasets: [
                                    {
                                      data: [
                                        totalStats.perfect,
                                        totalStats.over999,
                                        totalStats.over995,
                                        totalStats.over99,
                                        totalStats.over97,
                                        totalStats.clear - totalStats.over97,
                                      ],
                                      backgroundColor: [
                                        'rgba(239, 68, 68, 0.8)',
                                        'rgba(234, 179, 8, 0.8)',
                                        'rgba(234, 179, 8, 0.6)',
                                        'rgba(234, 179, 8, 0.4)',
                                        'rgba(234, 179, 8, 0.2)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderColor: [
                                        'rgba(239, 68, 68, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234,179,8,1)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        label: (context: any) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* 차트 2: 퍼펙트 or 풀콤보 / 해당되지 않는 것 (클리어한 것만) */}
                          <div className='tw-relative tw-w-1/3 tw-flex tw-items-center tw-justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw-absolute tw-top-1/2 tw-left-1/2 tw-transform -tw-translate-x-1/2 -tw-translate-y-1/2 tw-text-center tw-w-[88px] tw-h-[88px] tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-z-0'>
                              <div className='tw-text-lg tw-font-bold'>{totalStats.maxCombo}</div>
                              <div className='tw-text-xs tw-text-gray-300'>맥스 콤보</div>
                            </div>
                            <div className='tw-relative tw-z-1'>
                              <Doughnut
                                data={{
                                  labels: ['맥스 콤보', '맥스 콤보 외 클리어'],
                                  datasets: [
                                    {
                                      data: [
                                        totalStats.maxCombo,
                                        totalStats.clear - totalStats.maxCombo,
                                      ],
                                      backgroundColor: [
                                        'rgba(34, 197, 94, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderColor: [
                                        'rgba(34, 197, 94, 1)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        label: (context: any) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 최고 성과 패널 */}
                <div className='tw-w-2/5'>
                  <div className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-4'>
                    <span className='tw-text-lg tw-font-bold'>
                      🎯 {String(selectedKeyMode).replace('B', '').replace('_PLUS', '')}B
                      {String(selectedKeyMode).includes('_PLUS') ? '+' : ''} 최고 성과 기록
                    </span>
                    {!isLoading && keyModeData[selectedKeyMode] && (
                      <motion.div
                        key={`achievements_${selectedKeyMode}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className='tw-flex tw-flex-col tw-gap-2'
                      >
                        {Object.entries({
                          maxCombo: '맥스 콤보',
                          perfect: '퍼펙트',
                          over999: '스코어 99.9% 이상',
                          over995: '스코어 99.5% 이상',
                          over99: '스코어 99% 이상',
                          over97: '스코어 97% 이상',
                          clear: '클리어',
                        }).map(([key, label]) => {
                          const patterns = keyModeData[selectedKeyMode]
                          const condition = (pattern: Pattern) => {
                            const score =
                              typeof pattern.score === 'string'
                                ? parseFloat(pattern.score)
                                : pattern.score
                            if (score === null) return false

                            if (key === 'perfect') return Math.abs(score - 100.0) < 0.001
                            if (key === 'maxCombo') return pattern.maxCombo
                            if (key === 'clear') return score > 0

                            switch (key) {
                              case 'over999':
                                return score >= 99.9 && score < 100
                              case 'over995':
                                return score >= 99.5 && score < 99.9
                              case 'over99':
                                return score >= 99.0 && score < 99.5
                              case 'over97':
                                return score >= 97.0 && score < 99.0
                              default:
                                return false
                            }
                          }

                          const highestPattern = getHighestLevelInfo(patterns, condition)

                          if (!highestPattern) return null

                          return (
                            <div key={`${key}_${selectedKeyMode}`} className='tw-flex tw-gap-2'>
                              <RaScorePopupComponent
                                gameCode='platina_lab'
                                songItemTitle={String(highestPattern.title)}
                                keyMode={String(selectedKeyMode)
                                  .replace('B', '')
                                  .replace('_PLUS', '')}
                                judgementType={
                                  String(selectedKeyMode).includes('_PLUS') ? '1' : '0'
                                }
                              />
                              <div className='tw-flex tw-flex-col tw-gap-1 tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-md tw-p-3 tw-flex-1'>
                                <div className='tw-flex tw-justify-between tw-items-center'>
                                  <span className='tw-text-sm tw-font-bold'>{label}</span>
                                  <span className='tw-text-sm tw-font-extrabold'>
                                    {getLevelDisplay(highestPattern)}
                                  </span>
                                </div>
                                <p className='tw-text-sm tw-text-gray-400 tw-break-all tw-max-w-full'>
                                  {highestPattern.name}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </React.Fragment>
  )
}
