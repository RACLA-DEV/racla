import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { SyncLoader } from 'react-spinners'
import ScorePopupComponent from '@/components/score/ScorePopupComponent'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import { useParams } from 'next/navigation'

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
}

interface Floor {
  floorNumber: number
  patterns: Pattern[]
}

// 티어 포인트 맵 추가
const tierPointMap = {
  '16.3': 208,
  '16.2': 206,
  '16.1': 204,
  '15.3': 202,
  '15.2': 200,
  '15.1': 199,
  '14.3': 198,
  '14.2': 196,
  '14.1': 195,
  '13.3': 194,
  '13.2': 192,
  '13.1': 191,
  '12.3': 190,
  '12.2': 188,
  '12.1': 187,
  '11.3': 186,
  '11.2': 184,
  '11.1': 182,
  '10.3': 180,
  '10.2': 178,
  '10.1': 176,
  '9.3': 174,
  '9.2': 172,
  '9.1': 170,
  '8.3': 168,
  '8.2': 167,
  '8.1': 166,
  '7.3': 165,
  '7.2': 164,
  '7.1': 163,
  '6.3': 162,
  '6.2': 161,
  '6.1': 160,
  '5.3': 159,
  '5.2': 158,
  '5.1': 157,
  '4.3': 156,
  '4.2': 155,
  '4.1': 154,
  '3.3': 153,
  '3.2': 152,
  '3.1': 151,
  '2.3': 150,
  '2.2': 148,
  '2.1': 146,
  '1.3': 144,
  '1.2': 142,
  '1.1': 140,
  '11L': 140,
  '10L': 130,
  '9L': 120,
  '8L': 110,
  '7L': 100,
  '6L': 90,
  '5L': 80,
  '4L': 70,
  '3L': 60,
  '2L': 50,
  '1L': 40,
}

