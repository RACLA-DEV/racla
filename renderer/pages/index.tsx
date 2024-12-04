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

interface Pattern {
  title: number
  name: string
  composer: string
  pattern: string
  score: number | null
  maxCombo: number | null
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

export default function HomePage() {
  const dispatch = useDispatch()
  const userData = useSelector((state: RootState) => state.app.userData)
  const vArchiveUserData = useSelector((state: RootState) => state.app.vArchiveUserData)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  const songData = useSelector((state: RootState) => state.app.songData)
  const [showProgress, setShowProgress] = useState(false)
  const [keyModeData, setKeyModeData] = useState<KeyModeData>({
    '4': [],
    '5': [],
    '6': [],
    '8': [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [totalStats, setTotalStats] = useState({
    perfect: 0,
    maxCombo: 0,
    clear: 0,
    totalPatterns: 0,
  })

  const [boards, setBoards] = useState<string[]>(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'MX', 'SC', 'SC5', 'SC10', 'SC15'])

  const [cutoffScores, setCutoffScores] = useState<{
    [keyMode: string]: {
      new30: number
      basic70: number
      top50: number
    }
  }>({
    '4': { new30: 0, basic70: 0, top50: 0 },
    '5': { new30: 0, basic70: 0, top50: 0 },
    '6': { new30: 0, basic70: 0, top50: 0 },
    '8': { new30: 0, basic70: 0, top50: 0 },
  })

  const [selectedKeyMode, setSelectedKeyMode] = useState<string>('4')

  const KeyModeSelector = () =>
    selectedGame === 'djmax_respect_v' && (
      <div className="tw-flex tw-gap-2">
        {globalDictionary[selectedGame].keyModeList.map((mode) => (
          <button
            key={`mode_${mode}`}
            onClick={() => setSelectedKeyMode(String(mode))}
            className={`tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-0.5 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md tw-flex-1 ${
              String(mode) === selectedKeyMode
                ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100'
            }`}
          >
            <div
              className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 ${selectedGame === 'djmax_respect_v' ? 'respect' : 'wjmax'}_bg_b${String(mode).replace(
                'P',
                '',
              )}`}
            />
            <span className="tw-relative tw-text-base tw-font-bold">
              {String(mode).replace('P', '')}B{String(mode).includes('P') ? '+' : ''}
            </span>
          </button>
        ))}
      </div>
    )

  useEffect(() => {
    const fetchAllBoardData = async () => {
      if (!vArchiveUserData.userName) return
      setIsLoading(true)

      try {
        const keyModes = ['4', '5', '6', '8']
        const allKeyModeData: KeyModeData = {}

        for (const keyMode of keyModes) {
          // 기본 곡 데이터 가져오기 (songData 활용)
          const baseSongData = songData.flatMap((track) => {
            const { title, name, composer, dlcCode, dlc, patterns } = track
            const patternButton = patterns[keyMode + 'B']

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
                const response = await axios.get(
                  `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/board/${keyMode}/${boardType}`,
                )
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
  }, [vArchiveUserData.userName])

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

        // Perfect 체크 (score가 100인 경우)
        if (pattern.score == 100) {
          stats.perfect++
        }

        // Max Combo 체크 (maxCombo가 1인 경우)
        if (pattern.maxCombo === 1) {
          stats.maxCombo++
        }

        // Clear 체크 (score가 존재하고 0보다 큰 경우)
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

  const getTierByScore = (score: number) => {
    const tierList = {
      9950: 'Grand Master',
      9900: 'Master I',
      9800: 'Master II',
      9700: 'Master III',
      9600: 'Diamond I',
      9400: 'Diamond II',
      9200: 'Diamond III',
      9000: 'Diamond IV',
      8800: 'Platinum I',
      8600: 'Platinum II',
      8400: 'Platinum III',
      8200: 'Platinum IV',
      8000: 'Gold I',
      7800: 'Gold II',
      7600: 'Gold III',
      7400: 'Gold IV',
      7200: 'Silver I',
      7000: 'Silver II',
      6800: 'Silver III',
      6600: 'Silver IV',
      6300: 'Bronze I',
      6000: 'Bronze II',
      5650: 'Bronze III',
      5300: 'Bronze IV',
      4900: 'Iron I',
      4600: 'Iron II',
      4300: 'Iron III',
      4000: 'Iron IV',
      3000: 'Amateur I',
      2000: 'Amateur II',
      1000: 'Amateur III',
      500: 'Amateur IV',
      0: 'Beginner',
    }

    if (score < 0) return 'Beginner'
    if (score >= 9950) return 'Grand Master'

    const tierScores = Object.keys(tierList)
      .map(Number)
      .sort((a, b) => b - a)

    const nearestTierScore = tierScores.find((tierScore) => score >= tierScore) ?? 0

    return tierList[nearestTierScore]
  }

  const calculateKeyModeTier = (patterns: Pattern[], maxScore: number) => {
    const top50Ratings = patterns
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 50)
      .reduce((sum, pattern) => sum + pattern.rating, 0)

    const tierScore = Math.floor((top50Ratings / maxScore) * 10000)
    return getTierByScore(tierScore)
  }

  // 키모드별 만점 점수 설정
  const KEY_MODE_MAX_SCORES = {
    '4': 9696,
    '5': 9732,
    '6': 9700,
    '8': 9741,
  }

  // 난이도 표시 관련 함수 추가
  const getDifficultyClassName = (pattern: Pattern) => {
    if (pattern.floor != null && pattern.floor != 0) return 'SC'
    return pattern.pattern || 'NM'
  }

  const getLevelDisplay = (pattern: Pattern) => {
    const getFloorGroup = (value: number) => {
      if (value <= 5) return 5
      if (value <= 10) return 10
      return 15 // 15보다 큰 값도 모두 15로 처리
    }

    if (pattern.floor != null && pattern.floor != 0) {
      const floorGroup = getFloorGroup(pattern.floor)
      return (
        <span className={`tw-flex tw-gap-2 tw-font-extrabold tw-items-center tw-text-respect-${pattern.floor ? 'sc' : 'nm'}-${floorGroup}`}>
          <Image
            src={`/images/djmax_respect_v/${pattern.floor ? 'sc' : 'nm'}_${floorGroup}_star.png`}
            alt="difficulty"
            width={16}
            height={16}
            className="tw-w-4 tw-h-4"
          />
          <span className="tw-font-extrabold tw-mb-0.5">{`${pattern.floor}`}F</span>
        </span>
      )
    }
    if (pattern.level != null) {
      return (
        <span className={`tw-flex tw-gap-2 tw-font-extrabold tw-items-center tw-text-respect-nm-${Math.ceil((pattern.level || 0) / 5) * 5}`}>
          <Image
            src={`/images/djmax_respect_v/nm_${Math.ceil((pattern.level || 0) / 5) * 5}_star.png`}
            alt="difficulty"
            width={16}
            height={16}
            className="tw-w-4 tw-h-4"
          />
          <span className="tw-font-extrabold tw-mb-0.5">{`${pattern.level}`}</span>
        </span>
      )
    }
    return '난이도 정보 없음'
  }

  // 별 렌더링 함수 수정
  const renderStars = (pattern: Pattern) => {
    // 별 이미지 선택 함수
    const getStarImage = (starCount: number, isSC: boolean) => {
      const prefix = isSC ? 'sc' : 'nm'
      // 1-5: 5_star, 6-10: 10_star, 11-15: 15_star
      if (starCount <= 5) {
        return `${prefix}_5_star.png`
      } else if (starCount <= 10) {
        return `${prefix}_10_star.png`
      } else {
        return `${prefix}_15_star.png`
      }
    }

    // floor가 있는 경우 (큰별 + 작은별)
    if (pattern.floor) {
      const fullStars = Math.floor(pattern.floor)
      const decimalPart = String(pattern.floor).includes('.') ? parseInt(String(pattern.floor).split('.')[1]) : 0
      const isSC = pattern.pattern.startsWith('SC')

      return (
        <div className="tw-flex tw-gap-1 tw-items-end">
          {/* 큰 별들을 5개씩 묶어서 다른 이미지 사용 */}
          {[...Array(Math.ceil(fullStars / 5))].map((_, groupIndex) => {
            const starsInGroup = Math.min(5, fullStars - groupIndex * 5)
            const starImage = getStarImage((groupIndex + 1) * 5, isSC)

            return [...Array(starsInGroup)].map((_, starIndex) => (
              <Image
                key={`${pattern.title}_${pattern.pattern}_full_${groupIndex}_${starIndex}`}
                src={`/images/djmax_respect_v/${starImage}`}
                alt="star"
                width={16}
                height={16}
                className="tw-w-4 tw-h-4"
                loading="lazy"
                blurDataURL={globalDictionary.blurDataURL}
              />
            ))
          })}

          {/* 작은 별 (소수점이 있는 경우) */}
          {decimalPart > 0 &&
            [...Array(decimalPart)].map((_, i) => (
              <Image
                key={`${pattern.title}_${pattern.pattern}_small_${i}`}
                src={`/images/djmax_respect_v/${getStarImage(Math.ceil(fullStars / 5) * 5, isSC)}`}
                alt="small-star"
                width={12}
                height={12}
                className="tw-w-3 tw-h-3"
                loading="lazy"
                blurDataURL={globalDictionary.blurDataURL}
              />
            ))}
        </div>
      )
    }

    // floor가 없는 경우 board 값으로 큰별만 표시
    const boardLevel = parseInt(String(pattern.board).replace('SC', ''))
    if (!isNaN(boardLevel)) {
      const isSC = pattern.pattern.startsWith('SC')

      return (
        <div className="tw-flex tw-gap-1">
          {[...Array(Math.round(boardLevel / 5))].map((_, groupIndex) => {
            const starsInGroup = Math.min(5, boardLevel - groupIndex * 5)
            const starImage = getStarImage((groupIndex + 1) * 5, isSC)

            return [...Array(starsInGroup)].map((_, starIndex) => (
              <Image
                key={`${pattern.title}_${pattern.pattern}_board_${groupIndex}_${starIndex}`}
                src={`/images/djmax_respect_v/${starImage}`}
                alt="star"
                width={16}
                height={16}
                className="tw-w-4 tw-h-4"
                loading="lazy"
                blurDataURL={globalDictionary.blurDataURL}
              />
            ))
          })}
        </div>
      )
    }

    return null
  }

  const getHighestLevelInfo = (patterns: Pattern[], condition: (pattern: Pattern) => boolean) => {
    // 조건에 맞는 패턴들만 터
    const filteredPatterns = patterns.filter(condition)

    // songData에서 올바른 floor 값을 가져와서 패턴 정보 업데이트
    const updatedPatterns = filteredPatterns.map((pattern) => {
      // songData에서 해당 곡 찾기
      const song = songData.find((s) => s.title === pattern.title)
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

  const keyBoardTitle = {
    1: 'Lv.1',
    2: 'Lv.2',
    3: 'Lv.3',
    4: 'Lv.4',
    5: 'Lv.5',
    6: 'Lv.6',
    7: 'Lv.7',
    8: 'Lv.8',
    9: 'Lv.9',
    10: 'Lv.10',
    11: 'Lv.11',
    MX: 'Lv.12~15',
    SC: 'SC',
    SC5: 'SC~5',
    SC10: 'SC~10',
    SC15: 'SC~15',
  }

  const [randomHeaderBg, setRandomHeaderBg] = useState(Math.floor(Math.random() * 17) + 1)

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
      const score = typeof pattern.score === 'string' ? parseFloat(pattern.score) : pattern.score

      if (pattern.maxCombo === 1) stats.maxCombo++
      if (score === 100.0) stats.perfect++
      else if (score >= 99.9 && score < 100) stats.over999++
      else if (score >= 99.5 && score < 99.9) stats.over995++
      else if (score >= 99.0 && score < 99.5) stats.over99++
      else if (score >= 97.0 && score < 99.0) stats.over97++
      if (score !== null && score > 0) stats.clear++
    })

    return stats
  }

  // 그래프 표시 부분 수정
  const keyTitle = {
    maxCombo: 'Max Combo',
    perfect: 'Perfect',
    over999: 'Over 99.9%',
    over995: 'Over 99.5%',
    over99: 'Over 99%',
    over97: 'Over 97%',
    clear: 'Clear',
    total: '전체',
  }

  // 티어 점수를 저장할 state 추가
  const [tierScores, setTierScores] = useState<{
    [keyMode: string]: {
      tierScore: number
      tier: string
    }
  }>({
    '4': { tierScore: 0, tier: 'Beginner' },
    '5': { tierScore: 0, tier: 'Beginner' },
    '6': { tierScore: 0, tier: 'Beginner' },
    '8': { tierScore: 0, tier: 'Beginner' },
  })

  // keyModeData가 업데이트될 때마다 티어 점수 계산
  useEffect(() => {
    const newTierScores = { ...tierScores }

    Object.entries(keyModeData).forEach(([keyMode, patterns]) => {
      // rating 기준으로 정렬하고 상위 50개 선택
      const top50 = [...patterns].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 50)

      // rating 합계 계산
      const totalRating = top50.reduce((sum, pattern) => sum + (pattern.rating || 0), 0)

      // 티어 점수 계산
      const tierScore = (totalRating / KEY_MODE_MAX_SCORES[keyMode]) * 10000

      newTierScores[keyMode] = {
        tierScore,
        tier: getTierByScore(tierScore),
      }
    })

    setTierScores(newTierScores)
  }, [keyModeData])

  // cutoff 점수 계산 로직 수정
  useEffect(() => {
    const newCutoffScores = { ...cutoffScores }

    Object.entries(keyModeData).forEach(([keyMode, patterns]) => {
      // 모든 패턴을 하나의 배열로 합치고 중복 제거
      const allPatterns = Object.values(
        patterns.reduce((acc, pattern) => {
          const key = `${pattern.title}_${pattern.pattern}`
          if (!acc[key] || acc[key].djpower < pattern.djpower) {
            acc[key] = pattern
          }
          return acc
        }, {}),
      )

      // NEW 30 턴 필터링 및 정렬 (VL, TEK DLC와 Insane Drift)
      const newPatterns = allPatterns
        .filter((pattern: any) => pattern.dlcCode === 'VL' || pattern.dlcCode === 'TEK' || pattern.name === 'Insane Drift')
        .sort((a: any, b: any) => (b.djpower || 0) - (a.djpower || 0))

      // BASIC 70 패턴 필터링 및 정렬 (VL, TEK DLC와 Insane Drift 제외)
      const basicPatterns = allPatterns
        .filter((pattern: any) => pattern.dlcCode !== 'VL' && pattern.dlcCode !== 'TEK' && pattern.name !== 'Insane Drift')
        .sort((a: any, b: any) => (b.djpower || 0) - (a.djpower || 0))

      // TOP 50 렬 (rating 기준)
      const top50Patterns = [...allPatterns]
        .filter((pattern: any) => pattern.rating != null)
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 50)

      newCutoffScores[keyMode] = {
        new30: (newPatterns[29] as any)?.djpower || 0,
        basic70: (basicPatterns[69] as any)?.djpower || 0,
        top50: (top50Patterns[49] as any)?.rating || 0,
      }
    })

    setCutoffScores(newCutoffScores)
  }, [keyModeData])

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
        fileName: `${vArchiveUserData.userName}_stats_${selectedKeyMode}B-${moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss-SSS')}.png`,
      })
    } catch (error) {
      console.error('Error capturing section:', error)
    }
  }

  return (
    <React.Fragment>
      <Head>
        <title>홈 - 프로젝트 RA</title>
      </Head>

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
              {userData.userName !== '' && vArchiveUserData.userName !== '' ? `${userData.userName}(${vArchiveUserData.userName})` : 'Guest'}님의 성과표
            </span>
          </div>

          <div className="tw-absolute tw-right-4 tw-top-4 tw-z-10 tw-flex tw-gap-2 tw-items-center">
            <KeyModeSelector />

            {/* 토글 버튼 */}
          </div>

          {/* 스크롤 가능한 컨텐츠 영역 */}
          <div className="tw-flex-1 tw-overflow-y-auto tw-scroll-smooth">
            <div id="ContentHeader" />
            {selectedGame === 'djmax_respect_v' && (
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
                            src={`/images/djmax_respect_v/header_bg${randomHeaderBg}.jpg`}
                            alt="Background"
                            fill
                            className="tw-object-cover tw-blur-md tw-brightness-50 tw-opacity-50"
                          />
                          <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between">
                            {vArchiveUserData.userName !== '' ? (
                              <>
                                <div className="tw-flex tw-justify-between tw-items-end">
                                  <div className="tw-flex tw-flex-col">
                                    <span className="tw-text-3xl tw-font-bold [text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)]">
                                      Total Overall
                                    </span>
                                  </div>
                                  <div className="tw-flex tw-flex-col tw-items-end">
                                    <span className="tw-text-lg tw-font-bold">DJMAX RESPECT V</span>
                                  </div>
                                </div>

                                <div className="tw-space-y-2">
                                  {/* Total Perfect */}
                                  <div className="tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-w-32 tw-text-sm">Total Perfect</span>
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

                                  {/* Total Max Combo */}
                                  <div className="tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-w-32 tw-text-sm">Total Max Combo</span>
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

                                  {/* Total Clear */}
                                  <div className="tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-w-32 tw-text-sm">Total Clear</span>
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
                            src={`/images/djmax_respect_v/${selectedKeyMode}B-BG.png`}
                            alt="Background"
                            fill
                            className="tw-object-cover tw-blur-md tw-brightness-50 tw-opacity-50"
                          />
                          <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between">
                            <div className="tw-flex tw-justify-between tw-items-end">
                              <span className="tw-flex tw-w-full tw-items-end tw-gap-1 tw-text-lg tw-font-bold">
                                <span className="tw-text-4xl tw-font-bold">{selectedKeyMode}</span>
                                <span className="tw-me-auto">Button</span>
                                <span className="tw-text-lg tw-font-bold">{tierScores[selectedKeyMode].tier}</span>
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
                                      className={`tw-flex tw-items-center ${vArchiveUserData.userName !== '' ? '' : 'tw-blur-sm'} tw-gap-2`}
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

                        {!isLoading && vArchiveUserData.userName !== '' && (
                          <div className="tw-flex tw-flex-col tw-justify-center tw-shadow-lg tw-items-center tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-text-xs tw-p-6 tw-w-full">
                            <div className="tw-flex tw-justify-center tw-gap-1 tw-w-full">
                              <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-green-700">NEW 30</span>
                              <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">
                                {cutoffScores[selectedKeyMode]?.new30.toFixed(3)} DP
                              </span>
                              <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-yellow-500">
                                BASIC 70
                              </span>
                              <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">
                                {cutoffScores[selectedKeyMode]?.basic70.toFixed(3)} DP
                              </span>
                              <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-red-500">TOP 50</span>
                              <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">
                                {cutoffScores[selectedKeyMode]?.top50.toFixed(3)} TP
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-6 tw-w-2/5">
                        <span className="tw-text-lg tw-font-bold">🎯 {selectedKeyMode}B 최고 성과 기록</span>
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
                                  return pattern.maxCombo === 1
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
                                  <ScorePopupComponent songItemTitle={String(highestPattern.title)} keyMode={selectedKeyMode} />
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

                    <div className="tw-flex tw-gap-4">
                      {/* <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-6 tw-flex-1">
                      <div className="tw-flex tw-items-center tw-justify-between">
                        <span className="tw-text-lg tw-font-bold">🎮 성과표 바로가기</span>
                      </div>
                      <div className="tw-grid tw-grid-cols-4 tw-gap-2 tw-flex-1">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'MX', 'SC', 'SC5', 'SC10', 'SC15'].map((level) => (
                          <Link
                            key={`level_${level}`}
                            href={`/vArchive/board/${selectedKeyMode}/${level}`}
                            className={`${
                              vArchiveUserData.userName !== '' ? '' : 'tw-blur-sm tw-cursor-not-allowed'
                            } tw-flex tw-items-center tw-justify-center tw-relative tw-px-3 tw-py-1.5 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md tw-border-gray-600 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30`}
                          >
                            <div className="tw-absolute tw-w-full tw-h-full tw-opacity-30" />
                            <span className="tw-relative tw-text-sm tw-font-bold">{keyBoardTitle[level]}</span>
                          </Link>
                        ))}
                      </div>
                    </div> */}
                    </div>
                  </>
                )}

                {/* 하단 고문 */}
                {/* <span className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-sm tw-font-semibold tw-mt-4">
                <FaTriangleExclamation />
                <div className="tw-flex tw-flex-col">
                  <span>해당 버전은 최종적인 버전이 아닙니다.</span>
                  <span>추가적인 개발, 피드백 반영 사항 등에 따라 기능이 일부 변경될 수 있습니다.</span>
                </div>
              </span> */}
              </div>
            )}
            <div id="ContentFooter" />
          </div>
        </motion.div>
      </div>
    </React.Fragment>
  )
}
