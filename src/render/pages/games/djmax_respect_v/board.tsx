import React, { useEffect, useState } from 'react'

import ScorePopupComponent from '@render/components/score/ScorePopup'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { ApiArchiveNicknameBoard } from '@src/types/dto/v-archive/ApiArchiveNicknameBoard'
import { PatternInfo } from '@src/types/games/SongData'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'
import apiClient from '../../../../libs/apiClient'

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

const DmrvBoardPage = () => {
  const { keyMode, board } = useParams()
  const { showNotification } = useNotificationSystem()
  const { userData, songData, selectedGame } = useSelector((state: RootState) => state.app)
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
  const navigate = useNavigate()

  // 현재 레벨에 따른 난이도 그룹 결정 함수
  const getDifficultyByLevel = (level: string) => {
    if (level.startsWith('SC')) return 'SC'
    return 'NORMAL'
  }

  // state 추가
  const [selectedDifficulty, setSelectedDifficulty] = useState<'NORMAL' | 'SC'>(() => {
    return board ? getDifficultyByLevel(board) : 'NORMAL'
  })

  // useEffect로 board 변경 시 난이도 자동 업데이트
  useEffect(() => {
    if (board) {
      setSelectedDifficulty(getDifficultyByLevel(board))
    }
  }, [board])

  // songData에서 현재 keyMode와 board에 해당하는 패턴 데이터 추출
  const processBaseSongData = () => {
    if (!songData || !keyMode) return []

    let processedData = []
    songData[selectedGame].forEach((track) => {
      const { title, name, composer, dlcCode, dlc, patterns } = track
      const patternButton = patterns[keyMode + 'B']

      if (patternButton) {
        // 모든 패턴 타입(NM, HD, MX, SC)에 대해 처리
        Object.entries(patternButton).forEach(([key, pattern]: [string, PatternInfo]) => {
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

  const [boards] = useState<string[]>([
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
    'MX',
    'SC',
    'SC5',
    'SC10',
    'SC15',
  ])

  useEffect(() => {
    setIsMounted(true)

    const fetchBoardData = async () => {
      if (!userData.varchiveUserInfo.isLinked || !keyMode || !board) return

      setIsLoading(true)
      try {
        // 기본 곡 데이터 가져오기
        const baseSongData = processBaseSongData()

        // V-ARCHIVE API에서 점수 데이터 가져오기
        const response = await apiClient.getProxy<ApiArchiveNicknameBoard>(
          `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/board/${keyMode}/${board}`,
        )

        if (isMounted) {
          // API 응답 데이터와 기본 곡 데이터 결합
          const combinedFloors =
            response.data.data.floors?.map((floor) => ({
              floorNumber: floor.floorNumber,
              patterns: floor.patterns
                .map((apiPattern) => {
                  // 먼저 find 메서드를 실행하고 결과를 변수에 저장
                  const matchingPattern = baseSongData.find(
                    (bp) => bp.title === apiPattern.title && bp.pattern === apiPattern.pattern,
                  )

                  // 그 다음 변수를 확인
                  if (!matchingPattern) return null

                  return {
                    ...matchingPattern,
                    ...apiPattern,
                    floor: floor.floorNumber,
                    patterns: matchingPattern.patterns,
                  }
                })
                .filter(Boolean),
            })) || []

          createLog('info', 'combinedFloors', { combinedFloors })

          setFloorData(combinedFloors)
        }
      } catch (error) {
        createLog('error', 'Error in fetchBoardData', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchBoardData()

    return () => {
      setIsMounted(false)
      setFloorData([])
    }
  }, [userData.varchiveUserInfo.nickname, keyMode, board, songData])

  useEffect(() => {
    const fetchAllBoardData = async () => {
      if (!userData.varchiveUserInfo.isLinked || !keyMode) return

      try {
        // 모든 보드의 데이터 가져오기
        const allBoardResponses = await Promise.all(
          boards.map(async (boardType) => {
            try {
              const response = await apiClient.getProxy<ApiArchiveNicknameBoard>(
                `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/board/${keyMode}/${boardType}`,
              )
              return response.data.data.floors?.flatMap((floor) => floor.patterns) || []
            } catch (error) {
              createLog('error', 'Error in fetchAllBoardData', error)
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
          .filter(
            (pattern: Pattern) =>
              pattern.dlcCode === 'VL2' ||
              pattern.dlcCode === 'BA' ||
              pattern.dlcCode === 'PLI1' ||
              pattern.name === 'Kill Trap' ||
              pattern.name === 'Diomedes ~Extended Mix~' ||
              pattern.name === 'Phoenix Virus' ||
              pattern.name === 'alliance',
          )
          .sort((a: Pattern, b: Pattern) => b.djpower - a.djpower)

        // BASIC 70 패턴 필터링 및 정렬
        const basicPatterns = allPatterns
          .filter(
            (pattern: Pattern) =>
              pattern.dlcCode !== 'VL2' &&
              pattern.dlcCode !== 'BA' &&
              pattern.dlcCode !== 'PLI1' &&
              pattern.name !== 'Kill Trap' &&
              pattern.name !== 'Diomedes ~Extended Mix~' &&
              pattern.name !== 'Phoenix Virus' &&
              pattern.name !== 'alliance',
          )
          .sort((a: Pattern, b: Pattern) => b.djpower - a.djpower)

        // TOP 50 정렬 (이건 여전히 rating 기준)
        const top50Patterns = [...allPatterns]
          .sort((a: Pattern, b: Pattern) => b.rating - a.rating)
          .slice(0, 50)

        // 컷오프 점수 설정
        setCutoffScores({
          new30: (newPatterns[29] as Pattern).djpower || 0,
          basic70: (basicPatterns[69] as Pattern).djpower || 0,
          top50: (top50Patterns[49] as Pattern).rating || 0,
        })
      } catch (error) {
        createLog('error', 'Error in fetchAllBoardData', error)
      }
    }

    void fetchAllBoardData()
  }, [userData.varchiveUserInfo.nickname, keyMode])

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

    // 기본 하이라이트 조건 확인
    let matches = false

    if (score === null) {
      // clear 조건일 때만 특별 처리
      if (highlightCondition === 'clear') {
        matches = Boolean(pattern.score)
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
          matches = pattern.maxCombo === 1
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
    MX: 'Lv.12+',
    SC: 'SC',
    SC5: 'SC~5',
    SC10: 'SC~10',
    SC15: 'SC~15',
  }

  useEffect(() => {
    if (!userData.varchiveUserInfo.isLinked) {
      showNotification(
        {
          mode: 'i18n',
          ns: 'board',
          value: 'needLogin',
        },
        'error',
      )
      navigate('/home')
    }
  }, [])

  // 층별 평균 레이팅 계산 함수 수정
  const calculateFloorStats = (patterns: Pattern[], floorNumber: number) => {
    const validPatterns = patterns.filter((p) => p.rating > 0)
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

    const avgScore =
      validPatterns.reduce((sum, p) => sum + Number(p.score), 0) / validPatterns.length
    return avgScore.toFixed(2)
  }

  return (
    <React.Fragment>
      {selectedGame == 'djmax_respect_v' ? (
        <div className='tw:flex tw:gap-4'>
          {/* 메인 콘텐츠 영역 (왼쪽) */}
          <div className='tw:flex tw:flex-col tw:gap-4 tw:w-full'>
            {/* 통계 섹션 */}
            {!isLoading ? (
              <div className='tw:flex tw:gap-4'>
                <div className='tw:relative tw:flex tw:flex-col tw:gap-4 tw:w-2/3 tw:min-h-[20rem] tw:border tw:border-slate-200 tw:dark:border-slate-700 tw:h-full tw:rounded-lg tw:overflow-hidden [text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)]'>
                  {keyMode && (
                    <div className='tw:p-4 tw:flex tw:flex-col tw:gap-4 tw:justify-between'>
                      <div className='tw:flex tw:justify-between tw:items-start'>
                        <span className='tw:flex tw:w-full tw:items-end tw:gap-1 tw:text-lg tw:font-bold [text-shadow:_2px_2px_2px_rgb(0_0_0_/_90%),_4px_4px_4px_rgb(0_0_0_/_60%)]'>
                          <span className='tw:text-4xl tw:font-bold'>{keyMode}</span>{' '}
                          <span className='tw:me-auto'>Button</span>{' '}
                          <span className='tw:text-2xl tw:font-bold'>
                            {board && String(keyBoardTitle[board])}
                          </span>
                        </span>
                      </div>

                      <div className='tw:space-y-2 tw:flex-1'>
                        {Object.entries(calculateStats(floorData.flatMap((f) => f.patterns))).map(
                          ([key, value], _, entries) => {
                            if (key === 'total') return null
                            const totalPatterns = entries.find(([k]) => k === 'total')?.[1] ?? 0
                            const percentage = (value / totalPatterns) * 100

                            return (
                              <div key={key} className='tw:flex tw:items-center tw:gap-2'>
                                <span className='tw:w-32 tw:text-sm'>
                                  {keyTitle[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                                </span>
                                <div
                                  className={`tw:relative tw:flex-1 tw:h-6 tw:rounded-sm tw:overflow-hidden tw:cursor-pointer ${
                                    highlightCondition === key && highlightInverse
                                      ? 'tw:bg-slate-200 tw:dark:bg-slate-600'
                                      : 'tw:bg-slate-300 tw:dark:bg-slate-700'
                                  }`}
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const clickX = e.clientX - rect.left
                                    const isLeftSide = clickX < rect.width * (percentage / 100)

                                    // 같은 조건을 다시 클릭했을 때 하이라이트 해제
                                    if (
                                      highlightCondition === key &&
                                      highlightInverse === !isLeftSide
                                    ) {
                                      setHighlightCondition(null)
                                      setHighlightInverse(false)
                                    } else {
                                      setHighlightCondition(key)
                                      setHighlightInverse(!isLeftSide)
                                    }
                                  }}
                                >
                                  <div
                                    className={`tw:absolute tw:h-full tw:transition-all tw:duration-300 ${
                                      key === 'maxCombo'
                                        ? `tw:bg-green-500 hover:tw:bg-green-700 ${
                                            highlightCondition === 'maxCombo' && !highlightInverse
                                              ? 'tw:brightness-200'
                                              : ''
                                          }`
                                        : key === 'perfect'
                                          ? `tw:bg-red-500 hover:tw:bg-red-700 ${highlightCondition === 'perfect' && !highlightInverse ? 'tw:brightness-200' : ''}`
                                          : key === 'clear'
                                            ? `tw:bg-blue-500 hover:tw:bg-blue-700 ${highlightCondition === 'clear' && !highlightInverse ? 'tw:brightness-200' : ''}`
                                            : `tw:bg-yellow-500 hover:tw:bg-yellow-700 ${
                                                String(highlightCondition) === key &&
                                                !highlightInverse
                                                  ? 'tw:brightness-200'
                                                  : ''
                                              }`
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                  <div className='tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-end tw:px-2 tw:text-xs tw:font-bold tw:text-slate-700 tw:dark:text-white'>
                                    {value} / {totalPatterns}
                                  </div>
                                </div>
                              </div>
                            )
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 키모드 & 레벨 선택 패널 */}
                <div className='tw:flex tw:flex-col tw:gap-4 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-6 tw:w-1/3 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                  {/* 키모드 설명 */}
                  <div className='tw:text-sm tw:text-slate-600 tw:dark:text-slate-400 tw:font-medium'>
                    키(버튼)
                  </div>
                  {/* 키모드 선택 버튼 */}
                  <div className='tw:flex tw:gap-2'>
                    {['4', '5', '6', '8'].map((mode) => (
                      <Link
                        key={`mode_${mode}`}
                        to={`/games/djmax_respect_v/board/${mode}/${board}`}
                        className={`tw:flex tw:items-center tw:justify-center tw:relative tw:px-4 tw:py-1 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-md tw:flex-1 ${
                          mode === keyMode
                            ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
                            : 'tw:border-slate-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100'
                        }`}
                      >
                        <div
                          className={`tw:absolute tw:w-full tw:h-full tw:opacity-30 respect_bg_b${mode}`}
                        />
                        <span className='tw:relative tw:text-base tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                          {mode}B
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* 레벨 선택 그리드 */}
                  <div className='tw:flex tw:flex-col tw:gap-2'>
                    {/* 난이도 범위 설명 */}
                    <div className='tw:text-sm tw:text-slate-600 tw:dark:text-slate-400 tw:font-medium'>
                      성과표
                    </div>
                    {/* 난이도 선택 탭 */}
                    <div className='tw:flex tw:gap-2 tw:mb-1'>
                      {['NORMAL', 'SC'].map((group) => (
                        <button
                          key={group}
                          onClick={() => {
                            setSelectedDifficulty(group as 'NORMAL' | 'SC')
                          }}
                          className={`tw:flex-1 tw:px-4 tw:py-1.5 tw:rounded-md tw:text-sm tw:font-medium tw:transition-all ${
                            selectedDifficulty === group
                              ? 'tw:bg-indigo-600/20 tw:text-indigo-700 tw:dark:text-indigo-200 tw:border tw:border-indigo-500'
                              : 'tw:bg-slate-100/50 tw:dark:bg-slate-700/30 hover:tw:bg-slate-200/50 hover:tw:dark:bg-slate-700/50 tw:text-slate-600 tw:dark:text-slate-400'
                          }`}
                        >
                          {group === 'NORMAL' ? 'NORMAL' : 'SC'}
                        </button>
                      ))}
                    </div>

                    {/* 레벨 선택 설명 */}
                    {/* <div className="tw:text-sm tw:text-slate-400 tw:font-medium">레벨 선택</div> */}
                    {/* 선택된 난이도의 레벨 그리드 */}
                    <div className='tw:grid tw:grid-cols-5 tw:gap-1'>
                      {boards
                        .filter((level) => {
                          if (selectedDifficulty === 'NORMAL') return !level.startsWith('SC')
                          return level.startsWith('SC')
                        })
                        .map((level) => (
                          <Link
                            key={`level_${level}`}
                            to={`/games/djmax_respect_v/board/${keyMode}/${level}`}
                            className={`tw:flex tw:items-center tw:justify-center tw:relative tw:h-8 tw:transition-all tw:duration-300 tw:rounded-md ${
                              level === board
                                ? 'tw:bg-indigo-600/20 tw:text-indigo-700 tw:dark:text-indigo-200 tw:border tw:border-indigo-500'
                                : 'tw:bg-slate-100/50 tw:dark:bg-slate-700/30 hover:tw:bg-slate-200/50 hover:tw:dark:bg-slate-700/50 tw:text-slate-600 tw:dark:text-slate-400'
                            } tw:text-sm tw:font-medium`}
                          >
                            {keyBoardTitle[level]}
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 컷오프 점수 표시 */}
            {!isLoading && (
              <div className='tw:flex tw:items-center tw:justify-center tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-md tw:text-xs tw:p-2 tw:w-full tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                <span className='tw:p-1 tw:px-4 tw:bg-slate-100 tw:dark:bg-slate-700 tw:bg-opacity-50 tw:dark:bg-opacity-50 tw:rounded-md tw:font-extrabold tw:text-green-500 tw:dark:text-green-400'>
                  NEW 30
                </span>
                <span className='tw:p-1 tw:px-4 tw:bg-slate-100 tw:dark:bg-slate-700 tw:bg-opacity-50 tw:dark:bg-opacity-50 tw:rounded-md tw:text-slate-900 tw:dark:text-white'>
                  {cutoffScores.new30.toFixed(3)} DP
                </span>
                <span className='tw:p-1 tw:px-4 tw:bg-slate-100 tw:dark:bg-slate-700 tw:bg-opacity-50 tw:dark:bg-opacity-50 tw:rounded-md tw:font-extrabold tw:text-yellow-500 tw:dark:text-yellow-400'>
                  BASIC 70
                </span>
                <span className='tw:p-1 tw:px-4 tw:bg-slate-100 tw:dark:bg-slate-700 tw:bg-opacity-50 tw:dark:bg-opacity-50 tw:rounded-md tw:text-slate-900 tw:dark:text-white'>
                  {cutoffScores.basic70.toFixed(3)} DP
                </span>
                <span className='tw:p-1 tw:px-4 tw:bg-slate-100 tw:dark:bg-slate-700 tw:bg-opacity-50 tw:dark:bg-opacity-50 tw:rounded-md tw:font-extrabold tw:text-red-500 tw:dark:text-red-400'>
                  TOP 50
                </span>
                <span className='tw:p-1 tw:px-4 tw:bg-slate-100 tw:dark:bg-slate-700 tw:bg-opacity-50 tw:dark:bg-opacity-50 tw:rounded-md tw:text-slate-900 tw:dark:text-white'>
                  {cutoffScores.top50.toFixed(3)} TP
                </span>
              </div>
            )}

            {/* 패턴 목록 */}
            <div
              className={
                'tw:flex tw:flex-col tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-md tw:p-4 tw:w-full tw:border tw:border-slate-200 tw:dark:border-slate-700 ' +
                (isLoading ? 'tw:items-center tw:justify-center tw:min-h-[calc(100vh-118px)]' : '')
              }
            >
              {isLoading ? (
                <div className='tw:flex tw:justify-center'>
                  <PuffLoader color='#6366f1' size={32} />
                </div>
              ) : (
                floorData.map((floor) => {
                  // 각 floor의 patterns를 정렬
                  const sortedPatterns = sortPatterns(floor.patterns)

                  return (
                    <div
                      key={`floor_${floor.floorNumber}`}
                      className={`tw:flex tw:gap-3 tw:my-3 ${floor !== floorData[floorData.length - 1] ? 'tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:pb-6' : ''}`}
                    >
                      <span className='tw:font-bold tw:text-base tw:min-w-24 tw:text-right tw:text-slate-700 tw:dark:text-slate-300'>
                        {floor.floorNumber !== 0 ? (
                          <div className='tw:flex tw:flex-col tw:items-end tw:gap-1'>
                            <div>
                              {board == 'SC' ? 'Lv.' + floor.floorNumber : floor.floorNumber}
                            </div>
                            <div className='tw:flex tw:flex-col tw:items-end tw:gap-1'>
                              {calculateScoreStats(floor.patterns) && (
                                <div className='tw:flex tw:flex-col tw:items-end'>
                                  <span className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400 tw:font-light'>
                                    점수 평균
                                  </span>
                                  <div className='tw:text-sm tw:text-slate-700 tw:dark:text-slate-200'>
                                    {calculateScoreStats(floor.patterns)}%
                                  </div>
                                </div>
                              )}
                              {floor.floorNumber !== 0 &&
                                calculateFloorStats(floor.patterns, floor.floorNumber) && (
                                  <div className='tw:flex tw:flex-col tw:items-end'>
                                    <span className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400 tw:font-light'>
                                      TP 평균
                                    </span>
                                    <div className='tw:text-sm tw:text-slate-700 tw:dark:text-slate-200'>
                                      {
                                        calculateFloorStats(floor.patterns, floor.floorNumber)
                                          .avgRating
                                      }{' '}
                                      / {tierPointMap[floor.floorNumber]}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        ) : (
                          <div className='tw:flex tw:flex-col tw:items-end tw:gap-1'>
                            <div>미분류</div>
                            {calculateScoreStats(floor.patterns) && (
                              <div className='tw:flex tw:flex-col tw:items-end'>
                                <span className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400 tw:font-light'>
                                  점수 평균
                                </span>
                                <div className='tw:text-sm tw:text-slate-700 tw:dark:text-slate-200'>
                                  {calculateScoreStats(floor.patterns)}%
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </span>
                      <div className='tw:flex tw:flex-wrap tw:gap-3'>
                        {sortedPatterns.map((pattern) => (
                          <div
                            key={`pattern_${pattern.title}_${pattern.pattern}`}
                            className={`tw:transition-opacity tw:duration-300 tw:w-60 tw:max-w-60 tw:flex tw:flex-col tw:bg-slate-100 tw:dark:bg-slate-700/50 tw:rounded-md tw:bg-opacity-50 tw:gap-2 tw:p-2 ${
                              highlightCondition
                                ? shouldHighlight(pattern)
                                  ? 'tw:opacity-100'
                                  : 'tw:opacity-30'
                                : 'tw:opacity-100'
                            }`}
                          >
                            <div className='tw:flex tw:gap-2'>
                              <ScorePopupComponent
                                songTitle={pattern.title}
                                keyMode={keyMode ?? '4'}
                                isVisibleCode={true}
                              />
                              <div className='tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:items-end tw:justify-center tw:bg-slate-200 tw:dark:bg-slate-700 tw:bg-opacity-25 tw:rounded-md tw:py-2 tw:px-3'>
                                {pattern.score ? (
                                  <>
                                    <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                      SCORE : {pattern.score ? pattern.score : 0}%
                                    </span>
                                    <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                      DP : {pattern.djpower ? pattern.djpower : 0}
                                    </span>
                                    <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                      TP : {pattern.rating ? pattern.rating : 0}
                                    </span>
                                  </>
                                ) : (
                                  <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                    기록 미존재
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className='tw:flex tw:flex-1 tw:bg-slate-200 tw:dark:bg-slate-700 tw:bg-opacity-25 tw:px-2 tw:py-1 tw:rounded-md tw:break-keep tw:justify-center tw:items-center tw:text-center tw:text-xs tw:text-slate-700 tw:dark:text-slate-300'>
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

export default DmrvBoardPage
