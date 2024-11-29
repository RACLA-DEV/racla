import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { FaGithub, FaLink, FaTriangleExclamation, FaChevronLeft, FaChevronRight, FaRotate, FaX, FaXmark, FaBell } from 'react-icons/fa6'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'store'
import ImageViewerComponent from '@/components/layout/ImageViewerComponent'
import { setHomePanelOpen } from 'store/slices/appSlice'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { IconContext } from 'react-icons'
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
  const isHomePanelOpen = useSelector((state: RootState) => state.app.isHomePanelOpen)
  const songData = useSelector((state: RootState) => state.app.songData)
  const [category, setCategory] = useState<'notice' | 'update'>('update')
  const [updateIndex, setUpdateIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [slideDirection, setSlideDirection] = useState<number>(0)
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

  const KeyModeSelector = () => (
    <div className="tw-flex tw-gap-2">
      {['4', '5', '6', '8'].map((mode) => (
        <button
          key={`mode_${mode}`}
          onClick={() => setSelectedKeyMode(mode)}
          className={`tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-0.5 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md tw-flex-1 ${
            mode === selectedKeyMode
              ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-200'
              : 'tw-border-gray-600 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30'
          }`}
        >
          <div className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b${mode}`} />
          <span className="tw-relative tw-text-base tw-font-bold">{mode}B</span>
        </button>
      ))}
    </div>
  )

  useEffect(() => {
    const fetchAllBoardData = async () => {
      if (!userData.userName) return
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
                  `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${userData.userName}/board/${keyMode}/${boardType}`,
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

  const handlePrevUpdate = () => {
    setSlideDirection(-1)
    setUpdateIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleNextUpdate = () => {
    setSlideDirection(1)
    setUpdateIndex((prev) => (prev < updateSections.length - 1 ? prev + 1 : prev))
  }

  const togglePanel = () => {
    dispatch(setHomePanelOpen(!isHomePanelOpen))
    setCategory('notice')
  }

  // 난이도 표시 관련 함수 추가
  const getDifficultyClassName = (pattern: Pattern) => {
    if (pattern.floor != null && pattern.floor != 0) return 'SC'
    return pattern.pattern || 'NM'
  }

  const getLevelDisplay = (pattern: Pattern) => {
    if (pattern.floor != null && pattern.floor != 0) {
      return (
        <span
          className={`tw-flex tw-gap-2 tw-font-extrabold tw-items-center tw-text-respect-${pattern.floor ? 'sc' : 'nm'}-${
            Math.ceil((pattern.floor || pattern.level || 0) / 5) * 5
          }`}
        >
          <Image
            src={`/images/djmax_respect_v/${pattern.floor ? 'sc' : 'nm'}_${Math.ceil((pattern.floor || pattern.level || 0) / 5) * 5}_star.png`}
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
          {[...Array(Math.ceil(boardLevel / 5))].map((_, groupIndex) => {
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

  const update1Section = (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-break-keep">
      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            {/* 첫 번째 설명 블록 */}
            <div className="tw-bg-green-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-green-500">
              <span className="tw-font-bold tw-whitespace-pre-line">{`프로젝트 RA가 0.5.0 버전으로 업데이트 되었습니다.`}</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>본 업데이트에서는 새로운 기능 추가 사항과 기존 기능의 변경 사항이 많습니다. 공지사항과 업데이트를 꼭 확인해주세요.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                해당 창을 닫으려면 상하좌우의 검정 여백을 클릭해주세요. 홈 화면 우측 상단의{' '}
                <button disabled className="tw-bg-gray-700 tw-p-2 tw-rounded">
                  <FaBell />
                </button>{' '}
                버튼을 통해 다시 확인하실 수 있습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                업데이트 내용은 아래의 목차에 따라 내용이 정리되어 있습니다. 우측 상단의{' '}
                <button disabled className="tw-bg-gray-700 tw-p-2 tw-rounded">
                  <FaChevronLeft />
                </button>{' '}
                <button disabled className="tw-bg-gray-700 tw-p-2 tw-rounded">
                  <FaChevronRight />
                </button>{' '}
                버튼을 통해 확인하실 수 있습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>각 이미지는 클릭 시 원본 크기로 확대되어 확인할 수 있습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>추후 요약본 외 더 자세한 업데이트 내용과 도움말을 제공할 예정입니다.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const update2Section = (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-break-keep">
      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            {/* 첫 번째 설명 블록 */}
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold tw-whitespace-pre-line">새로운 기능</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                오버레이 기능 추가 - 오버레이 기능을 통해 인게임에서도 프로젝트 RA의 기능을 사용할 수 있습니다. 현재는 창 모드와 전체 창모드에서만 정상적으로
                작동합니다. 전체 화면은 추후 마이너 업데이트에서 지원될 예정입니다.
              </span>
              <div className="tw-flex tw-justify-center tw-my-4">
                <Image
                  src="https://cdn.lunatica.kr/project_ra/0cfbbb11-2078-439b-9b6c-0edc135cd9dd.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://cdn.lunatica.kr/project_ra/0cfbbb11-2078-439b-9b6c-0edc135cd9dd.png')}
                />
              </div>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>성과표 화면 추가 - V-ARCHIVE의 성과표를 포팅하였습니다. 일부 존재하지 않는 기능은 추후 마이너 업데이트를 통해 제공될 예정입니다.</span>
              <div className="tw-flex tw-justify-center tw-my-4">
                <Image
                  src="https://cdn.lunatica.kr/project_ra/c3c2dd77-183b-4ba1-8f74-3cce4b475653.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://cdn.lunatica.kr/project_ra/c3c2dd77-183b-4ba1-8f74-3cce4b475653.png')}
                />
              </div>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>홈 화면 추가 - V-ARCHIVE의 사용자 성과표 메인 화면을 기반으로한 홈 화면이 추가되었습니다.</span>
              <div className="tw-flex tw-justify-center tw-my-4">
                <Image
                  src="https://cdn.lunatica.kr/project_ra/66c7c48d-45e6-474e-926e-e6493de33da2.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://cdn.lunatica.kr/project_ra/66c7c48d-45e6-474e-926e-e6493de33da2.png')}
                />
              </div>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>설정 창 개편 및 기능 추가 - 저사양 모드, 다양한 캡쳐 설정 등이 추가되었습니다.</span>
              <div className="tw-flex tw-justify-center tw-my-4">
                <Image
                  src="https://cdn.lunatica.kr/project_ra/688ef865-7247-45db-bfd4-697070752b98.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://cdn.lunatica.kr/project_ra/688ef865-7247-45db-bfd4-697070752b98.png')}
                />
              </div>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                인게임 캡쳐 단축키 추가 - 자동 캡쳐 모드를 사용하지 않아 수동으로 기록 등록을 하거나 자동 캡쳐 모드의 인식 결과가 올바르지 않을 경우
                Ctrl+Alt+Insert 키로 인게임 캡쳐를 다시 시도할 수 있습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                키보드 접근성 기능 추가 - 대부분의 모달이나 팝업을 ESC 키를 눌러 닫을 수 있습니다. 단 공지사항 & 업데이트 패널은 ESC로 닫을 수 없습니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            {/* 첫 번째 설명 블록 */}
            <div className="tw-bg-yellow-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-yellow-500">
              <span className="tw-font-bold tw-whitespace-pre-line">변경 사항</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>로그인, 라이선스, 기록 등록, MAX DJ POWER, 서열표, 데이터베이스, 설정 창 등 대부분의 화면과 컴포넌트의 디자인이 변경되었습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>수동 기록 등록 시 이미지를 드래그 앤 드롭 방식으로 등록할 수 있습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>기록 등록의 이미지 재처리와 텍스트 인식을 더 이상 클라이언트에서 처리하지 않습니다. 앞으로는 모든 과정을 서버에서 처리합니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              기존의 자동 캡쳐 모드의 API 선택 사항이 제거되었습니다. 또한 관련된 API 코드를 모두 재작성하여 자동 캡쳐 모드의 성능이 크게 향상하였습니다.
              <br />
              (2024년 11월 19일 집계 기준 - 클라이언트 처리 평균 : 3.7초 + 캡쳐 주기 / 서버 처리 평균 : 0.8초 + 캡쳐 주기)
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                자동 캡쳐 모드 사용 시 캡쳐 화면에 검정색 여백이나 타이틀 바가 포함될 경우 이를 인식하여 재처리하는 로직이 추가되고 이미지 재처리 관련 코드를
                재작성하였습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                프로젝트 RA 내에서 DP 는 DJ POWER를 의미하며 TP 는 티어 포인트를 의미합니다. 해당되는 데이터가 존재하는 화면에서는 두 개의 값을 표시합니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>일부 화면에서 지연 로딩 로직을 추가하여 화면 전환 시 클라이언트의 부하를 줄였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>외부 링크 열기 기능에 개인정보 보호를 위한 보안 조치를 추가하였습니다. 링크를 열 때 브라우저 창이 바로 뜨는 것을 방지하였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                이 외 다수의 편의성 개선 사항이 있습니다.<span className="tw-line-through"> 다 적을려니 머리가 터질 것 같아요.</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            {/* 첫 번째 설명 블록 */}
            <div className="tw-bg-red-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-red-500">
              <span className="tw-font-bold tw-whitespace-pre-line">버그 수정 사항</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>소수점 처리 시 오류가 발생하여 NaN 값이 표시되거나 데이터가 정상적으로 표시되지 않는 버그를 수정하였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>글자의 위치나 이미지의 위치가 틀어지는 버그를 디자인을 갈아엎음으로써 수정하였습니다.(개발자 오열)</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>MAX DJ POWER 데이터 취합 시 MX와 SC 패턴의 데이터가 잘못 취합되어 점수, 층, 티어 포인트가 잘못 표시되는 버그를 수정하였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                이 외에도 다수의 버그를 수정하였습니다.<span className="tw-line-through"> 분명 고친건 이것보다 한참 많은데 사용자 눈에 띄는건 딱 요정도.</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const updateSections = [
    { title: '0.5.0 업데이트', content: update1Section },
    { title: '0.5.0 업데이트 요약', content: update2Section },
  ]

  const noticeSection = (
    <div className="tw-flex tw-flex-col tw-gap-8">
      {/* <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold">DJMAX RESPECT V에서 적용되는 DJ POWER, 티어 포인트 등의 수식(계산식)을 제공받습니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                <span className="tw-font-semibold tw-line-through">멍청한 개발자를 위해</span> 게임 시스템과 가장 근접한 수식(계산식)을 제공해주시는 분께는
                소정의 기프티콘과 선물을 드립니다. 왼쪽 하단 버그 신고로 연결된 카카오톡 오픈채팅 프로필로 공해주세요.
              </span>
            </div>
          </div>
        </div>
      </div> */}

      {/* <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold">DJMAX RESPECT V의 오픈 매치, 래 매치, 버서스 매치의 리절트(결과 창) 이미지를 제공받습니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                추후에 제공될 오픈 매치, 래더 매치, 버서 매치의 리절트(결과 창) 기록 등록 기능을 위해 이미지를 제공받고 있습니다. 왼쪽 하단에 버그 신고로 연결된
                카카오톡 오픈채팅 프로필로 제공해주세요.
              </span>
            </div>
          </div>
        </div>
      </div> */}

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-red-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-red-500">
              <span className="tw-font-bold">프로젝트 RA의 상태(State)값을 메모리 저장 방식에서 Redux(라이브러리)로 변경 작업 중에 있습니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                기존의 기능이 올바르게 작동하지 않는 경우가 있을 수 있습니다. 해당되는 버그는 왼쪽 하단에 버그 신고 연결된 카카오톡 오픈채팅 프로필로
                신고해주세요.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold">전체 화면에서는 오버레이 기능이 올바르게 작동하지 않습니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                현재 오버레이 기능은 창 모드, 전체 창모드에서만 올바르게 작동합니다. 단 오버레이 기능과 별개로 자동 캡쳐 모드는 창 모드, 전체 창모드, 전체
                화면에서 900p 이상 해상도에서 모두 정상적으로 작동하오니 착오가 없으시길 바랍니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-yellow-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-yellow-500">
              <span className="tw-font-bold">프로젝트 RA의 V-ARCHIVE Proxy API 서버가 개발 모드로 운영 중인 상태입니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>V-ARCHIVE Proxy API와 관련된 기능을 정상적으로 사용할 수 있으나, 서버와 통신 시 일시적인 지연이 발생 할 수 있습니다.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-yellow-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-yellow-500">
              <span className="tw-font-bold">프로젝트 RA의 OCR API 서버가 개발 모드로 운영 중인 상태입니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>OCR API와 관련된 기능을 정상적으로 사용할 수 있으나, 서버와 통신 시 일시적인 지연이 발생 할 수 있습니다.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

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
      else if (score >= 99 && score < 99.5) stats.over99++
      else if (score >= 97 && score < 99) stats.over97++
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

  // ESC 키 이벤트 핸들러 추가
  // useEffect(() => {
  //   const handleEscKey = (event: KeyboardEvent) => {
  //     if (event.key === 'Escape' && isHomePanelOpen) {
  //       togglePanel()
  //     }
  //   }

  //   // 이벤트 리스너 등록
  //   document.addEventListener('keydown', handleEscKey)

  //   // 컴포넌트 언마운트 시 이벤트 리스너 제거
  //   return () => {
  //     document.removeEventListener('keydown', handleEscKey)
  //   }
  // }, [isHomePanelOpen, togglePanel]) // togglePanel 함수도 의존성에 추가

  // 배경 클릭 핸들러
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      togglePanel()
    }
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
      <Head>
        <title>홈 - 프로젝트 RA</title>
      </Head>

      <div className="tw-flex tw-gap-4 tw-h-[calc(100vh-theme(spacing.28))]">
        <motion.div
          layout
          initial={false}
          animate={{
            width: '100%',
            filter: isHomePanelOpen ? 'brightness(0.5) blur(8px)' : 'brightness(1) blur(0px)',
            transition: {
              duration: 0.3,
              ease: 'easeInOut',
            },
          }}
          className="tw-relative tw-flex tw-flex-col tw-h-full tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-p-4"
        >
          <div className="tw-flex tw-flex-col tw-gap-1 tw-w-full tw-pb-4 tw-px-1 tw-mt-0.5 tw-border-b tw-border-gray-700 tw-mb-4">
            <span className="tw-text-lg tw-font-bold">{userData.userName !== '' ? userData.userName : 'Guest'}님의 성과표</span>
          </div>

          <div className="tw-absolute tw-right-4 tw-top-4 tw-z-10 tw-flex tw-gap-2 tw-items-center">
            <KeyModeSelector />

            {/* 토글 버튼 */}
            <button onClick={togglePanel} className="tw-bg-gray-700 tw-p-2 tw-rounded tw-relative">
              <FaBell />
              <div className="tw-absolute tw-top-[-4px] tw-right-[-4px] tw-w-[6px] tw-h-[6px] tw-bg-orange-500 tw-rounded-full tw-animate-ping" />
            </button>
          </div>

          {/* 스크롤 가능한 컨텐츠 영역 */}
          <div className="tw-flex-1 tw-overflow-y-auto tw-scroll-smooth">
            <div id="ContentHeader" />
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
                          className="tw-object-cover tw-blur-md tw-brightness-50"
                        />
                        <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between">
                          {userData.userName !== '' ? (
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
                                <span className="tw-text-lg tw-font-bold">성과 기록 조회는 로그인이 필요합니다.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isLoading && userData.userName !== '' && (
                        <div className="tw-flex tw-flex-col tw-justify-center tw-flex-1 tw-shadow-lg tw-items-center tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-text-xs tw-p-6 tw-w-full">
                          <div className="tw-flex tw-justify-center tw-gap-1 tw-w-full">
                            <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-green-700">NEW 30 CUT</span>
                            <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">
                              {cutoffScores[selectedKeyMode]?.new30.toFixed(3)} DP
                            </span>
                            <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-yellow-500">
                              BASIC 70 CUT
                            </span>
                            <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">
                              {cutoffScores[selectedKeyMode]?.basic70.toFixed(3)} DP
                            </span>
                            <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-red-500">TOP 50 CUT</span>
                            <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">
                              {cutoffScores[selectedKeyMode]?.top50.toFixed(3)} TP
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="[text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)] tw-shadow-lg tw-relative tw-w-full tw-h-80 tw-rounded-lg tw-overflow-hidden">
                        <Image
                          src={`/images/djmax_respect_v/${selectedKeyMode}B-BG.png`}
                          alt="Background"
                          fill
                          className="tw-object-cover tw-blur-md tw-brightness-50"
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
                      {/* Cutoff 점수 표시 */}
                      {!isLoading && userData.userName !== '' && (
                        <div className="tw-flex tw-flex-col tw-justify-center tw-flex-1 tw-items-center tw-gap-1 tw-shadow-lg tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-text-xs tw-p-6 tw-w-full">
                          <div className="tw-flex tw-justify-center tw-gap-2 tw-w-full">
                            <span className="tw-p-1 tw-px-4 tw-bg-opacity-50 tw-rounded-md tw-text-gray-400 tw-text-center">
                              Generated by PROJECT RA. Powered by V-ARCHIVE Open API. Resources from DJMAX RESPECT V(ⓒNEOWIZ)
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
                                  <span className="tw-text-xs tw-text-gray-400 tw-truncate" title={highestPattern.name}>
                                    {highestPattern.name}
                                  </span>
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
                              userData.userName !== '' ? '' : 'tw-blur-sm tw-cursor-not-allowed'
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
              {/* <span className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold tw-mt-4">
                <FaTriangleExclamation />
                <div className="tw-flex tw-flex-col">
                  <span>해당 버전은 최종적인 버전이 아닙니다.</span>
                  <span>추가적인 개발, 피드백 반영 사항 등에 따라 기능이 일부 변경될 수 있습니다.</span>
                </div>
              </span> */}
            </div>
            <div id="ContentFooter" />
          </div>
        </motion.div>

        {isHomePanelOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="tw-fixed tw-rounded-md tw-inset-0 tw-bg-gray-950 tw-bg-opacity-50 tw-z-[9999]"
              onClick={handleOverlayClick}
            />

            {/* 패널 */}
            <motion.div
              initial={{ opacity: 0, y: '5%' }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.3,
                  ease: 'easeInOut',
                },
              }}
              exit={{
                opacity: 0,
                y: '5%',
                transition: {
                  duration: 0.3,
                  ease: 'easeInOut',
                },
              }}
              className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-z-[99999]"
              onClick={handleOverlayClick}
            >
              <div
                className="tw-flex tw-gap-3 tw-flex-col tw-h-5/6 tw-w-2/3 tw-bg-gray-900 tw-rounded-md tw-p-4 
                  tw-overflow-hidden tw-transition-all tw-duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 패널 헤더 - 기존 탭 스타일 유지 */}
                <nav className="tw-flex-shrink-0">
                  <div className="tw-flex tw-justify-between tw-items-center">
                    <div className="tw-flex tw-border-b tw-border-gray-700 tw-flex-1">
                      <button
                        className={`tw-px-4 tw-py-2 tw-text-sm ${
                          category === 'notice' ? 'tw-border-b-2 tw-border-blue-500 tw-font-semibold' : 'tw-text-gray-400 hover:tw-text-gray-300'
                        }`}
                        onClick={() => setCategory('notice')}
                      >
                        공지사항
                      </button>
                      <button
                        className={`tw-px-4 tw-py-2 tw-text-sm ${
                          category === 'update' ? 'tw-border-b-2 tw-border-blue-500 tw-font-semibold' : 'tw-text-gray-400 hover:tw-text-gray-300'
                        }`}
                        onClick={() => setCategory('update')}
                      >
                        업데이트
                      </button>
                    </div>
                  </div>
                </nav>

                {/* 패널 콘텐츠 */}
                <div className="tw-flex-1 tw-overflow-y-auto tw-scroll-smooth">
                  {category === 'notice' ? (
                    noticeSection
                  ) : (
                    <div className="tw-flex tw-flex-col tw-h-full">
                      {/* 업데이트 제목과 네비게이션 */}
                      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                        <h2 className="tw-text-lg tw-font-extrabold tw-px-1 tw-pt-1">{updateSections[updateIndex].title}</h2>
                        <div className="tw-flex tw-gap-2">
                          <button
                            onClick={handlePrevUpdate}
                            disabled={updateIndex === 0}
                            className={`tw-p-2 tw-rounded hover:tw-bg-gray-700 ${updateIndex === 0 ? 'tw-opacity-50 tw-cursor-not-allowed' : 'tw-bg-gray-700'}`}
                          >
                            <FaChevronLeft className="tw-w-4 tw-h-4" />
                          </button>
                          <button
                            onClick={handleNextUpdate}
                            disabled={updateIndex === updateSections.length - 1}
                            className={`tw-p-2 tw-rounded hover:tw-bg-gray-700 ${
                              updateIndex === updateSections.length - 1 ? 'tw-opacity-50 tw-cursor-not-allowed' : 'tw-bg-gray-700'
                            }`}
                          >
                            <FaChevronRight className="tw-w-4 tw-h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 업데이트 내용 */}
                      <AnimatePresence mode="wait" custom={slideDirection}>
                        <motion.div
                          key={updateIndex}
                          custom={slideDirection}
                          initial={{ opacity: 0, x: 100 * slideDirection }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 * slideDirection }}
                          transition={{ duration: 0.3 }}
                        >
                          {updateSections[updateIndex].content}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* 이미지 뷰어 모달 */}
      {selectedImage && <ImageViewerComponent src={selectedImage} onClose={() => setSelectedImage(null)} />}
    </React.Fragment>
  )
}
