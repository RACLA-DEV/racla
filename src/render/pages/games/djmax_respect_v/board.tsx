import React, { useEffect, useState } from 'react'

import ScorePopupComponent from '@render/components/score/ScorePopup'
import { globalDictionary } from '@render/constants/globalDictionary'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { ApiArchiveNicknameBoard } from '@src/types/dto/v-archive/ApiArchiveNicknameBoard'
import { Floor } from '@src/types/games/Floor'
import { BoardPatternInfo, PatternInfo, SongData } from '@src/types/games/SongData'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'
import apiClient from '../../../../libs/apiClient'

const DmrvBoardPage = () => {
  const { t } = useTranslation(['board'])
  const { keyMode, board } = useParams()
  const { showNotification } = useNotificationSystem()
  const { language } = useSelector((state: RootState) => state.app.settingData)
  const { userData, songData, selectedGame } = useSelector((state: RootState) => state.app)
  const gameOcrStates = useSelector((state: RootState) => state.app.gameOcrStates)
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
    if (level?.startsWith('SC')) return 'SC'
    if (level?.startsWith('DIFF_')) return 'DIFF'
    return 'NORMAL'
  }

  // DIFF 모드에서 패턴 타입 추출 함수 추가
  const getPatternTypeFromDiff = (diffValue: string): 'NM' | 'HD' | 'MX' | 'SC' => {
    if (diffValue?.startsWith('DIFF_')) {
      const patternType = diffValue.split('_')[1]
      if (['NM', 'HD', 'MX', 'SC'].includes(patternType)) {
        return patternType as 'NM' | 'HD' | 'MX' | 'SC'
      }
    }
    return 'NM'
  }

  // state 추가
  const [selectedDifficulty, setSelectedDifficulty] = useState<'NORMAL' | 'SC' | 'DIFF'>(() => {
    return board ? getDifficultyByLevel(board) : 'NORMAL'
  })

  // 선택된 패턴 타입 상태 추가
  const [selectedPatternType, setSelectedPatternType] = useState<'NM' | 'HD' | 'MX' | 'SC'>(() => {
    return board?.startsWith('DIFF_') ? getPatternTypeFromDiff(board) : 'NM'
  })

  // DIFF 모드일 때 사용할 전체 보드 데이터를 저장할 상태 추가
  const [allBoardData, setAllBoardData] = useState<BoardPatternInfo[]>([])

  // 자주 사용하는 레벨 목록 상태 추가
  const [uniqueLevels, setUniqueLevels] = useState<number[]>([])

  // useEffect로 board 변경 시 난이도 자동 업데이트
  useEffect(() => {
    if (board) {
      const difficulty = getDifficultyByLevel(board)
      setSelectedDifficulty(difficulty)

      // DIFF 모드인 경우 패턴 타입도 설정
      if (difficulty === 'DIFF') {
        setSelectedPatternType(getPatternTypeFromDiff(board))
      }
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
    'DIFF_NM',
    'DIFF_HD',
    'DIFF_MX',
    'DIFF_SC',
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
                  // for 루프로 baseSongData를 순회하여 매칭되는 패턴 찾기
                  let matchingPattern = null
                  for (const bp of baseSongData) {
                    if (bp.title === apiPattern.title && bp.pattern === apiPattern.pattern) {
                      matchingPattern = bp
                      break
                    }
                  }

                  return {
                    ...matchingPattern,
                    ...apiPattern,
                    floor: floor.floorNumber,
                    patterns: matchingPattern.patterns,
                  }
                })
                .filter(Boolean),
            })) || []

          createLog('debug', 'combinedFloors', { combinedFloors })

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

    const fetchAllBoardsForDiff = async () => {
      if (!userData.varchiveUserInfo.isLinked || !keyMode) return

      setIsLoading(true)
      try {
        // 기본 곡 데이터 가져오기
        const baseSongData = processBaseSongData()

        // 모든 보드의 데이터 가져오기
        const allBoardResponses = await Promise.all(
          boards.map(async (boardType) => {
            try {
              const response = await apiClient.getProxy<ApiArchiveNicknameBoard>(
                `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/board/${keyMode}/${boardType}`,
              )
              return (
                response.data.data.floors?.flatMap((floor) =>
                  floor.patterns.map((pattern) => ({
                    ...pattern,
                    floor: floor.floorNumber,
                  })),
                ) || []
              )
            } catch (error) {
              createLog('error', 'Error in fetchAllBoardsForDiff', error)
              return []
            }
          }),
        )

        if (isMounted) {
          // 모든 패턴을 하나의 배열로 합치고 중복 제거
          const allPatterns = Object.values(
            allBoardResponses
              .flat()
              .reduce<Record<string, BoardPatternInfo>>((acc, apiPattern: any) => {
                const key = `${apiPattern.title}_${apiPattern.pattern}`
                const basePattern = baseSongData.find(
                  (bp) => bp.title === apiPattern.title && bp.pattern === apiPattern.pattern,
                )

                if (
                  !acc[key] ||
                  (apiPattern.djpower && apiPattern.djpower > (acc[key].djpower || 0))
                ) {
                  // 기본 객체 구조 생성
                  const mergedPattern = {
                    ...basePattern,
                    ...apiPattern,
                    patterns: basePattern?.patterns || {},
                  }
                  acc[key] = mergedPattern as BoardPatternInfo
                }
                return acc
              }, {}),
          )

          // 전체 데이터 저장
          setAllBoardData(allPatterns as BoardPatternInfo[])

          // 유니크한 레벨 목록 추출 (level 값이 있는 경우)
          const levels = allPatterns
            .filter(
              (pattern: BoardPatternInfo) =>
                pattern.pattern === selectedPatternType && pattern.level != null,
            )
            .map((pattern: BoardPatternInfo) => {
              // 레벨을 숫자로 변환 (SC 접두사 제거하고 숫자만 추출)
              const levelStr = String(pattern.level)
              const numericLevel = parseInt(levelStr.replace(/\D/g, ''))
              return numericLevel
            })
            .filter((level, index, self) => self.indexOf(level) === index && !isNaN(level))
            .sort((a, b) => b - a) // 내림차순 정렬

          setUniqueLevels(levels)

          // 패턴 타입 및 레벨별로 Floor 구성
          const filteredPatterns = allPatterns.filter(
            (pattern: BoardPatternInfo) => pattern.pattern === selectedPatternType,
          )

          // 레벨별로 그룹화
          const patternsByLevel = filteredPatterns.reduce<Record<number, BoardPatternInfo[]>>(
            (groups, pattern) => {
              const levelStr = String(pattern.level || '0')
              const numericLevel = parseInt(levelStr.replace(/\D/g, '')) || 0

              if (!groups[numericLevel]) {
                groups[numericLevel] = []
              }
              groups[numericLevel].push(pattern)

              return groups
            },
            {},
          )

          // 레벨별 floors 생성 (레벨 내림차순)
          const patternTypeFloors = Object.entries(patternsByLevel)
            .sort(([levelA], [levelB]) => parseInt(levelB) - parseInt(levelA))
            .map(([level, patterns]) => ({
              floorNumber: parseInt(level),
              patterns: patterns,
            }))

          setFloorData(patternTypeFloors as Floor[])
        }
      } catch (error) {
        createLog('error', 'Error in fetchAllBoardsForDiff', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // DIFF 모드일 때는 전체 보드 데이터를 가져옴
    if (selectedDifficulty === 'DIFF') {
      void fetchAllBoardsForDiff()
    } else {
      void fetchBoardData()
    }

    return () => {
      setIsMounted(false)
      setFloorData([])
    }
  }, [userData.varchiveUserInfo.nickname, keyMode, board, selectedDifficulty, selectedPatternType])

  // OCR 결과 감지 및 처리
  useEffect(() => {
    // 마운트되지 않았거나 게임코드가 일치하지 않으면 처리하지 않음
    if (!isMounted || selectedGame !== 'djmax_respect_v' || isLoading) return

    // 게임 OCR 상태 가져오기
    const ocrState = gameOcrStates.djmax_respect_v

    // OCR 결과가 없으면 처리하지 않음
    if (!ocrState?.results?.length) return

    // 가장 최근 OCR 결과 가져오기 (배열의 첫 번째 항목)
    const latestResult = ocrState.results[0]

    // OCR 결과가 현재 보드와 관련있는지 확인
    if (
      latestResult &&
      latestResult.gameCode === 'djmax_respect_v' &&
      String(latestResult.button) === keyMode
    ) {
      createLog('debug', 'OCR Result detected for DJMAX Respect V Board', latestResult)

      // V-ARCHIVE API에서 곡의 상세 정보 가져오기
      const fetchSongDetail = async () => {
        try {
          if (!userData.varchiveUserInfo.isLinked) {
            createLog('debug', 'User not linked to V-ARCHIVE, skipping song detail fetch')
            return null
          }

          const response = await apiClient.getProxy<SongData>(
            `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/title/${latestResult.songData.title}`,
          )

          if (response.status === 200 && response.data.data) {
            createLog('debug', 'Song detail fetched successfully', response.data.data)
            return response.data.data
          }
          return null
        } catch (error) {
          createLog('error', 'Error fetching song detail', error)
          return null
        }
      }

      const updateSongData = async () => {
        // V-ARCHIVE에서 상세 정보 가져오기
        const songDetail = await fetchSongDetail()

        // floorData를 순회하면서 일치하는 패턴 찾기
        const updatedFloorData = floorData.map((floor) => {
          const updatedPatterns = floor.patterns.map((pattern) => {
            // 제목과 패턴 타입이 일치하는지 확인
            if (
              pattern.title === latestResult.songData.title &&
              pattern.pattern === latestResult.pattern
            ) {
              createLog('debug', 'Found matching pattern in board view - updating', {
                title: pattern.title,
                pattern: pattern.pattern,
                oldScore: pattern.score,
                newScore: latestResult.score,
              })

              // 상세 정보가 있으면 djpower와 rating 정보 업데이트
              let djpower = pattern.djpower
              let rating = pattern.rating

              if (songDetail) {
                // songDetail에서 해당 패턴의 djpower와 rating 정보 찾기
                const patternKey = keyMode + 'B'
                if (
                  songDetail.patterns &&
                  songDetail.patterns[patternKey] &&
                  songDetail.patterns[patternKey][pattern.pattern]
                ) {
                  djpower = songDetail.patterns[patternKey][pattern.pattern].djpower
                  rating = songDetail.patterns[patternKey][pattern.pattern].rating

                  createLog('debug', 'Updated pattern info from V-ARCHIVE', {
                    djpower,
                    rating,
                  })
                }
              }

              // 새로운 점수와 맥스콤보 정보로 업데이트
              // maxCombo는 boolean에서 number로 변환 필요 (1은 MAX, 0은 MAX 아님)
              return {
                ...pattern,
                score: latestResult.score,
                maxCombo: latestResult.maxCombo ? 1 : 0,
                djpower,
                rating,
              }
            }
            return pattern
          })

          return {
            ...floor,
            patterns: updatedPatterns,
          }
        }) as Floor[]

        // 업데이트된 데이터로 상태 갱신
        setFloorData(updatedFloorData)
      }

      void updateSongData()
    }
  }, [gameOcrStates.djmax_respect_v?.results])

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
            (pattern: BoardPatternInfo) =>
              pattern.dlcCode === 'VL3' ||
              pattern.dlcCode === 'BA' ||
              pattern.dlcCode === 'PLI1' ||
              pattern.name === 'Kill Trap' ||
              pattern.name === 'Diomedes ~Extended Mix~' ||
              pattern.name === 'Phoenix Virus' ||
              pattern.name === 'alliance',
          )
          .sort((a: BoardPatternInfo, b: BoardPatternInfo) => b.djpower - a.djpower)

        // BASIC 70 패턴 필터링 및 정렬
        const basicPatterns = allPatterns
          .filter(
            (pattern: BoardPatternInfo) =>
              pattern.dlcCode !== 'VL3' &&
              pattern.dlcCode !== 'BA' &&
              pattern.dlcCode !== 'PLI1' &&
              pattern.name !== 'Kill Trap' &&
              pattern.name !== 'Diomedes ~Extended Mix~' &&
              pattern.name !== 'Phoenix Virus' &&
              pattern.name !== 'alliance',
          )
          .sort((a: BoardPatternInfo, b: BoardPatternInfo) => b.djpower - a.djpower)

        // TOP 50 정렬 (이건 여전히 rating 기준)
        const top50Patterns = [...allPatterns]
          .sort((a: BoardPatternInfo, b: BoardPatternInfo) => b.rating - a.rating)
          .slice(0, 50)

        // 컷오프 점수 설정
        setCutoffScores({
          new30: (newPatterns[29] as BoardPatternInfo)?.djpower || 0,
          basic70: (basicPatterns[69] as BoardPatternInfo)?.djpower || 0,
          top50: (top50Patterns[49] as BoardPatternInfo)?.rating || 0,
        })
      } catch (error) {
        createLog('error', 'Error in fetchAllBoardData', error)
      }
    }

    void fetchAllBoardData()
  }, [userData.varchiveUserInfo.nickname, keyMode])

  if (!isMounted) return null

  // 통계 계산 함수 수정
  const calculateStats = (patterns: BoardPatternInfo[]) => {
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
  const shouldHighlight = (pattern: BoardPatternInfo) => {
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
  const sortPatterns = (patterns: BoardPatternInfo[]) => {
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
    total: 'ALL',
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
      navigate('/')
    }
  }, [])

  // 층별 평균 레이팅 계산 함수 수정
  const calculateFloorStats = (patterns: BoardPatternInfo[], floorNumber: number) => {
    const validPatterns = patterns.filter((p) => p.rating > 0)
    if (validPatterns.length === 0) return null

    const avgRating = validPatterns.reduce((sum, p) => sum + p.rating, 0) / validPatterns.length
    const floorMaxTP =
      globalDictionary.gameDictionary.djmax_respect_v.tierPointMap[floorNumber.toString()]

    if (!floorMaxTP) return null

    return {
      avgRating: avgRating.toFixed(3),
      percentage: ((avgRating / floorMaxTP) * 100).toFixed(1),
    }
  }

  // 층별 평균 점수 계산 함수 추가
  const calculateScoreStats = (patterns: BoardPatternInfo[]) => {
    const validPatterns = patterns.filter((p) => p.score != null && p.score > 0)
    if (validPatterns.length === 0) return null

    const avgScore =
      validPatterns.reduce((sum, p) => sum + Number(p.score), 0) / validPatterns.length
    return avgScore.toFixed(2)
  }

  // 패턴 타입이 변경되면 DIFF 모드에서 floorData 업데이트
  useEffect(() => {
    if (selectedDifficulty === 'DIFF' && allBoardData.length > 0) {
      // 선택된 패턴 타입에 맞는 패턴 필터링
      const filteredPatterns = allBoardData.filter(
        (pattern: BoardPatternInfo) => pattern.pattern === selectedPatternType,
      )

      // 유니크한 레벨 목록 추출 (level 값이 있는 경우)
      const levels = filteredPatterns
        .filter((pattern: BoardPatternInfo) => pattern.level != null)
        .map((pattern: BoardPatternInfo) => {
          // 레벨을 숫자로 변환 (SC 접두사 제거하고 숫자만 추출)
          const levelStr = String(pattern.level)
          const numericLevel = parseInt(levelStr.replace(/\D/g, ''))
          return numericLevel
        })
        .filter((level, index, self) => self.indexOf(level) === index && !isNaN(level))
        .sort((a, b) => b - a) // 내림차순 정렬

      setUniqueLevels(levels)

      // 레벨별로 그룹화
      const patternsByLevel = filteredPatterns.reduce<Record<number, BoardPatternInfo[]>>(
        (groups, pattern: BoardPatternInfo) => {
          const levelStr = String(pattern.level || '0')
          const numericLevel = parseInt(levelStr.replace(/\D/g, '')) || 0

          if (!groups[numericLevel]) {
            groups[numericLevel] = []
          }
          groups[numericLevel].push(pattern)

          return groups
        },
        {},
      )

      // 레벨별 floors 생성 (레벨 내림차순)
      const patternTypeFloors = Object.entries(patternsByLevel)
        .sort(([levelA], [levelB]) => parseInt(levelB) - parseInt(levelA))
        .map(([level, patterns]) => ({
          floorNumber: parseInt(level),
          patterns: patterns,
        }))

      setFloorData(patternTypeFloors as Floor[])
    }
  }, [selectedPatternType, selectedDifficulty, allBoardData])

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
                            {selectedDifficulty == 'DIFF'
                              ? selectedPatternType
                              : board && String(keyBoardTitle[board])}
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
                    {t('keyMode')}
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
                      {t('board')}
                    </div>
                    {/* 난이도 선택 탭 */}
                    <div className='tw:flex tw:gap-2 tw:mb-1'>
                      {['NORMAL', 'SC', 'DIFF'].map((group) => (
                        <button
                          key={group}
                          onClick={() => {
                            setSelectedDifficulty(group as 'NORMAL' | 'SC' | 'DIFF')
                            // 선택한 난이도에 따라 URL 업데이트
                            if (keyMode) {
                              if (group === 'DIFF') {
                                navigate(
                                  `/games/djmax_respect_v/board/${keyMode}/DIFF_${selectedPatternType}`,
                                )
                              } else if (group === 'NORMAL') {
                                navigate(`/games/djmax_respect_v/board/${keyMode}/1`)
                              } else if (group === 'SC') {
                                navigate(`/games/djmax_respect_v/board/${keyMode}/SC`)
                              }
                            }
                          }}
                          className={`tw:flex-1 tw:px-4 tw:py-1.5 tw:rounded-md tw:text-sm tw:font-medium tw:transition-all ${
                            selectedDifficulty === group
                              ? 'tw:bg-indigo-600/20 tw:text-indigo-700 tw:dark:text-indigo-200 tw:border tw:border-indigo-500'
                              : 'tw:bg-slate-100/50 tw:dark:bg-slate-700/30 hover:tw:bg-slate-200/50 hover:tw:dark:bg-slate-700/50 tw:text-slate-600 tw:dark:text-slate-400'
                          }`}
                        >
                          {group}
                        </button>
                      ))}
                    </div>

                    {/* 패턴 타입 선택 - DIFF 모드일 때만 표시 */}
                    {selectedDifficulty === 'DIFF' && (
                      <div className='tw:flex tw:gap-2 tw:mb-1'>
                        {['NM', 'HD', 'MX', 'SC'].map((pattern) => (
                          <button
                            key={pattern}
                            onClick={() => {
                              setSelectedPatternType(pattern as 'NM' | 'HD' | 'MX' | 'SC')
                              // URL 업데이트
                              if (keyMode) {
                                navigate(`/games/djmax_respect_v/board/${keyMode}/DIFF_${pattern}`)
                              }
                            }}
                            className={`tw:flex-1 tw:px-4 tw:py-1.5 tw:rounded-md tw:text-sm tw:font-medium tw:transition-all ${
                              selectedPatternType === pattern
                                ? 'tw:bg-indigo-600/20 tw:text-indigo-700 tw:dark:text-indigo-200 tw:border tw:border-indigo-500'
                                : 'tw:bg-slate-100/50 tw:dark:bg-slate-700/30 hover:tw:bg-slate-200/50 hover:tw:dark:bg-slate-700/50 tw:text-slate-600 tw:dark:text-slate-400'
                            }`}
                          >
                            {pattern}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 선택된 난이도의 레벨 그리드 */}
                    <div className='tw:grid tw:grid-cols-5 tw:gap-1'>
                      {selectedDifficulty !== 'DIFF' &&
                        boards
                          .filter((level) => {
                            if (selectedDifficulty === 'NORMAL')
                              return !level.startsWith('SC') && !level.startsWith('DIFF_')
                            return level.startsWith('SC') || level.startsWith('DIFF_')
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
              ) : selectedDifficulty === 'DIFF' ? (
                // DIFF 모드일 때는 레벨별로 패턴 표시 (기존 코드 대체)
                floorData.map((floor) => {
                  // 각 floor의 patterns를 정렬
                  const sortedPatterns = sortPatterns(floor.patterns)

                  return (
                    <div
                      key={`floor_${floor.floorNumber}`}
                      id={`level-${floor.floorNumber}`}
                      className={`tw:flex tw:gap-3 tw:my-3 ${floor !== floorData[floorData.length - 1] ? 'tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:pb-6' : ''}`}
                    >
                      <span className='tw:font-bold tw:text-base tw:min-w-24 tw:text-right tw:text-slate-700 tw:dark:text-slate-300'>
                        <div className='tw:flex tw:flex-col tw:items-end tw:gap-1'>
                          <div className='tw:flex tw:items-center tw:gap-1'>
                            <span className='tw:text-indigo-600 tw:dark:text-indigo-400'>
                              {selectedPatternType}
                            </span>
                            <span className='tw:text-xl'>Lv.{floor.floorNumber}</span>
                          </div>
                          {calculateScoreStats(floor.patterns) && (
                            <div className='tw:flex tw:flex-col tw:items-end'>
                              <span className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400 tw:font-light'>
                                {t('scoreAverage')}
                              </span>
                              <div className='tw:text-sm tw:text-slate-700 tw:dark:text-slate-200'>
                                {calculateScoreStats(floor.patterns)}%
                              </div>
                            </div>
                          )}
                        </div>
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
                                    {pattern.score ? (
                                      <span
                                        className={`tw:text-xs tw:font-extrabold ${
                                          pattern.maxCombo
                                            ? 'tw:text-indigo-500 tw:dark:text-yellow-500'
                                            : 'tw:text-slate-700 tw:dark:text-slate-200'
                                        }`}
                                      >
                                        <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200 tw:font-normal'>
                                          SCORE :
                                        </span>{' '}
                                        {pattern.score}%
                                      </span>
                                    ) : null}

                                    {pattern.djpower ? (
                                      <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200'>
                                        DP : {pattern.djpower}
                                      </span>
                                    ) : null}
                                    {pattern.rating ? (
                                      <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200'>
                                        TP : {pattern.rating}
                                      </span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                    {t('noRecord')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`tw:flex tw:flex-1 tw:bg-slate-200 tw:dark:bg-slate-700 tw:bg-opacity-25 tw:px-2 tw:py-1 tw:rounded-md ${
                                language !== 'ja_JP' ? 'tw:break-keep' : ''
                              } tw:justify-center tw:items-center tw:text-center tw:text-xs tw:text-slate-700 tw:dark:text-slate-300`}
                            >
                              {pattern.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
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
                                    {t('scoreAverage')}
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
                                      {t('tpAverage')}
                                    </span>
                                    <div className='tw:text-sm tw:text-slate-700 tw:dark:text-slate-200'>
                                      {
                                        calculateFloorStats(floor.patterns, floor.floorNumber)
                                          .avgRating
                                      }{' '}
                                      /{' '}
                                      {
                                        globalDictionary.gameDictionary.djmax_respect_v
                                          .tierPointMap[floor.floorNumber.toString()]
                                      }
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        ) : (
                          <div className='tw:flex tw:flex-col tw:items-end tw:gap-1'>
                            <div>{t('unclassified')}</div>
                            {calculateScoreStats(floor.patterns) && (
                              <div className='tw:flex tw:flex-col tw:items-end'>
                                <span className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400 tw:font-light'>
                                  {t('scoreAverage')}
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
                                    {pattern.score ? (
                                      <span
                                        className={`tw:text-xs tw:font-extrabold ${
                                          pattern.maxCombo
                                            ? 'tw:text-indigo-500 tw:dark:text-yellow-500'
                                            : 'tw:text-slate-700 tw:dark:text-slate-200'
                                        }`}
                                      >
                                        <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200 tw:font-normal'>
                                          SCORE :
                                        </span>{' '}
                                        {pattern.score}%
                                      </span>
                                    ) : null}

                                    {pattern.djpower ? (
                                      <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200'>
                                        DP : {pattern.djpower}
                                      </span>
                                    ) : null}
                                    {pattern.rating ? (
                                      <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200'>
                                        TP : {pattern.rating}
                                      </span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                    {t('noRecord')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`tw:flex tw:flex-1 tw:bg-slate-200 tw:dark:bg-slate-700 tw:bg-opacity-25 tw:px-2 tw:py-1 tw:rounded-md ${
                                language !== 'ja_JP' ? 'tw:break-keep' : ''
                              } tw:justify-center tw:items-center tw:text-center tw:text-xs tw:text-slate-700 tw:dark:text-slate-300`}
                            >
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

      {/* DIFF 모드일 때 레벨 빠른 이동 플로팅 버튼 추가 */}
      {selectedDifficulty === 'DIFF' && !isLoading && uniqueLevels.length > 0 && (
        <div className='tw:fixed tw:bottom-2 tw:right-2 tw:flex tw:flex-col tw:gap-2 tw:z-50'>
          <div className='tw:p-1 tw:bg-slate-100 tw:dark:bg-slate-800 tw:rounded-lg tw:shadow-lg tw:border tw:border-slate-200 tw:dark:border-slate-600'>
            {/* <div className='tw:text-xs tw:font-medium tw:text-center tw:text-slate-600 tw:dark:text-slate-300'>
              {t('quickJump')}
            </div> */}
            <div className='tw:flex tw:gap-2 tw:max-h-56 tw:overflow-y-auto tw:p-1'>
              {uniqueLevels.map((level) => (
                <a
                  key={`quick_level_${level}`}
                  href={`#level-${level}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const element = document.getElementById(`level-${level}`)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className='tw:flex tw:items-center tw:justify-center tw:px-2 tw:py-2.5 tw:bg-slate-200 tw:dark:bg-slate-600 tw:rounded-md tw:text-xs tw:font-medium tw:hover:bg-indigo-100 tw:dark:hover:bg-indigo-900/30 tw:transition-colors'
                >
                  Lv.{level}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  )
}

export default DmrvBoardPage