const Board = () => {
  const router = useRouter()
  const { keyMode, board } = router.query
  const { userData, songData, vArchiveUserData } = useSelector((state: RootState) => state.app)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [floorData, setFloorData] = useState<Floor[]>([])
  const [isMounted, setIsMounted] = useState<boolean>(true)
  const [highlightCondition, setHighlightCondition] = useState<string | null>(null)
  const [highlightInverse, setHighlightInverse] = useState<boolean>(false)
  const [cutoffScores, setCutoffScores] = useState({
    new30: 0,
    basic70: 0,
    top50: 0,
  })

  // songData에서 현재 keyMode와 board에 해당하는 패턴 데이터 추출
  const processBaseSongData = () => {
    if (!songData || !keyMode) return []

    let processedData = []
    songData.forEach((track) => {
      const { title, name, composer, dlcCode, dlc, patterns } = track
      const patternButton = patterns[keyMode + 'B']

      if (patternButton) {
        // 모든 패턴 타입(NM, HD, MX, SC)에 대해 처리
        Object.entries(patternButton).forEach(([key, pattern]: any) => {
          processedData.push({
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
            patterns,
          })
        })
      }
    })
    return processedData
  }

  const [boards, setBoards] = useState<string[]>(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'MX', 'SC', 'SC5', 'SC10', 'SC15'])

  useEffect(() => {
    setIsMounted(true)

    const fetchBoardData = async () => {
      if (!vArchiveUserData.userName || !keyMode || !board) return

      setIsLoading(true)
      try {
        // 기본 곡 데이터 가져오기
        const baseSongData = processBaseSongData()

        // V-ARCHIVE API에서 점수 데이터 가져오기
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/board/${keyMode}/${board}`,
        )

        if (isMounted) {
          // API 응답 데이터와 기본 곡 데이터 결합
          const combinedFloors =
            response.data.floors?.map((floor) => ({
              floorNumber: floor.floorNumber,
              patterns: floor.patterns
                .map((apiPattern) => {
                  const basePattern = baseSongData.find((bp) => bp.title === apiPattern.title && bp.pattern === apiPattern.pattern)
                  if (!basePattern) return null
                  return {
                    ...basePattern,
                    ...apiPattern,
                    floor: floor.floorNumber,
                    patterns: basePattern.patterns,
                  }
                })
                .filter(Boolean),
            })) || []

          console.log(combinedFloors)

          setFloorData(combinedFloors)
        }
      } catch (error) {
        console.error('Error fetching board data:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchBoardData()

    return () => {
      setIsMounted(false)
      setFloorData([])
    }
  }, [vArchiveUserData.userName, keyMode, board, songData])

  useEffect(() => {
    const fetchAllBoardData = async () => {
      if (!vArchiveUserData.userName || !keyMode) return

      try {
        // 모든 보드의 데이터 가져오기
        const allBoardResponses = await Promise.all(
          boards.map(async (boardType) => {
            try {
              const response = await axios.get(
                `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/board/${keyMode}/${boardType}`,
              )
              return response.data.floors?.flatMap((floor) => floor.patterns) || []
            } catch (error) {
              console.error(`Error fetching ${boardType}:`, error)
              return []
            }
          }),
        )

        // 모든 패턴을 하나의 배열로 합치고 중복 제거
        const allPatterns = Object.values(
          allBoardResponses.flat().reduce((acc, pattern) => {
            const key = `${pattern.title}_${pattern.pattern}`
            if (!acc[key] || acc[key].djpower < pattern.djpower) {
              acc[key] = pattern
            }
            return acc
          }, {}),
        )

        // NEW 30 패턴 필터링 및 정렬
        const newPatterns = allPatterns
          .filter((pattern: any) => pattern.dlcCode === 'VL' || pattern.dlcCode === 'TEK' || pattern.name === 'Insane Drift')
          .sort((a: any, b: any) => b.djpower - a.djpower)

        // BASIC 70 패턴 필터링 및 정렬
        const basicPatterns = allPatterns
          .filter((pattern: any) => pattern.dlcCode !== 'VL' && pattern.dlcCode !== 'TEK' && pattern.name !== 'Insane Drift')
          .sort((a: any, b: any) => b.djpower - a.djpower)

        // TOP 50 정렬 (이건 여전히 rating 기준)
        const top50Patterns = [...allPatterns].sort((a: any, b: any) => b.rating - a.rating).slice(0, 50)

        // 컷오프 점수 설정
        setCutoffScores({
          new30: (newPatterns[29] as any)?.djpower || 0,
          basic70: (basicPatterns[69] as any)?.djpower || 0,
          top50: (top50Patterns[49] as any)?.rating || 0,
        })
      } catch (error) {
        console.error('Error fetching all board data:', error)
      }
    }

    fetchAllBoardData()
  }, [vArchiveUserData.userName, keyMode])

  if (!isMounted) return null

  // 통계 계산 함수 수정
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

      if (pattern.maxCombo === 1) stats.maxCombo++

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

  // 하이라이트 조건 체크 함수도 동일하게 수정
  const shouldHighlight = (pattern: Pattern) => {
    if (!highlightCondition) return true

    const score = typeof pattern.score === 'string' ? parseFloat(pattern.score) : pattern.score
    if (score === null) return false

    // For inverse highlighting (clicking on the empty part of the bar)
    if (highlightInverse) {
      switch (highlightCondition) {
        case 'perfect':
          return score < 100.0
        case 'over999':
          return score < 99.9
        case 'over995':
          return score < 99.5
        case 'over99':
          return score < 99.0
        case 'over97':
          return score < 97.0
        case 'maxCombo':
          return pattern.maxCombo !== 1
        case 'clear':
          return score === 0 || score === null
        default:
          return true
      }
    }

    // For normal highlighting (clicking on the filled part of the bar)
    switch (highlightCondition) {
      case 'perfect':
        return score === 100.0
      case 'over999':
        return score >= 99.9
      case 'over995':
        return score >= 99.5
      case 'over99':
        return score >= 99.0
      case 'over97':
        return score >= 97.0
      case 'maxCombo':
        return pattern.maxCombo === 1
      case 'clear':
        return score > 0
      default:
        return true
    }
  }

  // 정렬 함수 추가
  const sortPatterns = (patterns: Pattern[]) => {
    return [...patterns].sort((a, b) => {
      // 패턴 타입 우선순위 정의
      const patternOrder = { NM: 1, HD: 2, MX: 3, SC: 4 }

      // 먼저 패턴 타입으로 정렬
      if (a.pattern !== b.pattern) {
        return patternOrder[a.pattern] - patternOrder[b.pattern]
      }

      // 패턴이 같은 경우 기존 이름 정렬 로직 적용
      const nameA = a.name.toUpperCase()
      const nameB = b.name.toUpperCase()

      const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
      const isKoreanA = koreanRegex.test(nameA)
      const isKoreanB = koreanRegex.test(nameB)

      if ((isKoreanA && isKoreanB) || (!isKoreanA && !isKoreanB)) {
        return nameA.localeCompare(nameB)
      }

      return isKoreanA ? -1 : 1
    })
  }

  // keyTitle 객체 정의 (없다면 추가)
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
  const { showNotification } = useNotificationSystem()

  useEffect(() => {
    if (vArchiveUserData.userName === '') {
      router.push('/')
      showNotification('성과표 조회 기능은 로그인 또는 V-ARCHIVE 계정 연동이 필요합니다.', 'tw-bg-red-600')
    }
  }, [])

  // 층별 평균 레이팅 계산 함수 수정
  const calculateFloorStats = (patterns: Pattern[], floorNumber: number) => {
    const validPatterns = patterns.filter((p) => p.rating != null && p.rating > 0)
    if (validPatterns.length === 0) return null

    const avgRating = validPatterns.reduce((sum, p) => sum + p.rating, 0) / validPatterns.length
    const floorMaxTP = tierPointMap[floorNumber.toString()]

    if (!floorMaxTP) return null

    return {
      avgRating: avgRating.toFixed(3),
      percentage: ((avgRating / floorMaxTP) * 100).toFixed(1),
    }
  }

  // 층별 평균 점수 계산 함수 추가
  const calculateScoreStats = (patterns: Pattern[]) => {
    const validPatterns = patterns.filter((p) => p.score != null && p.score > 0)
    if (validPatterns.length === 0) return null

    const avgScore = validPatterns.reduce((sum, p) => sum + Number(p.score), 0) / validPatterns.length
    return avgScore.toFixed(2)
  }

  const params = useParams()

  const { selectedGame } = useSelector((state: RootState) => state.app)

  return (
    <React.Fragment>
      <Head>
        <title>
          {keyMode}B {board} 성과표 - R-ARCHIVE
        </title>
      </Head>

      {selectedGame == 'djmax_respect_v' ? (
        <div className="tw-flex tw-gap-4">
          {/* 메인 콘텐츠 영역 (왼쪽) */}
          <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
            {/* 통계 섹션 */}
            {!isLoading ? (
              <div className="tw-flex tw-gap-4">
                <div className="[text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)] tw-relative tw-w-2/3 tw-h-80 tw-rounded-lg tw-overflow-hidden">
                  <Image
                    src={`/images/djmax_respect_v/header_bg${randomHeaderBg}.jpg`}
                    alt="Background"
                    fill
                    className="tw-object-cover tw-blur-md tw-opacity-50 tw-brightness-50"
                  />
                  {keyMode && (
                    <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between">
                      <div className="tw-flex tw-justify-between tw-items-start">
                        <span className="tw-flex tw-w-full tw-items-end tw-gap-1 tw-text-lg tw-font-bold [text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)]">
                          <span className="tw-text-4xl tw-font-bold">{keyMode}</span> <span className="tw-me-auto">Button</span>{' '}
                          <span className="tw-text-2xl tw-font-bold">{String(keyBoardTitle[board as string]).replace('12~15', '12~15(a.k.a MX)')}</span>
                        </span>
                      </div>

                      <div className="tw-space-y-2">
                        {Object.entries(calculateStats(floorData.flatMap((f) => f.patterns))).map(([key, value], _, entries) => {
                          if (key === 'total') return null
                          const totalPatterns = entries.find(([k]) => k === 'total')?.[1] || 0
                          const percentage = (value / totalPatterns) * 100

                          return (
                            <div key={key} className="tw-flex tw-items-center tw-gap-2">
                              <span className="tw-w-32 tw-text-sm">{keyTitle[key] || key.charAt(0).toUpperCase() + key.slice(1)}</span>
                              <div
                                className={`tw-relative tw-flex-1 tw-h-6 tw-rounded-sm tw-overflow-hidden tw-cursor-pointer ${
                                  highlightCondition === key && highlightInverse ? 'tw-bg-gray-800' : 'tw-bg-gray-950'
                                }`}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  const clickX = e.clientX - rect.left
                                  const isLeftSide = clickX < rect.width * (percentage / 100)

                                  // 같은 조건을 다시 클릭했을 때 하이라이트 해제
                                  if (highlightCondition === key && highlightInverse === !isLeftSide) {
                                    setHighlightCondition(null)
                                    setHighlightInverse(false)
                                  } else {
                                    setHighlightCondition(key)
                                    setHighlightInverse(!isLeftSide)
                                  }
                                }}
                              >
                                <div
                                  className={`tw-absolute tw-h-full tw-transition-all tw-duration-300 ${
                                    key === 'maxCombo'
                                      ? `tw-bg-green-500 hover:tw-bg-green-700 ${
                                          highlightCondition === 'maxCombo' && !highlightInverse ? 'tw-brightness-200' : ''
                                        }`
                                      : key === 'perfect'
                                      ? `tw-bg-red-500 hover:tw-bg-red-700 ${highlightCondition === 'perfect' && !highlightInverse ? 'tw-brightness-200' : ''}`
                                      : key === 'clear'
                                      ? `tw-bg-blue-500 hover:tw-bg-blue-700 ${highlightCondition === 'clear' && !highlightInverse ? 'tw-brightness-200' : ''}`
                                      : `tw-bg-yellow-500 hover:tw-bg-yellow-700 ${
                                          String(highlightCondition) === key && !highlightInverse ? 'tw-brightness-200' : ''
                                        }`
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                                <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-end tw-px-2 tw-text-xs tw-font-bold">
                                  {value} / {totalPatterns}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 키모드 & 레벨 선택 패널 */}
                <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-6 tw-w-1/3">
                  <div className="tw-flex tw-items-center tw-justify-between">
                    <span className="tw-text-lg tw-font-bold">🎮 성과표 바로가기</span>
                  </div>

                  {/* 키모드 선택 버튼 */}
                  <div className="tw-flex tw-gap-2">
                    {['4', '5', '6', '8'].map((mode) => (
                      <Link
                        key={`mode_${mode}`}
                        href={`/vArchive/board/${mode}/${board}`}
                        className={`tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-2 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md tw-flex-1 ${
                          mode === keyMode
                            ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                            : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100'
                        }`}
                      >
                        <div className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b${mode}`} />
                        <span className="tw-relative tw-text-base tw-font-bold">{mode}B</span>
                      </Link>
                    ))}
                  </div>

                  {/* 레벨 선택 그리드 */}
                  <div className="tw-grid tw-grid-cols-4 tw-gap-2 tw-flex-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'MX', 'SC', 'SC5', 'SC10', 'SC15'].map((level) => (
                      <Link
                        key={`level_${level}`}
                        href={`/vArchive/board/${keyMode}/${level}`}
                        className={`tw-flex tw-items-center tw-justify-center tw-relative tw-px-3 tw-py-1.5 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md ${
                          level === board
                            ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                            : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100'
                        }`}
                      >
                        <div className={`tw-absolute tw-w-full tw-h-full tw-opacity-30`} />
                        <span className="tw-relative tw-text-sm tw-font-bold">{keyBoardTitle[level]}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {!isLoading && (
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-text-xs tw-p-2 tw-w-full">
                <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-green-700">NEW 30</span>
                <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">{cutoffScores.new30.toFixed(3)} DP</span>
                <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-yellow-500">BASIC 70</span>
                <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">{cutoffScores.basic70.toFixed(3)} DP</span>
                <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-font-extrabold tw-text-red-500">TOP 50</span>
                <span className="tw-p-1 tw-px-4 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-text-white">{cutoffScores.top50.toFixed(3)} TP</span>
              </div>
            )}

            {/* 패턴 목록 */}
            <div
              className={
                'tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-p-4 tw-w-full ' +
                (isLoading ? 'tw-items-center tw-justify-center tw-min-h-[calc(100vh-118px)]' : '')
              }
            >
              {isLoading ? (
                <div className="tw-flex tw-justify-center">
                  <SyncLoader color="#ffffff" size={8} />
                </div>
              ) : (
                floorData.map((floor) => {
                  // 각 floor의 patterns를 정렬
                  const sortedPatterns = sortPatterns(floor.patterns)

                  return (
                    <div
                      key={`floor_${floor.floorNumber}`}
                      className={`tw-flex tw-gap-3 tw-my-3 ${floor !== floorData[floorData.length - 1] ? 'tw-border-b tw-border-gray-700 tw-pb-6' : ''}`}
                    >
                      <span className="tw-font-bold tw-text-base tw-min-w-24 tw-text-right">
                        {floor.floorNumber !== 0 ? (
                          <div className="tw-flex tw-flex-col tw-items-end tw-gap-1">
                            <div>{board == 'SC' ? 'Lv.' + floor.floorNumber : floor.floorNumber}</div>
                            <div className="tw-flex tw-flex-col tw-items-end tw-gap-1">
                              {calculateScoreStats(floor.patterns) && (
                                <div className="tw-flex tw-flex-col tw-items-end">
                                  <span className="tw-text-sm tw-text-gray-400 tw-font-light">점수 평균</span>
                                  <div className="tw-text-sm tw-text-gray-200">{calculateScoreStats(floor.patterns)}%</div>
                                </div>
                              )}
                              {floor.floorNumber !== 0 && calculateFloorStats(floor.patterns, floor.floorNumber) && (
                                <div className="tw-flex tw-flex-col tw-items-end">
                                  <span className="tw-text-sm tw-text-gray-400 tw-font-light">TP 평균</span>
                                  <div className="tw-text-sm tw-text-gray-200">
                                    {calculateFloorStats(floor.patterns, floor.floorNumber).avgRating} / {tierPointMap[floor.floorNumber]}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="tw-flex tw-flex-col tw-items-end tw-gap-1">
                            <div>미분류</div>
                            {calculateScoreStats(floor.patterns) && (
                              <div className="tw-flex tw-flex-col tw-items-end">
                                <span className="tw-text-sm tw-text-gray-400 tw-font-light">점수 평균</span>
                                <div className="tw-text-sm tw-text-gray-200">{calculateScoreStats(floor.patterns)}%</div>
                              </div>
                            )}
                          </div>
                        )}
                      </span>
                      <div className="tw-flex tw-flex-wrap tw-gap-3">
                        {sortedPatterns.map((pattern) => (
                          <div
                            key={`pattern_${pattern.title}_${pattern.pattern}`}
                            className={`tw-transition-opacity tw-duration-300 tw-w-60 tw-max-w-60 tw-flex tw-flex-col tw-bg-gray-700 tw-rounded-md tw-bg-opacity-50 tw-gap-2 tw-p-2 ${
                              highlightCondition ? (shouldHighlight(pattern) ? 'tw-opacity-100' : 'tw-opacity-30') : 'tw-opacity-100'
                            }`}
                          >
                            <div className="tw-flex tw-gap-2">
                              <ScorePopupComponent songItem={pattern} keyMode={keyMode as string} isScored={false} isVisibleCode={true} isFlatten={true} />
                              <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2 tw-items-end tw-justify-center tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-py-2 tw-px-3">
                                {pattern.score ? (
                                  <>
                                    <span className="tw-text-xs tw-text-gray-400">SCORE : {pattern.score ? pattern.score : 0}%</span>
                                    <span className="tw-text-xs tw-text-gray-400">DP : {pattern.djpower ? pattern.djpower : 0}</span>
                                    <span className="tw-text-xs tw-text-gray-400">TP : {pattern.rating ? pattern.rating : 0}</span>
                                  </>
                                ) : (
                                  <span className="tw-text-xs tw-text-gray-400">기록 미존재</span>
                                )}
                              </div>
                            </div>
                            <span className="tw-flex tw-flex-1 tw-bg-gray-950 tw-bg-opacity-50 tw-px-2 tw-py-1 tw-rounded-md tw-break-keep tw-justify-center tw-items-center tw-text-center tw-text-xs">
                              {pattern.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </React.Fragment>
  )
}

export default Board
