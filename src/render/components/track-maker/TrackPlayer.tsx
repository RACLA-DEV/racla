import { Icon } from '@iconify/react'
import { RootState } from '@render/store'
import type { JudgementDisplay, KeyState } from '@src/types/track-maker/JudgementDisplay'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import type { KeyMode, Note, TrackPlayerProps } from '../../../types/track-maker/TrackMaker'
import styles from './TrackPlayer.module.css'

const KEY_MAPS = {
  '4B': ['d', 'f', 'j', 'k'],
  '5B': ['d', 'f', 'space', 'j', 'k'],
  '6B': ['s', 'd', 'f', 'j', 'k', 'l'],
  '8B': ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
}

const SPECIAL_KEYS = {
  fx_left: 'z',
  fx_right: '/',
  lr_left: 'x',
  lr_right: '.',
  enter: 'enter',
}

const getLaneCount = (keyMode: KeyMode): number => {
  switch (keyMode) {
    case '4B':
      return 4
    case '5B':
      return 5
    case '6B':
      return 6
    case '8B':
      return 8
    default:
      return 4
  }
}

const TrackPlayer: React.FC<TrackPlayerProps> = ({ pattern, bpm, keyMode }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [score, setScore] = useState<number>(0)
  const [combo, setCombo] = useState<number>(0)
  const [maxCombo, setMaxCombo] = useState<number>(0)
  const [keyState, setKeyState] = useState<KeyState>({})
  const [scrollSpeed, setScrollSpeed] = useState<number>(500)
  const [currentJudgement, setCurrentJudgement] = useState<JudgementDisplay | null>(null)
  const [judgementsEnabled, setJudgementsEnabled] = useState<boolean>(true)
  const [showGuide, setShowGuide] = useState<boolean>(true)
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true)
  const [hitSoundEnabled, setHitSoundEnabled] = useState<boolean>(true)
  const [judgementCounts, setJudgementCounts] = useState<Record<string, number>>({
    PERFECT: 0,
    GREAT: 0,
    GOOD: 0,
    BAD: 0,
    MISS: 0,
  })

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const visibleNotesRef = useRef<Note[]>([])
  const pressedNotesRef = useRef<Set<string>>(new Set())
  const longNoteTicksRef = useRef<Record<string, number>>({}) // 롱노트 틱 카운트 정보 저장
  const longNoteJudgementsRef = useRef<Record<string, string>>({}) // 롱노트의 최초 판정 저장
  const laneCount = getLaneCount(keyMode)

  // 테마 상태 가져오기
  const theme = useSelector((state: RootState) => state.ui.theme)

  // 판정 애니메이션 지속 시간
  const JUDGEMENT_DISPLAY_DURATION = 500 // ms

  // 게임판 크기
  const LANE_WIDTH = 60
  const NOTE_HEIGHT = 20
  const JUDGEMENT_LINE_POSITION = 0.85 // 판정선 위치 (화면 높이의 비율, 더 아래로 내림)

  // 첫 노트 지연 시간
  const INITIAL_DELAY = 3000 // 3초
  // 마지막 노트 지연 시간
  const ENDING_DELAY = 1000 // 3초

  // 미리 보이는 노트 시간 범위 (ms)
  const VISIBLE_NOTE_RANGE = 4000 // 노트가 미리 보이기 시작하는 시간

  // 판정 범위 (ms)
  const JUDGEMENT = {
    PERFECT: 50,
    GREAT: 100,
    GOOD: 150,
    BAD: 200,
  }

  // 판정선 위치 계산을 위한 효과
  const [judgementLineY, setJudgementLineY] = useState(0)

  // 게임 영역 크기가 변경될 때마다 판정선 위치 업데이트
  useEffect(() => {
    const updateJudgementLinePosition = () => {
      if (gameAreaRef.current) {
        const gameHeight = gameAreaRef.current.clientHeight
        setJudgementLineY(gameHeight * JUDGEMENT_LINE_POSITION)
      }
    }

    // 초기 로드 시 설정
    updateJudgementLinePosition()

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', updateJudgementLinePosition)

    // 클린업
    return () => {
      window.removeEventListener('resize', updateJudgementLinePosition)
    }
  }, [])

  // 게임 시작
  const startGame = () => {
    setIsPlaying(true)
    setCurrentTime(0)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setCurrentJudgement(null)
    setJudgementsEnabled(true)
    // 판정 카운트 초기화
    setJudgementCounts({
      PERFECT: 0,
      GREAT: 0,
      GOOD: 0,
      BAD: 0,
      MISS: 0,
    })
    pressedNotesRef.current.clear()
    longNoteTicksRef.current = {} // 롱노트 틱 정보 초기화
    longNoteJudgementsRef.current = {} // 롱노트 판정 정보 초기화

    // 첫 노트 지연을 위해 모든 노트 시간에 INITIAL_DELAY 추가
    visibleNotesRef.current = [...pattern]
      .map((note) => {
        // 깊은 복사를 위해 새 객체 생성
        const newNote = { ...note }
        newNote.time += INITIAL_DELAY

        // 롱노트인 경우 endTime도 조정
        if (newNote.isLong && newNote.endTime) {
          newNote.endTime += INITIAL_DELAY
        }

        return newNote
      })
      .sort((a, b) => a.time - b.time)

    startTimeRef.current = performance.now()

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    updateGame()
  }

  // 게임 종료
  const stopGame = () => {
    setIsPlaying(false)
    setCurrentJudgement(null)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  // 게임 업데이트 (애니메이션 프레임)
  const updateGame = () => {
    const now = performance.now()
    const elapsedTime = now - startTimeRef.current
    setCurrentTime(elapsedTime)

    // 판정 범위 밖으로 지나간 노트를 미스로 처리
    const missedNotes = visibleNotesRef.current.filter((note) => {
      // 롱노트는 눌린 상태인 경우 무시
      if (note.isLong && pressedNotesRef.current.has(note.id)) {
        return false
      }
      // 노트가 판정선을 지나간 경우 (판정선 + 판정 범위를 지남)
      return note.time < elapsedTime - JUDGEMENT.BAD
    })

    // 미스 처리된 노트들 제거 및 미스 판정 처리
    if (missedNotes.length > 0) {
      // 각 미스 노트마다 미스 판정 처리
      missedNotes.forEach((note) => {
        updateScore('MISS')
        visibleNotesRef.current = visibleNotesRef.current.filter((n) => n.id !== note.id)
      })
    }

    // 롱노트 틱 처리 (BPM에 맞게 콤보 추가)
    const beatDuration = 60000 / bpm // 한 비트당 시간 (ms)

    // 누르고 있는 롱노트 처리
    pressedNotesRef.current.forEach((noteId) => {
      const longNote = visibleNotesRef.current.find(
        (note) => note.id === noteId && note.isLong && note.endTime,
      )
      if (longNote) {
        const noteDuration = longNote.endTime! - longNote.time
        if (noteDuration > beatDuration) {
          // 롱노트 틱 정보 초기화 (처음이면)
          if (!longNoteTicksRef.current[noteId]) {
            longNoteTicksRef.current[noteId] = longNote.time + beatDuration
          }

          // 현재 시간이 다음 틱 시간을 지났는지 확인
          while (
            longNoteTicksRef.current[noteId] < elapsedTime &&
            longNoteTicksRef.current[noteId] < longNote.endTime!
          ) {
            // 콤보 업데이트 (틱당 1콤보)
            setCombo((prev) => prev + 1)

            // 최초 판정에 따른 점수 가산
            const initialJudgement = longNoteJudgementsRef.current[noteId] || 'PERFECT'
            let tickScore = 0

            // 최초 판정에 따른 점수 계산
            switch (initialJudgement) {
              case 'PERFECT':
                tickScore = 50 // 기본 틱 점수
                break
              case 'GREAT':
                tickScore = 40 // 80% 점수
                break
              case 'GOOD':
                tickScore = 25 // 50% 점수
                break
              case 'BAD':
                tickScore = 10 // 20% 점수
                break
              default:
                tickScore = 50
            }

            // 스코어 업데이트 (판정 표시 없음)
            setScore((prev) => prev + tickScore)

            // 다음 틱 시간 계산
            longNoteTicksRef.current[noteId] += beatDuration
          }
        }
      }
    })

    // 롱노트의 종료 시간 체크 및 자동 처리
    const longNotesToCheck = visibleNotesRef.current.filter(
      (note) =>
        note.isLong &&
        pressedNotesRef.current.has(note.id) &&
        note.endTime &&
        note.endTime < elapsedTime,
    )

    if (longNotesToCheck.length > 0) {
      longNotesToCheck.forEach((note) => {
        // 롱노트 ID 저장 (판정 중복 방지용)
        const noteId = note.id

        // 최초 판정이 MISS인 경우, 판정하지 않음 (이미 미스 처리된 롱노트)
        const initialJudgement = longNoteJudgementsRef.current[noteId]
        if (initialJudgement === 'MISS') {
          // 롱노트가 끝까지 눌려있는 경우 노트 제거만 처리
          visibleNotesRef.current = visibleNotesRef.current.filter((n) => n.id !== noteId)
          pressedNotesRef.current.delete(noteId)
          delete longNoteTicksRef.current[noteId]
          delete longNoteJudgementsRef.current[noteId]
          return
        }

        // 롱노트가 끝까지 눌려있는 경우 자동으로 성공 처리
        visibleNotesRef.current = visibleNotesRef.current.filter((n) => n.id !== noteId)
        pressedNotesRef.current.delete(noteId)

        // 롱노트 틱 정보 삭제
        delete longNoteTicksRef.current[noteId]

        // 롱노트 땔 때 판정 항상 적용
        const initialJudgementValue = longNoteJudgementsRef.current[noteId] || 'PERFECT'
        updateScore(initialJudgementValue as 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS')

        // 롱노트 판정 정보 삭제
        delete longNoteJudgementsRef.current[noteId]
      })
    }

    // 게임 종료 조건 체크 - 마지막 노트 이후 3초 지연 추가
    if (visibleNotesRef.current.length === 0 && pressedNotesRef.current.size === 0) {
      // 마지막 노트가 끝난 시간 계산
      let lastNoteEndTime = 0

      // 패턴 배열에서 마지막 노트의 시간을 찾음
      if (pattern.length > 0) {
        const lastNotes = [...pattern].sort((a, b) => {
          // 롱노트인 경우 endTime 사용, 아닌 경우 time 사용
          const aTime = a.isLong && a.endTime ? a.endTime : a.time
          const bTime = b.isLong && b.endTime ? b.endTime : b.time
          return bTime - aTime // 내림차순 정렬
        })

        // 가장 마지막 노트의 종료 시간 (롱노트면 endTime, 아니면 time)
        const lastNote = lastNotes[0]
        lastNoteEndTime = lastNote.isLong && lastNote.endTime ? lastNote.endTime : lastNote.time
        lastNoteEndTime += INITIAL_DELAY // 초기 지연 시간 추가
      }

      // 마지막 노트 이후 ENDING_DELAY 시간이 지났는지 확인
      if (elapsedTime > lastNoteEndTime + ENDING_DELAY) {
        stopGame()
        return
      }
    }

    animationRef.current = requestAnimationFrame(updateGame)
  }

  // 키 입력 처리
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isPlaying) return

      // 키 상태 업데이트
      setKeyState((prev) => ({ ...prev, [e.key.toLowerCase()]: true }))

      // 노트 판정
      const keyTime = performance.now() - startTimeRef.current
      checkNoteHit(e.key.toLowerCase(), keyTime)
    },
    [isPlaying],
  )

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // 키 상태 업데이트
    setKeyState((prev) => ({ ...prev, [e.key.toLowerCase()]: false }))

    // 롱노트 처리
    checkLongNoteRelease(e.key.toLowerCase())
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // 노트 판정
  const checkNoteHit = (key: string, keyTime: number) => {
    const keyMap = KEY_MAPS[keyMode]

    // 일반 키 입력 (레인에 따라)
    let laneIndex = keyMap.indexOf(key)
    let noteType = 'normal'

    // 특수 키 입력 (FX, LR, Enter)
    if (key === SPECIAL_KEYS.fx_left) {
      laneIndex = 0
      noteType = 'fx'
    } else if (key === SPECIAL_KEYS.fx_right) {
      laneIndex = 1
      noteType = 'fx'
    } else if (key === SPECIAL_KEYS.lr_left) {
      laneIndex = 0
      noteType = 'lr'
    } else if (key === SPECIAL_KEYS.lr_right) {
      laneIndex = 1
      noteType = 'lr'
    } else if (key === SPECIAL_KEYS.enter) {
      laneIndex = 0
      noteType = 'enter'
    }

    // 이미 누른 롱노트가 있는지 확인
    const pressedLongNote = visibleNotesRef.current.find(
      (note) =>
        note.isLong &&
        pressedNotesRef.current.has(note.id) &&
        note.type === noteType &&
        ((noteType === 'normal' && note.lane === laneIndex) ||
          (noteType === 'fx' && note.lane === laneIndex) ||
          (noteType === 'lr' && note.lane === laneIndex) ||
          noteType === 'enter'),
    )

    // 이미 누른 롱노트가 있으면 중복 처리 방지
    if (pressedLongNote) {
      return
    }

    // 해당 레인 및 타입에 맞는 노트 찾기
    const targetNotes = visibleNotesRef.current.filter((note) => {
      // 판정 가능한 범위 내에 있는 노트만 선택 (판정선과 가까운 노트만)
      const timeOffset = note.time - keyTime
      const isWithinJudgementRange = Math.abs(timeOffset) <= JUDGEMENT.BAD * 2

      // 타입과 레인이 일치하고 판정 범위 내에 있는 노트만 필터링
      if (note.type !== noteType || !isWithinJudgementRange) return false

      if (noteType === 'normal') {
        return note.lane === laneIndex
      } else if (noteType === 'fx' || noteType === 'lr') {
        return note.lane === laneIndex
      } else if (noteType === 'enter') {
        return true
      }

      return false
    })

    // 노트가 없으면 미스 처리하지 않고 그냥 리턴
    if (targetNotes.length === 0) {
      return
    }

    // 가장 판정선과 가까운 노트 선택
    const closestNote = targetNotes.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.time - keyTime)
      const currDiff = Math.abs(curr.time - keyTime)
      return prevDiff < currDiff ? prev : curr
    })

    const timeDiff = Math.abs(closestNote.time - keyTime)

    // 판정 범위 내에 있는지 확인
    if (timeDiff <= JUDGEMENT.BAD) {
      // 판정 결정
      let judgementText: 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS'

      if (timeDiff <= JUDGEMENT.PERFECT) {
        judgementText = 'PERFECT'
      } else if (timeDiff <= JUDGEMENT.GREAT) {
        judgementText = 'GREAT'
      } else if (timeDiff <= JUDGEMENT.GOOD) {
        judgementText = 'GOOD'
      } else {
        judgementText = 'BAD'
      }

      // 롱노트 시작 또는 일반 노트 처리
      if (closestNote.isLong) {
        // 이미 누른 롱노트가 아닌지 한번 더 확인 (중복 방지)
        if (!pressedNotesRef.current.has(closestNote.id)) {
          pressedNotesRef.current.add(closestNote.id)
          // 롱노트의 경우 최초 판정 저장
          longNoteJudgementsRef.current[closestNote.id] = judgementText
          // 점수 및 콤보 업데이트
          updateScore(judgementText)
        }
      } else {
        // 일반 노트는 바로 제거
        visibleNotesRef.current = visibleNotesRef.current.filter(
          (note) => note.id !== closestNote.id,
        )
        // 점수 및 콤보 업데이트
        updateScore(judgementText)
      }
    } else {
      // 판정 범위 밖 (미스)
      updateScore('MISS')

      // 미스 판정된 롱노트일 경우 ID를 기록
      if (closestNote.isLong) {
        pressedNotesRef.current.add(closestNote.id)
        longNoteJudgementsRef.current[closestNote.id] = 'MISS'
      } else {
        // 일반 노트는 바로 제거
        visibleNotesRef.current = visibleNotesRef.current.filter(
          (note) => note.id !== closestNote.id,
        )
      }
    }
  }

  // 롱노트 키 뗌 처리
  const checkLongNoteRelease = (key: string) => {
    const keyMap = KEY_MAPS[keyMode]

    // 일반 키 입력 (레인에 따라)
    let laneIndex = keyMap.indexOf(key)
    let noteType = 'normal'

    // 특수 키 입력 (FX, LR, Enter)
    if (key === SPECIAL_KEYS.fx_left) {
      laneIndex = 0
      noteType = 'fx'
    } else if (key === SPECIAL_KEYS.fx_right) {
      laneIndex = 1
      noteType = 'fx'
    } else if (key === SPECIAL_KEYS.lr_left) {
      laneIndex = 0
      noteType = 'lr'
    } else if (key === SPECIAL_KEYS.lr_right) {
      laneIndex = 1
      noteType = 'lr'
    } else if (key === SPECIAL_KEYS.enter) {
      laneIndex = 0
      noteType = 'enter'
    }

    // 롱노트 중인지 확인 - 레인과 타입에 맞는 롱노트만 검색
    const longNote = visibleNotesRef.current.find(
      (note) =>
        note.isLong &&
        pressedNotesRef.current.has(note.id) &&
        note.type === noteType &&
        ((noteType === 'normal' && note.lane === laneIndex) ||
          (noteType === 'fx' && note.lane === laneIndex) ||
          (noteType === 'lr' && note.lane === laneIndex) ||
          noteType === 'enter'),
    )

    if (!longNote) return

    // 롱노트 ID 저장 (판정 중복 방지용)
    const noteId = longNote.id

    // 이 롱노트에 대한 release 판정이 이미 처리되었는지 확인
    if (!visibleNotesRef.current.some((note) => note.id === noteId)) {
      // 이미 처리된 노트면 중복 방지
      return
    }

    // 롱노트 제거 처리
    visibleNotesRef.current = visibleNotesRef.current.filter((note) => note.id !== noteId)

    // 롱노트 상태에서 제거
    pressedNotesRef.current.delete(noteId)

    // 롱노트 틱 정보 삭제
    delete longNoteTicksRef.current[noteId]

    // 최초 판정이 MISS인 경우, 판정하지 않음 (이미 미스 처리된 롱노트)
    const initialJudgement = longNoteJudgementsRef.current[noteId]
    if (initialJudgement === 'MISS') {
      // 미스 판정된 롱노트는 더이상 판정하지 않음
      delete longNoteJudgementsRef.current[noteId]
      return
    }

    // 롱노트 종료 시간 체크
    const keyTime = performance.now() - startTimeRef.current
    const shouldEndTime = longNote.endTime || longNote.time

    if (keyTime >= shouldEndTime - JUDGEMENT.BAD) {
      // 정상 종료 (판정 범위 내)
      const timeDiff = Math.abs(shouldEndTime - keyTime)

      let judgementText: 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS'

      if (timeDiff <= JUDGEMENT.PERFECT) {
        judgementText = 'PERFECT'
      } else if (timeDiff <= JUDGEMENT.GREAT) {
        judgementText = 'GREAT'
      } else if (timeDiff <= JUDGEMENT.GOOD) {
        judgementText = 'GOOD'
      } else {
        judgementText = 'BAD'
      }

      updateScore(judgementText)
    } else {
      // 일찍 뗌 (미스)
      updateScore('MISS')
    }

    // 롱노트 판정 정보 삭제 (기존 판정 정보 제거하여 중복 방지)
    delete longNoteJudgementsRef.current[noteId]
  }

  useEffect(() => {
    setMaxCombo((prev) => Math.max(prev, combo))
  }, [combo])

  // 점수 및 콤보 업데이트
  const updateScore = (judgementText: 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS') => {
    let scoreAdd = 0

    // 판정 횟수 업데이트
    setJudgementCounts((prev) => ({
      ...prev,
      [judgementText]: prev[judgementText] + 1,
    }))

    // 판정 표시 업데이트 - 언제나 하나의 판정만 표시
    if (judgementsEnabled) {
      const newJudgement = {
        text: judgementText,
        timestamp: performance.now(),
        id: Math.random().toString(36).substring(2, 9),
      }

      setCurrentJudgement(newJudgement)

      // 일정 시간 후 판정 텍스트 지우기 (타이머 기반)
      setTimeout(() => {
        setCurrentJudgement((prev) => (prev && prev.id === newJudgement.id ? null : prev))
      }, JUDGEMENT_DISPLAY_DURATION)
    }

    switch (judgementText) {
      case 'PERFECT':
        scoreAdd = 100
        setCombo((prev) => prev + 1)
        break
      case 'GREAT':
        scoreAdd = 80
        setCombo((prev) => prev + 1)
        break
      case 'GOOD':
        scoreAdd = 50
        setCombo((prev) => prev + 1)
        break
      case 'BAD':
        scoreAdd = 20
        setCombo((prev) => prev + 1)
        break
      case 'MISS':
        setCombo(0)
        break
    }
    setScore((prev) => prev + scoreAdd)
  }

  // 노트 렌더링 - 개선된 필터링으로 자연스러운 등장 구현
  const renderNotes = () => {
    if (!isPlaying || !gameAreaRef.current) return null

    const gameWidth = laneCount * LANE_WIDTH

    // 현재 화면에 표시할 노트만 필터링 - 미리 보이는 범위 활용
    const notesInView = visibleNotesRef.current.filter((note) => {
      const timeOffset = note.time - currentTime

      // 롱노트의 경우 endTime도 고려
      if (note.isLong && note.endTime) {
        const endTimeOffset = note.endTime - currentTime
        // 롱노트의 끝이 판정선을 지났거나 시작이 미리 보이는 범위 안에 있으면 표시
        return endTimeOffset > -VISIBLE_NOTE_RANGE || timeOffset < VISIBLE_NOTE_RANGE
      }

      // 일반 노트는 이미 지나간 노트는 제외하고, 앞으로 나올 노트 중 범위 안에 있는 것만 표시
      return timeOffset > -500 && timeOffset < VISIBLE_NOTE_RANGE
    })

    return notesInView.map((note) => {
      let noteX = 0
      let noteWidth = LANE_WIDTH

      // 노트 타입에 따른 위치와 너비 조정
      if (note.type === 'normal') {
        noteX = note.lane * LANE_WIDTH
      } else if (note.type === 'fx' || note.type === 'lr') {
        noteX = note.lane === 0 ? 0 : gameWidth / 2
        noteWidth = gameWidth / 2
      } else if (note.type === 'enter') {
        noteX = 0
        noteWidth = gameWidth
      }

      // 롱노트 높이와 위치 계산 - 트랙 메이커와 동일하게 수정
      let noteHeight = NOTE_HEIGHT
      let noteY = calculateNoteY(note.time)

      if (note.isLong && note.endTime) {
        // 롱노트의 끝 위치 계산
        const endY = calculateNoteY(note.endTime)

        // 높이 계산 - 시작 위치와 끝 위치의 차이
        noteHeight = Math.abs(noteY - endY)

        // 노트의 시작 위치 조정 - 항상 위쪽(더 작은 y값)에서 시작
        noteY = Math.min(noteY, endY)
      }

      // 노트 타입에 따른 스타일 클래스
      const noteTypeClass =
        note.type === 'fx'
          ? styles.fxNote
          : note.type === 'lr'
            ? styles.lrNote
            : note.type === 'enter'
              ? styles.enterNote
              : styles.normalNote

      // 눌린 상태 여부
      const isPressing = pressedNotesRef.current.has(note.id)

      return (
        <div
          key={note.id}
          className={`${styles.note} ${noteTypeClass} ${isPressing ? styles.pressedNote : ''}`}
          style={{
            left: `${noteX}px`,
            top: `${noteY}px`,
            width: `${noteWidth}px`,
            height: `${noteHeight}px`,
            zIndex:
              note.type === 'normal' ? 10 : note.type === 'fx' ? 5 : note.type === 'lr' ? 4 : 3,
          }}
        />
      )
    })
  }

  // 레인 렌더링 - 전체 높이 활용 및 속도 조절 시 경계선 유지
  const renderLanes = () => {
    if (!gameAreaRef.current) return null

    const gameHeight = gameAreaRef.current.clientHeight || 600
    const lanes = []

    for (let i = 0; i < laneCount; i++) {
      const isPressed = Boolean(keyState[KEY_MAPS[keyMode]?.[i]] || false)

      lanes.push(
        <div
          key={`lane-${i}`}
          className={`${styles.lane} ${isPressed ? styles.pressedLane : ''}`}
          style={{
            left: `${i * LANE_WIDTH}px`,
            width: `${LANE_WIDTH}px`,
            height: `${gameHeight}px`, // 동적 높이 적용
          }}
        />,
      )

      // 마지막 레인을 제외하고 구분선 추가
      if (i < laneCount - 1) {
        lanes.push(
          <div
            key={`lane-divider-${i}`}
            className={styles.laneDivider}
            style={{
              left: `${(i + 1) * LANE_WIDTH - 1}px`,
              height: `${gameHeight}px`, // 동적 높이 적용
            }}
          />,
        )
      }
    }

    return lanes
  }

  // 판정 표시 렌더링
  const renderJudgement = () => {
    if (!currentJudgement || !gameAreaRef.current) return null

    const gameHeight = gameAreaRef.current.clientHeight || 600
    const judgementLineY = gameHeight * JUDGEMENT_LINE_POSITION
    const gameWidth = laneCount * LANE_WIDTH

    // 판정 표시에 따른 스타일 클래스
    const judgementClass =
      currentJudgement.text === 'PERFECT'
        ? styles.perfectJudgement
        : currentJudgement.text === 'GREAT'
          ? styles.greatJudgement
          : currentJudgement.text === 'GOOD'
            ? styles.goodJudgement
            : currentJudgement.text === 'BAD'
              ? styles.badJudgement
              : styles.missJudgement

    return (
      <div
        key={currentJudgement.id}
        className={`${styles.judgementDisplay} ${judgementClass}`}
        style={{
          left: `${gameWidth / 2}px`,
          top: `${judgementLineY - 30}px`,
        }}
      >
        {currentJudgement.text}
      </div>
    )
  }

  // 콤보 표시 렌더링
  const renderCombo = () => {
    if (combo <= 1 || !gameAreaRef.current) return null

    const gameWidth = laneCount * LANE_WIDTH

    return (
      <div
        className={styles.comboDisplay}
        style={{
          left: `${gameWidth / 2}px`,
          top: '70px',
        }}
      >
        <div className={styles.comboCount}>{combo}</div>
        <div className={styles.comboText}>COMBO</div>
      </div>
    )
  }

  // 노트 Y 좌표 계산 (시간 -> 픽셀) - 자연스러운 등장을 위한 개선
  const calculateNoteY = useCallback(
    (noteTime: number) => {
      // 게임 영역 높이 동적 획득
      const gameHeight = gameAreaRef.current ? gameAreaRef.current.clientHeight : 600
      const judgementLineY = gameHeight * JUDGEMENT_LINE_POSITION

      const timeOffset = noteTime - currentTime
      const pixelOffset = timeOffset * (scrollSpeed / 1000)

      // 노트가 자연스럽게 등장하도록 처리
      if (timeOffset > VISIBLE_NOTE_RANGE) {
        // 범위 밖이면 화면 위쪽(음수 위치)에 배치
        return -NOTE_HEIGHT
      }

      // 판정선 기준으로 위치 계산
      return judgementLineY - pixelOffset
    },
    [currentTime, scrollSpeed, VISIBLE_NOTE_RANGE],
  )

  // 속도 배수로 표시
  const getSpeedMultiplier = (speed: number) => {
    return (speed / 100).toFixed(1) + 'x'
  }

  return (
    <div
      className={`${styles.playerContainer} ${theme === 'dark' ? styles.darkTheme : styles.lightTheme}`}
    >
      <div className={styles.mainGameArea}>
        {/* 왼쪽 패널 - 게임 정보 */}
        <div className={`${styles.leftPanel} tw:custom-scrollbar`}>
          <div className={styles.scorePanel}>
            <div className={styles.scorePanelHeader}>
              <Icon icon='material-symbols:scoreboard' className={styles.scoreIcon} />
              <h3>점수</h3>
            </div>
            <div className={styles.scoreValue}>{score}</div>
            <div className={styles.scoreDetails}>
              <div className={styles.statRow}>
                <span>현재 콤보</span>
                <span>{combo}</span>
              </div>
              <div className={styles.statRow}>
                <span>최대 콤보</span>
                <span>{maxCombo}</span>
              </div>
              <div className={styles.judgementStats}>
                <div className={`${styles.judgementStat} ${styles.perfectColor}`}>
                  <span>PERFECT</span>
                  <span>{judgementCounts.PERFECT}</span>
                </div>
                <div className={`${styles.judgementStat} ${styles.greatColor}`}>
                  <span>GREAT</span>
                  <span>{judgementCounts.GREAT}</span>
                </div>
                <div className={`${styles.judgementStat} ${styles.goodColor}`}>
                  <span>GOOD</span>
                  <span>{judgementCounts.GOOD}</span>
                </div>
                <div className={`${styles.judgementStat} ${styles.badColor}`}>
                  <span>BAD</span>
                  <span>{judgementCounts.BAD}</span>
                </div>
                <div className={`${styles.judgementStat} ${styles.missColor}`}>
                  <span>MISS</span>
                  <span>{judgementCounts.MISS}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.controlPanel}>
            <div className={styles.speedPanel}>
              <div className={styles.speedHeader}>
                <Icon icon='material-symbols:speed' className={styles.speedIcon} />
                <h3>노트 속도</h3>
              </div>
              <div className={styles.speedValue}>{getSpeedMultiplier(scrollSpeed)}</div>
              {!isPlaying && (
                <div className={styles.speedControl}>
                  <input
                    type='range'
                    min='50'
                    max='1000'
                    step='50'
                    value={scrollSpeed}
                    onChange={(e) => {
                      setScrollSpeed(parseInt(e.target.value))
                    }}
                    className={styles.speedSlider}
                  />
                </div>
              )}
            </div>

            <div className={styles.gameControls}>
              {!isPlaying ? (
                <button className={styles.startButton} onClick={startGame}>
                  <Icon icon='material-symbols:play-arrow' className={styles.controlIcon} />
                  시작하기
                </button>
              ) : (
                <button className={styles.stopButton} onClick={stopGame}>
                  <Icon icon='material-symbols:stop' className={styles.controlIcon} />
                  중지하기
                </button>
              )}
            </div>

            {!isPlaying && (
              <div className={styles.optionsPanel}>
                <label className={styles.optionCheckbox}>
                  <input
                    type='checkbox'
                    checked={judgementsEnabled}
                    onChange={() => {
                      setJudgementsEnabled((prev) => !prev)
                    }}
                  />
                  <span>판정 표시</span>
                </label>
                <label className={styles.optionCheckbox}>
                  <input
                    type='checkbox'
                    checked={showGuide}
                    onChange={() => {
                      setShowGuide((prev) => !prev)
                    }}
                  />
                  <span>키 가이드 표시</span>
                </label>
                <label className={styles.optionCheckbox}>
                  <input
                    type='checkbox'
                    checked={metronomeEnabled}
                    onChange={() => {
                      setMetronomeEnabled((prev) => !prev)
                    }}
                  />
                  <span>메트로놈</span>
                </label>
                <label className={styles.optionCheckbox}>
                  <input
                    type='checkbox'
                    checked={hitSoundEnabled}
                    onChange={() => {
                      setHitSoundEnabled((prev) => !prev)
                    }}
                  />
                  <span>타격음</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* 중앙 - 게임 영역 */}
        <div className={styles.centerPanel}>
          <div
            ref={gameAreaRef}
            className={styles.gameArea}
            style={{
              width: `${laneCount * LANE_WIDTH}px`,
            }}
          >
            {renderLanes()}

            <div
              className={styles.judgementLine}
              style={{
                top: `${judgementLineY}px`,
              }}
            />

            {renderNotes()}

            {renderJudgement()}

            {renderCombo()}
          </div>
        </div>

        {/* 오른쪽 패널 - 키 가이드 */}
        {showGuide && (
          <div className={styles.rightPanel}>
            <div className={styles.keyGuidePanel}>
              <div className={styles.keyGuideHeader}>
                <Icon icon='material-symbols:keyboard' className={styles.keyIcon} />
                <h3>플레이 방법</h3>
              </div>
              <div className={styles.keyBindings}>
                <div className={styles.keySection}>
                  <h4>일반 노트</h4>
                  <div className={styles.keyList}>
                    {(KEY_MAPS[keyMode] || []).map((key, index) => (
                      <div key={index} className={styles.keyBox}>
                        <span>{key.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.keySection}>
                  <h4>FX 노트</h4>
                  <div className={styles.keyList}>
                    <div className={styles.keyBox}>
                      <span>{SPECIAL_KEYS.fx_left.toUpperCase()}</span>
                    </div>
                    <div className={styles.keyBox}>
                      <span>{SPECIAL_KEYS.fx_right}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.keySection}>
                  <h4>LR 노트</h4>
                  <div className={styles.keyList}>
                    <div className={styles.keyBox}>
                      <span>{SPECIAL_KEYS.lr_left.toUpperCase()}</span>
                    </div>
                    <div className={styles.keyBox}>
                      <span>{SPECIAL_KEYS.lr_right}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.keySection}>
                  <h4>Enter 노트</h4>
                  <div className={styles.keyList}>
                    <div className={styles.keyBox}>
                      <span>ENTER</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.judgementGuide}>
              <h4>판정 기준</h4>
              <div className={styles.judgementList}>
                <div className={`${styles.judgementItem} ${styles.perfectColor}`}>
                  <span>PERFECT</span>
                  <span>±{JUDGEMENT.PERFECT}ms</span>
                </div>
                <div className={`${styles.judgementItem} ${styles.greatColor}`}>
                  <span>GREAT</span>
                  <span>±{JUDGEMENT.GREAT}ms</span>
                </div>
                <div className={`${styles.judgementItem} ${styles.goodColor}`}>
                  <span>GOOD</span>
                  <span>±{JUDGEMENT.GOOD}ms</span>
                </div>
                <div className={`${styles.judgementItem} ${styles.badColor}`}>
                  <span>BAD</span>
                  <span>±{JUDGEMENT.BAD}ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackPlayer
