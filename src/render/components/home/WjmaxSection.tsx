import { ArcElement, Chart as ChartJS, Legend, Tooltip, TooltipItem } from 'chart.js'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import type { PlayBoardFlattenResponse } from '@src/types/dto/playBoard/PlayBoardFlattenResponse'
import type { PlayBoardPatternInfo } from '@src/types/dto/playBoard/PlayBoardPatternInfo'
import { motion } from 'framer-motion'
import { Doughnut } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import { PuffLoader } from 'react-spinners'
import apiClient from '../../../libs/apiClient'
import Image from '../image/Image'
import ScorePopupComponent from '../score/ScorePopup'

ChartJS.register(ArcElement, Tooltip, Legend)

interface KeyModeData {
  [keyMode: string]: PlayBoardPatternInfo[]
}

export default function WjmaxHomeComponent() {
  const { t } = useTranslation(['home'])
  const userData = useSelector((state: RootState) => state.app.userData)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  const [keyModeData, setKeyModeData] = useState<KeyModeData>({
    '4B': [],
    '4B_PLUS': [],
    '6B': [],
    '6B_PLUS': [],
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
    <div className='tw:flex tw:gap-2'>
      {['4B', '4B_PLUS', '6B', '6B_PLUS'].map((mode) => (
        <button
          key={`mode_${mode}`}
          onClick={() => {
            setSelectedKeyMode(String(mode))
          }}
          className={`tw:flex tw:items-center tw:justify-center tw:min-w-16 tw:relative tw:px-4 tw:py-0.5 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-md tw:flex-1 ${
            String(mode) === selectedKeyMode
              ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
              : 'tw:border-gray-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-gray-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100'
          }`}
        >
          <div className={`tw:absolute tw:w-full tw:h-full tw:opacity-30`} />
          <span className='tw:relative tw:text-base tw:font-bold'>
            {String(mode).replace('_PLUS', '')}
            {String(mode).includes('_PLUS') ? '+' : ''}
          </span>
        </button>
      ))}
    </div>
  )

  useEffect(() => {
    const fetchAllBoardData = async () => {
      if (!userData.playerName) return
      setIsLoading(true)

      try {
        try {
          const response = await apiClient.get<PlayBoardFlattenResponse>(
            `/v3/racla/board/wjmax/flatten/player/${userData.playerId}`,
            {
              headers: {
                Authorization: `${userData.playerId}|${userData.playerToken}`,
              },
            },
          )
          setKeyModeData({
            '4B': response.data.data.patterns_4B,
            '4B_PLUS': response.data.data.patterns_4B_PLUS,
            '6B': response.data.data.patterns_6B,
            '6B_PLUS': response.data.data.patterns_6B_PLUS,
          })
        } catch (error) {
          createLog('error', { message: 'Error fetching board data', userData })
          console.error(`Error fetching: `, error)
        }
      } catch (error) {
        createLog('error', { message: 'Error fetching all data', userData })
        console.error('Error fetching all data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchAllBoardData()
  }, [userData.playerName])

  useEffect(() => {
    createLog('debug', 'KeyMode Data:', keyModeData)
  }, [keyModeData])

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

        if (pattern.maxCombo ?? score === 100.0) stats.maxCombo++

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

  const getLevelDisplay = (pattern: PlayBoardPatternInfo) => {
    if (pattern.level != null) {
      return (
        <span
          className={`tw:flex tw:gap-2 tw:font-extrabold tw:items-center tw:text-wjmax-${String(pattern?.pattern).toLowerCase()}`}
        >
          <Image
            src={`https://cdn.racla.app/wjmax/nm_${Math.ceil((pattern.level || 0) / 5) * 5}_star.png`}
            alt='difficulty'
            width={pattern.level > 20 ? 16 : 20}
            height={pattern.level > 20 ? 16 : 20}
            className={pattern.level > 20 ? 'tw:w-4 tw:h-4' : 'tw:w-5 tw:h-5'}
          />
          <span className='tw:font-extrabold'>{`${Number(pattern.level).toFixed(1)}`}</span>
        </span>
      )
    }
    return t('noDifficultyInfo')
  }

  const getHighestLevelInfo = (
    patterns: PlayBoardPatternInfo[],
    condition: (pattern: PlayBoardPatternInfo) => boolean,
  ) => {
    // 조건에 맞는 패턴들만 필터링
    const filteredPatterns = patterns.filter(condition)

    // 패턴의 난이도를 비교하는 함수
    const compareDifficulty = (a: PlayBoardPatternInfo, b: PlayBoardPatternInfo) => {
      const aLevel = Number(a.level ?? 0).toFixed(1)
      const bLevel = Number(b.level ?? 0).toFixed(1)

      // level이 같은 경우 score로 비교
      if (aLevel === bLevel) {
        const aScore = Number(a.score ?? 0)
        const bScore = Number(b.score ?? 0)
        return bScore - aScore
      }

      return Number(bLevel) - Number(aLevel)
    }

    // 난이도 순으로 정렬하고 가장 높은 난이도의 패턴 반환
    return filteredPatterns.sort(compareDifficulty)[0]
  }

  // board 페이지의 통계 계산 함수와 동일한 로직
  const calculateStats = (patterns: PlayBoardPatternInfo[]) => {
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

      if (pattern.maxCombo) stats.maxCombo++

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

  return (
    <>
      {selectedGame === 'wjmax' && (
        <>
          {isLoading ? (
            <div className='tw:flex tw:items-center tw:w-full tw:h-[calc(100vh-106px)] tw:justify-center tw:flex-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:border tw:border-gray-200 tw:dark:border-slate-700'>
              <PuffLoader color='#6366f1' size={32} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div id='ContentHeader' />

              {/* 헤더 섹션 */}
              <div className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:shadow-lg tw:p-4 tw:mb-4 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                <div className='tw:flex tw:justify-between tw:items-center'>
                  <span className='tw:text-xl tw:font-bold tw:me-auto tw:text-gray-900 tw:dark:text-white'>
                    {String(selectedKeyMode).replace('_PLUS', '')}
                    {String(selectedKeyMode).includes('_PLUS') ? '+' : ''} {t('stats')}
                  </span>
                  <KeyModeSelector />
                </div>
              </div>

              {/* 패널들 - 래퍼 제거하고 직접 배치 */}
              <div className='tw:flex tw:gap-4 stats-section'>
                <div className='tw:flex tw:flex-col tw:gap-4 tw:w-3/5'>
                  {/* Button Mode Panel */}
                  <div className='tw:flex tw:flex-col tw:gap-4'>
                    {/* 통계 정보 */}
                    <div className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-4 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                      {/* 상단 통계 요약 */}
                      <div className='tw:grid tw:grid-cols-7 tw:gap-2 tw:mb-8'>
                        {[
                          {
                            key: 'clear',
                            label: t('clear'),
                            color: 'tw:text-blue-600 tw:dark:text-blue-500',
                            bg: 'tw:bg-blue-50 tw:dark:bg-blue-500/20',
                          },
                          {
                            key: 'perfect',
                            label: t('perfect'),
                            color: 'tw:text-red-600 tw:dark:text-red-500',
                            bg: 'tw:bg-red-50 tw:dark:bg-red-500/20',
                          },
                          {
                            key: 'over999',
                            label: t('over999.name'),
                            color: 'tw:text-yellow-600 tw:dark:text-yellow-500',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-500/20',
                          },
                          {
                            key: 'over995',
                            label: t('over995.name'),
                            color: 'tw:text-yellow-500 tw:dark:text-yellow-400',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-400/20',
                          },
                          {
                            key: 'over99',
                            label: t('over99.name'),
                            color: 'tw:text-yellow-400 tw:dark:text-yellow-300',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-300/20',
                          },
                          {
                            key: 'over97',
                            label: t('over97.name'),
                            color: 'tw:text-yellow-300 tw:dark:text-yellow-200',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-200/20',
                          },
                          {
                            key: 'maxCombo',
                            label: t('maxCombo'),
                            color: 'tw:text-green-600 tw:dark:text-green-500',
                            bg: 'tw:bg-green-50 tw:dark:bg-green-500/20',
                          },
                        ].map(({ key, label, color, bg }) => (
                          <div
                            key={key}
                            className={`tw:text-center tw:p-3 ${bg} tw:rounded-lg tw:transition-all tw:duration-300 hover:tw:shadow-md`}
                          >
                            <div className={`tw:text-lg tw:font-bold ${color}`}>
                              {calculateStats(keyModeData[selectedKeyMode])[key]}
                            </div>
                            <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 도넛 차트 */}
                      <div className='tw:relative tw:w-full tw:h-44 tw:flex tw:items-center tw:justify-center'>
                        <div className='tw:flex tw:justify-between tw:w-full tw:h-full'>
                          {/* 차트 1: 클리어 / 미클리어 */}
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {calculateStats(keyModeData[selectedKeyMode]).total}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('all')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [t('clear'), t('noRecord')],
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
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
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
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {calculateStats(keyModeData[selectedKeyMode]).clear}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('clear')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [
                                    t('perfect'),
                                    t('over999.fullName'),
                                    t('over995.fullName'),
                                    t('over99.fullName'),
                                    t('over97.fullName'),
                                    t('under97.fullName'),
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
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
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
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {calculateStats(keyModeData[selectedKeyMode]).maxCombo}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('maxCombo')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [t('maxCombo'), t('withoutMaxCombo')],
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
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
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
                  <div className='tw:flex tw:flex-col tw:gap-4'>
                    <div className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:flex tw:justify-between tw:items-end tw:rounded-lg tw:p-4 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                      <div className='tw:flex tw:flex-col'>
                        <span className='tw:text-xl tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                          {t('total')} {t('stats')}
                        </span>
                      </div>
                    </div>

                    <div className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-4 tw:pb-8 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                      {/* 상단 통계 요약 */}
                      <div className='tw:grid tw:grid-cols-7 tw:gap-2 tw:mb-8'>
                        {[
                          {
                            key: 'clear',
                            label: t('clear'),
                            color: 'tw:text-blue-600 tw:dark:text-blue-500',
                            bg: 'tw:bg-blue-50 tw:dark:bg-blue-500/20',
                          },
                          {
                            key: 'perfect',
                            label: t('perfect'),
                            color: 'tw:text-red-600 tw:dark:text-red-500',
                            bg: 'tw:bg-red-50 tw:dark:bg-red-500/20',
                          },
                          {
                            key: 'over999',
                            label: t('over999.name'),
                            color: 'tw:text-yellow-600 tw:dark:text-yellow-500',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-500/20',
                          },
                          {
                            key: 'over995',
                            label: t('over995.name'),
                            color: 'tw:text-yellow-500 tw:dark:text-yellow-400',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-400/20',
                          },
                          {
                            key: 'over99',
                            label: t('over99.name'),
                            color: 'tw:text-yellow-400 tw:dark:text-yellow-300',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-300/20',
                          },
                          {
                            key: 'over97',
                            label: t('over97.name'),
                            color: 'tw:text-yellow-300 tw:dark:text-yellow-200',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-200/20',
                          },
                          {
                            key: 'maxCombo',
                            label: t('maxCombo'),
                            color: 'tw:text-green-600 tw:dark:text-green-500',
                            bg: 'tw:bg-green-50 tw:dark:bg-green-500/20',
                          },
                        ].map(({ key, label, color, bg }) => (
                          <div
                            key={key}
                            className={`tw:text-center tw:p-3 ${bg} tw:rounded-lg tw:transition-all tw:duration-300 hover:tw:shadow-md`}
                          >
                            <div className={`tw:text-lg tw:font-bold ${color}`}>
                              {totalStats[key]}
                            </div>
                            <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 도넛 차트 */}
                      <div className='tw:relative tw:w-full tw:h-44 tw:flex tw:items-center tw:justify-center'>
                        <div className='tw:flex tw:justify-between tw:w-full tw:h-full'>
                          {/* 차트 1: 클리어 / 미클리어 */}
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {totalStats.totalPatterns}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('all')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [t('clear'), t('noRecord')],
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
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
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
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {totalStats.clear}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('clear')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [
                                    t('perfect'),
                                    t('over999.fullName'),
                                    t('over995.fullName'),
                                    t('over99.fullName'),
                                    t('over97.fullName'),
                                    t('under97.fullName'),
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
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
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
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {totalStats.maxCombo}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('maxCombo')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [t('maxCombo'), t('withoutMaxCombo')],
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
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
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
                <div className='tw:w-2/5'>
                  <div className='tw:flex tw:flex-col tw:gap-4 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:shadow-lg tw:p-4 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                    <span className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                      🎯 {String(selectedKeyMode).replace('B', '').replace('_PLUS', '')}B
                      {String(selectedKeyMode).includes('_PLUS') ? '+' : ''} {t('best')}{' '}
                      {t('achievement')}
                    </span>
                    {!isLoading && keyModeData[selectedKeyMode] && (
                      <motion.div
                        key={`achievements_${selectedKeyMode}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className='tw:flex tw:flex-col tw:gap-2'
                      >
                        {Object.entries({
                          maxCombo: t('maxCombo'),
                          perfect: t('perfect'),
                          over999: t('over999.fullName'),
                          over995: t('over995.fullName'),
                          over99: t('over99.fullName'),
                          over97: t('over97.fullName'),
                          clear: t('clear'),
                        }).map(([key, label]) => {
                          const patterns = keyModeData[selectedKeyMode]
                          const condition = (pattern: PlayBoardPatternInfo) => {
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
                            <div key={`${key}_${selectedKeyMode}`} className='tw:flex tw:gap-2'>
                              <ScorePopupComponent
                                songTitle={highestPattern.title}
                                keyMode={String(selectedKeyMode)
                                  .replace('B', '')
                                  .replace('_PLUS', '')}
                                judgementType={String(selectedKeyMode).includes('_PLUS') ? 1 : 0}
                              />
                              <div className='tw:flex tw:flex-col tw:gap-1 tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-md tw:p-3 tw:flex-1 tw:border tw:border-gray-200 tw:dark:border-slate-600'>
                                <div className='tw:flex tw:justify-between tw:items-center'>
                                  <span className='tw:text-sm tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                    {label}
                                  </span>
                                  <span className='tw:text-sm tw:font-extrabold'>
                                    {getLevelDisplay(highestPattern)}
                                  </span>
                                </div>
                                <p className='tw:text-sm tw:text-gray-500 tw:dark:text-slate-300 text-one-line tw:max-w-full'>
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
              <div id='ContentFooter' />
            </motion.div>
          )}
        </>
      )}
    </>
  )
}
