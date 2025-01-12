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
import RaScorePopupComponent from '@/components/score/RaScorePopupComponent'

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

const Board = () => {
  const router = useRouter()
  const { keyMode, board } = router.query
  const { userData, wjmaxSongData } = useSelector((state: RootState) => state.app)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [floorData, setFloorData] = useState<Floor[]>([])
  const [isMounted, setIsMounted] = useState<boolean>(true)
  const [highlightCondition, setHighlightCondition] = useState<string | null>(null)
  const [highlightInverse, setHighlightInverse] = useState<boolean>(false)

  // 현재 레벨에 따른 난이도 결정 함수
  const getDifficultyByLevel = (level: string) => {
    const levelNum = Number(level)
    if (levelNum <= 10) return '1~10'
    if (levelNum <= 20) return '11~20'
    return '21~30'
  }

  // state 초기값 설정
  const [selectedDifficulty, setSelectedDifficulty] = useState<'1~10' | '11~20' | '21~30'>(() => {
    return getDifficultyByLevel(board as string)
  })

  // useEffect로 board 변경 시 난이도 자동 업데이트
  useEffect(() => {
    if (board) {
      setSelectedDifficulty(getDifficultyByLevel(board as string))
    }
  }, [board])

  // songData에서 현재 keyMode와 board에 해당하는 패턴 데이터 추출
  const processBaseSongData = () => {
    if (!wjmaxSongData || !keyMode) return []

    let processedData = []
    wjmaxSongData.forEach((track) => {
      const { title, name, composer, dlcCode, dlc, patterns } = track
      const patternButton = patterns[String(String(keyMode).replace('_PLUS', ''))]

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
      if (!userData.userName || !keyMode || !board) return

      setIsLoading(true)
      try {
        // 기본 곡 데이터 가져오기
        const baseSongData = processBaseSongData()

        // V-ARCHIVE API에서 점수 데이터 가져오기
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/board/wjmax/${keyMode}/${board}/user/${userData.userNo}`, {
          headers: { Authorization: `${userData.userNo}|${userData.userToken}` },
          withCredentials: true,
        })

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
  }, [userData.userName, keyMode, board, wjmaxSongData])

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

  // 하이라이트 조건 체크 함수도 동일하게 수정
  const shouldHighlight = (pattern: Pattern) => {
    if (!highlightCondition) return true

    const score = typeof pattern.score === 'string' ? parseFloat(pattern.score) : pattern.score

    // 기본 하이라이트 조건 확인
    let matches = false

    if (score === null) {
      // clear 조건일 때만 특별 처리
      if (highlightCondition === 'clear') {
        matches = false
      }
    } else {
      switch (highlightCondition) {
        case 'perfect':
          matches = score === 100.0
          break
        case 'over999':
          matches = score >= 99.9
          break
        case 'over995':
          matches = score >= 99.5
          break
        case 'over99':
          matches = score >= 99.0
          break
        case 'over97':
          matches = score >= 97.0
          break
        case 'maxCombo':
          matches = pattern?.maxCombo === 1
          break
        case 'clear':
          matches = score > 0
          break
        default:
          matches = true
      }
    }

    // highlightInverse가 true이면 조건을 반전
    return highlightInverse ? !matches : matches
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
    12: 'Lv.12',
    13: 'Lv.13',
    14: 'Lv.14',
    15: 'Lv.15',
    16: 'Lv.16',
    17: 'Lv.17',
    18: 'Lv.18',
    19: 'Lv.19',
    20: 'Lv.20',
    21: 'Lv.21',
    22: 'Lv.22',
    23: 'Lv.23',
    24: 'Lv.24',
    25: 'Lv.25',
    26: 'Lv.26',
    27: 'Lv.27',
    28: 'Lv.28',
    29: 'Lv.29',
    30: 'Lv.30',
  }

  const [randomHeaderBg, setRandomHeaderBg] = useState(Math.floor(Math.random() * wjmaxSongData.length) + 1)
  const { showNotification } = useNotificationSystem()

  useEffect(() => {
    if (userData.userName === '') {
      router.push('/')
      showNotification('성과표 조회 기능은 로그인 또는 V-ARCHIVE 계정 연동이 필요합니다.', 'tw-bg-red-600')
    }
  }, [])

  // 층별 평균 점수 계산 함수 추가
  const calculateScoreStats = (patterns: Pattern[]) => {
    const validPatterns = patterns.filter((p) => p.score != null && p.score > 0)
    if (validPatterns.length === 0) return null

    const avgScore = validPatterns.reduce((sum, p) => sum + Number(p.score), 0) / validPatterns.length
    return avgScore.toFixed(2)
  }

  // 레벨 그룹 정의
  const levelGroups = [
    { name: '1~10', levels: Array.from({ length: 10 }, (_, i) => String(i + 1)) },
    { name: '11~20', levels: Array.from({ length: 10 }, (_, i) => String(i + 11)) },
    { name: '21~30', levels: Array.from({ length: 10 }, (_, i) => String(i + 21)) },
  ]

  return (
    <React.Fragment>
      <Head>
        <title>
          {String(keyMode).replace('PLUS', '').replace('P', '').replace('B', '').replace('_', '')}B{String(keyMode).includes('P') ? '+' : ''} {board} 성과표 -
          R-ARCHIVE
        </title>
      </Head>

      <div className="tw-flex tw-gap-4">
        {/* 메인 콘텐츠 영역 (왼쪽) */}
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          {/* 통계 섹션 */}
          {!isLoading ? (
            <div className="tw-flex tw-gap-4">
              <div className="[text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)] tw-relative tw-w-2/3 tw-h-[20rem] tw-rounded-lg tw-overflow-hidden">
                <Image
                  src={`/images/wjmax/jackets/${wjmaxSongData[randomHeaderBg - 1].folderName}.jpg`}
                  alt="Background"
                  fill
                  className="tw-object-cover tw-blur-md tw-opacity-50 tw-brightness-50"
                />
                {keyMode && (
                  <div className="tw-absolute tw-inset-0 tw-p-4 tw-flex tw-flex-col tw-justify-between">
                    <div className="tw-flex tw-justify-between tw-items-start">
                      <span className="tw-flex tw-w-full tw-items-end tw-gap-1 tw-text-lg tw-font-bold [text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)]">
                        <span className="tw-text-4xl tw-font-bold tw-relative">{String(keyMode).replace('B', '').replace('_PLUS', '')}</span>{' '}
                        <span className="tw-me-auto tw-flex tw-relative">
                          Button <span className="tw-absolute tw-2xl tw-top-[-12px] tw-right-[-12px]">{String(keyMode).includes('B_PLUS') ? '+' : ''}</span>
                        </span>{' '}
                        <span className="tw-text-2xl tw-font-bold">{String(keyBoardTitle[board as string])}</span>
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
                  <span className="tw-text-lg tw-font-bold">🎮 성과표 필터</span>
                </div>

                {/* 키모드 설명 */}
                <div className="tw-text-sm tw-text-gray-400 tw-font-medium">키(버튼) 선택</div>
                {/* 키모드 선택 버튼 */}
                <div className="tw-flex tw-gap-2">
                  {['4B', '4B_PLUS', '6B', '6B_PLUS'].map((mode) => (
                    <Link
                      key={`mode_${mode}`}
                      href={`/projectRa/wjmax/board/${mode}/${board}`}
                      className={`tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-1 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md tw-flex-1 ${
                        mode === keyMode
                          ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                          : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100'
                      }`}
                    >
                      <div className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 wjmax_bg_b${mode.replace('B', '').replace('_PLUS', '')}`} />
                      <span className="tw-relative tw-text-base tw-font-bold">{mode.replace('_PLUS', '+')}</span>
                    </Link>
                  ))}
                </div>

                {/* 레벨 선택 그리드 */}
                <div className="tw-flex tw-flex-col tw-gap-2">
                  {/* 난이도 범위 설명 */}
                  <div className="tw-text-sm tw-text-gray-400 tw-font-medium">레벨</div>
                  {/* 난이도 선택 탭 */}
                  <div className="tw-flex tw-gap-2 tw-mb-1">
                    {levelGroups.map((group) => (
                      <button
                        key={group.name}
                        onClick={() => setSelectedDifficulty(group.name as '1~10' | '11~20' | '21~30')}
                        className={`tw-flex-1 tw-px-4 tw-py-1.5 tw-rounded-md tw-text-sm tw-font-medium tw-transition-all
                          ${
                            selectedDifficulty === group.name
                              ? 'tw-bg-blue-900/50 tw-text-blue-200 tw-border tw-border-blue-500'
                              : 'tw-bg-gray-800/30 hover:tw-bg-gray-700/50 tw-text-gray-400'
                          }`}
                      >
                        Lv.{group.name}
                      </button>
                    ))}
                  </div>
                  {/* 선택된 난이도의 레벨 그리드 */}
                  {levelGroups.map((group) => (
                    <div
                      key={group.name}
                      className={`tw-grid tw-grid-cols-5 tw-gap-1 tw-transition-all tw-duration-300
                        ${selectedDifficulty === group.name ? 'tw-block' : 'tw-hidden'}`}
                    >
                      {group.levels.map((level) => (
                        <Link
                          key={`level_${level}`}
                          href={`/projectRa/wjmax/board/${keyMode}/${level}`}
                          className={`tw-flex tw-items-center tw-justify-center tw-relative tw-h-8 
                            tw-transition-all tw-duration-300 tw-rounded-md 
                            ${
                              level === board
                                ? 'tw-bg-blue-900/50 tw-text-blue-200 tw-border tw-border-blue-500'
                                : 'tw-bg-gray-800/30 hover:tw-bg-gray-700/50 tw-text-gray-400'
                            } tw-text-sm tw-font-medium`}
                        >
                          Lv.{level}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

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
                          <div>{Number(floor.floorNumber).toFixed(1)}</div>
                          <div className="tw-flex tw-flex-col tw-items-end tw-gap-1">
                            {calculateScoreStats(floor.patterns) && (
                              <div className="tw-flex tw-flex-col tw-items-end">
                                <span className="tw-text-sm tw-text-gray-400 tw-font-light">점수 평균</span>
                                <div className="tw-text-sm tw-text-gray-200">{calculateScoreStats(floor.patterns)}%</div>
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
                          className={`tw-transition-opacity tw-duration-300 tw-w-72 tw-max-w-72 tw-flex tw-flex-col tw-bg-gray-700 tw-rounded-md tw-bg-opacity-50 tw-gap-2 tw-p-2 ${
                            highlightCondition ? (shouldHighlight(pattern) ? 'tw-opacity-100' : 'tw-opacity-30') : 'tw-opacity-100'
                          }`}
                        >
                          <div className="tw-flex tw-gap-2">
                            <RaScorePopupComponent
                              songItem={pattern}
                              keyMode={String(keyMode).replace('B', '').replace('_PLUS', '')}
                              judgementType={String(keyMode).includes('_PLUS') ? 'HARD' : 'NORMAL'}
                              isScored={false}
                              isVisibleCode={true}
                              isFlatten={true}
                            />
                            <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2 tw-items-end tw-justify-center tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-md tw-py-2 tw-px-3">
                              {pattern.score ? (
                                <>
                                  <span className="tw-text-xs tw-text-gray-400">SCORE : {pattern.score ? pattern.score : 0}%</span>
                                  {pattern?.maxCombo && <span className="tw-text-xs tw-text-yellow-400">MAX COMBO</span>}
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
    </React.Fragment>
  )
}

export default Board
