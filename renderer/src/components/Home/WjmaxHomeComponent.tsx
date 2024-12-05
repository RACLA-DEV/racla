import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { FaGithub, FaLink, FaTriangleExclamation, FaChevronLeft, FaChevronRight, FaRotate, FaX, FaXmark, FaBell } from 'react-icons/fa6'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'store'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { SyncLoader } from 'react-spinners'
import { globalDictionary } from '@/libs/server/globalDictionary'
import ScorePopupComponent from '@/components/score/ScorePopupComponent'
import html2canvas from 'html2canvas'
import moment from 'moment'
import RaScorePopupComponent from '../score/RaScorePopupComponent'

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

export default function WjmaxHomeComponent() {
  const dispatch = useDispatch()
  const userData = useSelector((state: RootState) => state.app.userData)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  const wjmaxSongData = useSelector((state: RootState) => state.app.wjmaxSongData)
  const [showProgress, setShowProgress] = useState(false)
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
  })

  const [boards, setBoards] = useState<string[]>([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
  ])

  const [selectedKeyMode, setSelectedKeyMode] = useState<string>('4B')

  const KeyModeSelector = () => (
    <div className="tw-flex tw-gap-2">
      {['4B', '4B_PLUS', '6B', '6B_PLUS'].map((mode) => (
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
            className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 ${selectedGame === 'wjmax' ? 'wjmax' : 'respect'}_bg_b${String(mode)
              .replace('_PLUS', '')
              .replace('B', '')}`}
          />
          <span className="tw-relative tw-text-base tw-font-bold">
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
        const keyModes = ['4B', '4B_PLUS', '6B', '6B_PLUS']
        const allKeyModeData: KeyModeData = {}

        for (const keyMode of keyModes) {
          // 기본 곡 데이터 가져오기 (wjmaxSongData 활용)
          const baseSongData = wjmaxSongData.flatMap((track) => {
            const { title, name, composer, dlcCode, dlc, patterns } = track
            const patternButton = patterns[keyMode.replace('_PLUS', '')]

            if (patternButton) {
              return Object.entries(patternButton).map(([key, pattern]: [string, any]) => ({
                title,
                name,
                composer,
                dlcCode,
                dlc,
                pattern: key,
                level: pattern.level,
                floor: null,
                rating: pattern.rating || null,
                score: null,
                maxCombo: null,
                djpower: null,
              }))
            }
            return []
          })

          // 모든 보드의 데이터 가져오기
          const allBoardResponses = await Promise.all(
            boards.map(async (boardType) => {
              try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/board/wjmax/${keyMode}/${boardType}/user/${userData.userNo}`, {
                  headers: {
                    Authorization: `${userData.userNo}|${userData.userToken}`,
                  },
                })
                return (
                  response.data.floors?.flatMap((floor) =>
                    floor.patterns.map((pattern) => ({
                      ...pattern,
                      floor: floor.floorNumber,
                    })),
                  ) || []
                )
              } catch (error) {
                console.error(`Error fetching ${boardType}:`, error)
                return []
              }
            }),
          )

          // 중복 제거 및 데이터 병합
          allKeyModeData[keyMode] = Object.values(
            allBoardResponses.flat().reduce((acc, apiPattern) => {
              const key = `${apiPattern.title}_${apiPattern.pattern}`
              const basePattern = baseSongData.find((bp) => bp.title === apiPattern.title && bp.pattern === apiPattern.pattern)

              if (!acc[key] || (apiPattern.djpower && apiPattern.djpower > (acc[key].djpower || 0))) {
                // 먼저 기본 객체 구조 생성
                const mergedPattern = {
                  title: apiPattern.title,
                  name: basePattern?.name || apiPattern.name,
                  composer: basePattern?.composer || apiPattern.composer,
                  pattern: apiPattern.pattern,
                  dlcCode: basePattern?.dlcCode || apiPattern.dlcCode,
                  dlc: basePattern?.dlc || apiPattern.dlc,

                  // API 데이터 우선
                  floor: apiPattern.floor, // floor 값을 먼저 할당
                  score: apiPattern.score,
                  maxCombo: apiPattern.maxCombo,
                  djpower: apiPattern.djpower,
                  rating: apiPattern.rating,

                  // basePattern의 level은 별도로 유지
                  level: basePattern?.level || null,

                  // board 정보 유지
                  board: apiPattern.board || null,
                }

                acc[key] = mergedPattern
              }
              return acc
            }, {}),
          )
        }

        setKeyModeData(allKeyModeData)
      } catch (error) {
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
    }

    // 모든 키모드의 데이터를
    Object.values(keyModeData).forEach((patterns) => {
      patterns.forEach((pattern) => {
        // 전체 패턴 수 증가
        stats.totalPatterns++

        // PERFECT 체크 (score가 100인 경우)
        if (pattern.score == 100) {
          stats.perfect++
        }

        // MAX COMBO 체크 (maxCombo가 1인 경우)
        if (pattern.maxCombo) {
          stats.maxCombo++
        }

        // CLEAR 체크 (score가 존재하고 0보다 큰 경우)
        if (pattern.score !== null && pattern.score > 0) {
          stats.clear++
        }
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
    const getFloorGroup = (value: number) => {
      if (value <= 5) return 'nm'
      if (value <= 10) return 'hd'
      if (value <= 15) return 'mx'
      return 'sc' // 15보다 큰 값도 모두 15로 처리
    }

    if (pattern.floor != null && pattern.floor != 0) {
      const floorGroup = getFloorGroup(pattern.floor)
      return (
        <span className={`tw-flex tw-gap-2 tw-font-extrabold tw-items-center tw-text-wjmax-${floorGroup}`}>
          <Image src={`/images/wjmax/nm_${floorGroup}_star.png`} alt="difficulty" width={16} height={16} className="tw-w-4 tw-h-4" />
          <span className="tw-font-extrabold tw-mb-0.5">{`${pattern.floor}`}F</span>
        </span>
      )
    }
    if (pattern.level != null) {
      return (
        <span className={`tw-flex tw-gap-2 tw-font-extrabold tw-items-center tw-text-wjmax-${getFloorGroup(pattern.level)}`}>
          <Image
            src={`/images/wjmax/nm_${Math.ceil((pattern.level || 0) / 5) * 5}_star.png`}
            alt="difficulty"
            width={16}
            height={16}
            className="tw-w-4 tw-h-4"
          />
          <span className="tw-font-extrabold tw-mb-0.5">{`${Number(pattern.level).toFixed(1)}`}</span>
        </span>
      )
    }
    return '난이도 정보 없음'
  }

  const getHighestLevelInfo = (patterns: Pattern[], condition: (pattern: Pattern) => boolean) => {
    // 조건에 맞는 패턴들만 터
    const filteredPatterns = patterns.filter(condition)

    // wjmaxSongData에서 올바른 floor 값을 가져와서 패턴 정보 업데이트
    const updatedPatterns = filteredPatterns.map((pattern) => {
      // wjmaxSongData에서 해당 곡 찾기
      const song = wjmaxSongData.find((s) => s.title === pattern.title)
      if (!song) return { ...pattern, floor: 0 }

      // 해당 키모드의 패턴 정보 찾기
      const keyModePatterns = song.patterns[`${selectedKeyMode}B`]
      if (!keyModePatterns) return { ...pattern, floor: 0 }

      // pattern key에 해당하는 floor 값 찾기
      const patternInfo = keyModePatterns[pattern.pattern]
      if (!patternInfo) return { ...pattern, floor: 0 }

      // floor 값이 있으면 사용, 없으면 0
      return {
        ...pattern,
        floor: patternInfo.floor || 0,
      }
    })

    // 패턴의 난이도를 비교하는 함수
    const compareDifficulty = (a: Pattern, b: Pattern) => {
      // SC 패턴 (floor가 있는 경우)
      const aFloor = a.floor !== null && a.floor !== undefined ? Number(a.floor) : -1
      const bFloor = b.floor !== null && b.floor !== undefined ? Number(b.floor) : -1

      // 둘 다 SC 패턴인 경우 floor로 비교
      if (aFloor >= 0 && bFloor >= 0) {
        return bFloor - aFloor
      }

      // SC 패턴이 있는 경우 SC 패턴 우선
      if (aFloor >= 0) return -1
      if (bFloor >= 0) return 1

      // 둘 다 일반 패턴인 경우 level로 비교
      const aLevel = a.level || 0
      const bLevel = b.level || 0
      return bLevel - aLevel
    }

    // 난이도 순으로 정렬하고 가장 높은 난이도의 패턴 반환
    return updatedPatterns.sort(compareDifficulty)[0]
  }

  const [randomHeaderBg, setRandomHeaderBg] = useState(Math.floor(Math.random() * wjmaxSongData.length) + 1)
  const [randomHeaderBg2, setRandomHeaderBg2] = useState(Math.floor(Math.random() * wjmaxSongData.length) + 1)

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

  // 새로운 함수 추가
  const captureAndSaveSection = async () => {
    try {
      // html2canvas 라이브러리 사용
      const sectionElement: HTMLElement | null = document.querySelector('.stats-section')
      if (!sectionElement) return

      const canvas = await html2canvas(sectionElement)

      // 캔버스를 이미지로 변환
      const imageData = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')

      window.ipc.send('canvas-screenshot-upload', {
        buffer: imageData,
        fileName: `${userData.userName}_stats_${selectedKeyMode}B-${moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss-SSS')}.png`,
      })
    } catch (error) {
      console.error('Error capturing section:', error)
    }
  }

  return (
    <React.Fragment>
      <div className="tw-flex tw-gap-4 tw-h-[calc(100vh-theme(spacing.28))]">
        <motion.div
          layout
          initial={false}
          animate={{
            width: '100%',
            transition: {
              duration: 0.3,
              ease: 'easeInOut',
            },
          }}
          className="tw-relative tw-flex tw-flex-col tw-h-full tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-p-4"
        >
          <div className="tw-flex tw-flex-col tw-gap-1 tw-w-full tw-pb-4 tw-px-1 tw-mt-0.5 tw-border-b tw-border-gray-700 tw-mb-4">
            <span className="tw-text-lg tw-font-bold">
              {userData.userName !== '' && userData.userName !== '' ? `${userData.userName}` : 'Guest'}님의 성과표
            </span>
          </div>

          <div className="tw-absolute tw-right-4 tw-top-4 tw-z-10 tw-flex tw-gap-2 tw-items-center">
            <KeyModeSelector />

            {/* 토글 버튼 */}
          </div>

          {/* 스크롤 가능한 컨텐츠 영역 */}
          <div className="tw-flex-1 tw-overflow-y-auto tw-scroll-smooth">
            <div id="ContentHeader" />
            {selectedGame === 'wjmax' && (
              <div className="tw-flex tw-flex-col tw-gap-4">
                {isLoading ? (
                  <div className="tw-flex tw-items-center tw-justify-center tw-h-screen tw-flex-1">
                    <div className="tw-flex flex-equal tw-items-center tw-justify-center tw-h-[calc(100vh-theme(spacing.52))] tw-flex-1">
                      <SyncLoader color="#ffffff" size={8} />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 선택된 키모드에 대한 데이터 표시 */}
                    <div className="tw-flex tw-gap-4 stats-section">
                      <div className="tw-flex tw-flex-col tw-gap-4 tw-w-3/5">
                        <div className="[text-shadow:_0_0_1px_rgba(0,0,0,0.3),_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)] tw-relative tw-w-full tw-h-48 tw-rounded-lg tw-shadow-lg tw-overflow-hidden tw-transition-all tw-duration-1000 tw-ease-out tw-animate-fadeInLeft">
                          <Image
                            loading="lazy" // "lazy" | "eager"
                            blurDataURL={globalDictionary.blurDataURL}
                            src={`/images/wjmax/jackets/${wjmaxSongData[randomHeaderBg - 1].folderName}.jpg`}
                            alt="Background"
                            fill
                            className="tw-object-cover tw-blur-md tw-brightness-50 tw-opacity-50"
                          />
                          <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between">
                            {userData.userName !== '' ? (
                              <>
                                <div className="tw-flex tw-justify-between tw-items-end">
                                  <div className="tw-flex tw-flex-col">
                                    <span className="tw-text-3xl tw-font-bold [text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)]">
                                      TOTAL OVERALL
                                    </span>
                                  </div>
                                  <div className="tw-flex tw-flex-col tw-items-end">
                                    <span className="tw-text-lg tw-font-bold">WJMAX</span>
                                  </div>
                                </div>

                                <div className="tw-space-y-2">
                                  {/* PERFECT */}
                                  <div className="tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-w-32 tw-text-sm">PERFECT</span>
                                    <div className="tw-relative tw-flex-1 tw-h-6 tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden">
                                      <div
                                        className="tw-absolute tw-h-full tw-bg-red-500 tw-transition-all tw-duration-1000 tw-ease-out"
                                        style={{ width: showProgress ? `${calculateProgress(totalStats.perfect, totalStats.totalPatterns)}%` : '0%' }}
                                      />
                                      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-end tw-px-2 tw-text-xs tw-font-bold">
                                        {totalStats.perfect} / {totalStats.totalPatterns}
                                      </div>
                                    </div>
                                  </div>

                                  {/* MAX COMBO */}
                                  <div className="tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-w-32 tw-text-sm">MAX COMBO</span>
                                    <div className="tw-relative tw-flex-1 tw-h-6 tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden">
                                      <div
                                        className="tw-absolute tw-h-full tw-bg-green-500 tw-transition-all tw-duration-1000 tw-ease-out"
                                        style={{ width: showProgress ? `${calculateProgress(totalStats.maxCombo, totalStats.totalPatterns)}%` : '0%' }}
                                      />
                                      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-end tw-px-2 tw-text-xs tw-font-bold">
                                        {totalStats.maxCombo} / {totalStats.totalPatterns}
                                      </div>
                                    </div>
                                  </div>

                                  {/* CLEAR */}
                                  <div className="tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-w-32 tw-text-sm">CLEAR</span>
                                    <div className="tw-relative tw-flex-1 tw-h-6 tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden">
                                      <div
                                        className="tw-absolute tw-h-full tw-bg-blue-500 tw-transition-all tw-duration-1000 tw-ease-out"
                                        style={{ width: showProgress ? `${calculateProgress(totalStats.clear, totalStats.totalPatterns)}%` : '0%' }}
                                      />
                                      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-end tw-px-2 tw-text-xs tw-font-bold">
                                        {totalStats.clear} / {totalStats.totalPatterns}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
                                <div className="tw-text-center">
                                  <span className="tw-text-lg tw-font-bold">성과 기록 조회는 로그인 또는 V-ARCHIVE 계정 연동이 필요합니다.</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="[text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)] tw-shadow-lg tw-relative tw-w-full tw-h-80 tw-rounded-lg tw-overflow-hidden">
                          <Image
                            src={`/images/wjmax/jackets/${wjmaxSongData[randomHeaderBg2 - 1].folderName}.jpg`}
                            alt="Background"
                            fill
                            className="tw-object-cover tw-blur-md tw-brightness-50 tw-opacity-50"
                          />
                          <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between">
                            <div className="tw-flex tw-justify-between tw-items-end">
                              <span className="tw-flex tw-w-full tw-items-end tw-gap-1 tw-text-lg tw-font-bold">
                                <span className="tw-text-4xl tw-font-bold">{String(selectedKeyMode).replace('B', '').replace('_PLUS', '')}</span>
                                <span className="tw-me-auto tw-relative">
                                  Button
                                  {String(selectedKeyMode).includes('_PLUS') ? (
                                    <span className="tw-absolute tw-text-xl tw-right-[-12px] tw-top-[-12px] tw-font-bold">+</span>
                                  ) : null}
                                </span>
                              </span>
                            </div>

                            {/* 통계 정보 */}
                            {!isLoading && keyModeData[selectedKeyMode] && (
                              <div className="tw-space-y-2">
                                {Object.entries(calculateStats(keyModeData[selectedKeyMode])).map(([key, value], _, entries) => {
                                  if (key === 'total') return null
                                  const totalPatterns = entries.find(([k]) => k === 'total')?.[1] || 0
                                  const percentage = (value / totalPatterns) * 100

                                  return (
                                    <motion.div
                                      key={`${key}_${selectedKeyMode}`}
                                      initial={{ opacity: 0, x: 10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className={`tw-flex tw-items-center ${userData.userName !== '' ? '' : 'tw-blur-sm'} tw-gap-2`}
                                    >
                                      <span className="tw-w-32 tw-text-sm">{keyTitle[key]}</span>
                                      <div className="tw-relative tw-flex-1 tw-h-6 tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${percentage}%` }}
                                          transition={{ duration: 0.3 }}
                                          className={`tw-absolute tw-h-full ${
                                            key === 'maxCombo'
                                              ? 'tw-bg-green-500'
                                              : key === 'perfect'
                                              ? 'tw-bg-red-500'
                                              : key === 'clear'
                                              ? 'tw-bg-blue-500'
                                              : 'tw-bg-yellow-500'
                                          }`}
                                        />
                                        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-end tw-px-2 tw-text-xs tw-font-bold">
                                          {value} / {totalPatterns}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-6 tw-w-2/5">
                        <span className="tw-text-lg tw-font-bold">🎯 {String(selectedKeyMode).replace('_PLUS', '')} 최고 성과 기록</span>
                        {!isLoading && keyModeData[selectedKeyMode] && (
                          <motion.div
                            key={`achievements_${selectedKeyMode}`}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className="tw-flex tw-flex-col tw-gap-2"
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
                                const score = typeof pattern.score === 'string' ? parseFloat(pattern.score) : pattern.score
                                if (score === null) return false

                                // perfect, maxCombo, clear는 독립적으로 체크
                                if (key === 'perfect') {
                                  return Math.abs(score - 100.0) < 0.001
                                }
                                if (key === 'maxCombo') {
                                  return pattern.maxCombo
                                }
                                if (key === 'clear') {
                                  return score > 0
                                }

                                // over 카테고리들은 서로 겹치지 않도록 체크
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
                                <div key={`${key}_${selectedKeyMode}`} className="tw-flex tw-gap-2">
                                  <RaScorePopupComponent
                                    songItemTitle={String(highestPattern.title)}
                                    keyMode={String(selectedKeyMode).replace('B', '').replace('_PLUS', '')}
                                    judgementType=""
                                  />
                                  <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-p-3 tw-flex-1">
                                    <div className="tw-flex tw-justify-between tw-items-center">
                                      <span className="tw-text-sm tw-font-bold">{label}</span>
                                      <span className="tw-text-sm tw-font-extrabold">{getLevelDisplay(highestPattern)}</span>
                                    </div>
                                    <p className="tw-text-sm tw-text-gray-400 tw-break-all tw-max-w-full">{highestPattern.name}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div id="ContentFooter" />
          </div>
        </motion.div>
      </div>
    </React.Fragment>
  )
}
