import React, { useEffect, useRef, useState } from 'react'
import { KeyMode, Note, TrackPlayerProps } from '../../../types/games/TrackMaker'
import styles from './TrackPlayer.module.css'

const KEY_MAPS = {
  '4k': ['d', 'f', 'j', 'k'],
  '5k': ['d', 'f', 'space', 'j', 'k'],
  '6k': ['s', 'd', 'f', 'j', 'k', 'l'],
  '8k': ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
}

const SPECIAL_KEYS = {
  fx_left: 'z',
  fx_right: '/',
  lr_left: 'x',
  lr_right: '.',
  enter: 'enter',
}

type KeyState = {
  [key: string]: boolean
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

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const visibleNotesRef = useRef<Note[]>([])
  const pressedNotesRef = useRef<Set<string>>(new Set())
  const laneCount = getLaneCount(keyMode)

  // 게임판 크기
  const LANE_WIDTH = 60
  const GAME_HEIGHT = 600
  const NOTE_HEIGHT = 20
  const JUDGEMENT_LINE_Y = GAME_HEIGHT - 100

  // 판정 범위 (ms)
  const JUDGEMENT = {
    PERFECT: 50,
    GREAT: 100,
    GOOD: 150,
    BAD: 200,
  }

  // 게임 시작
  const startGame = () => {
    setIsPlaying(true)
    setCurrentTime(0)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    pressedNotesRef.current.clear()
    visibleNotesRef.current = [...pattern].sort((a, b) => a.time - b.time)
    startTimeRef.current = performance.now()

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    updateGame()
  }

  // 게임 종료
  const stopGame = () => {
    setIsPlaying(false)
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

    // 게임 종료 조건 체크
    if (visibleNotesRef.current.length === 0 && pressedNotesRef.current.size === 0) {
      stopGame()
      return
    }

    animationRef.current = requestAnimationFrame(updateGame)
  }

  // 키 입력 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return

      // 키 상태 업데이트
      setKeyState((prev) => ({ ...prev, [e.key.toLowerCase()]: true }))

      // 노트 판정
      const keyTime = performance.now() - startTimeRef.current
      checkNoteHit(e.key.toLowerCase(), keyTime)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // 키 상태 업데이트
      setKeyState((prev) => ({ ...prev, [e.key.toLowerCase()]: false }))

      // 롱노트 처리
      checkLongNoteRelease(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying])

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

    // 해당 레인 및 타입에 맞는 노트 찾기
    const targetNotes = visibleNotesRef.current.filter((note) => {
      if (note.type !== noteType) return false

      if (noteType === 'normal') {
        return note.lane === laneIndex
      } else if (noteType === 'fx' || noteType === 'lr') {
        return note.lane === laneIndex
      } else if (noteType === 'enter') {
        return true // Enter 키는 레인 무관
      }

      return false
    })

    if (targetNotes.length === 0) {
      // 노트 없는 키 입력 (미스)
      updateScore('MISS')
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
      // 롱노트 시작 또는 일반 노트 처리
      if (closestNote.isLong) {
        pressedNotesRef.current.add(closestNote.id)
      } else {
        // 일반 노트는 바로 제거
        visibleNotesRef.current = visibleNotesRef.current.filter(
          (note) => note.id !== closestNote.id,
        )
      }

      // 점수 및 콤보 업데이트
      if (timeDiff <= JUDGEMENT.PERFECT) {
        updateScore('PERFECT')
      } else if (timeDiff <= JUDGEMENT.GREAT) {
        updateScore('GREAT')
      } else if (timeDiff <= JUDGEMENT.GOOD) {
        updateScore('GOOD')
      } else {
        updateScore('BAD')
      }
    } else {
      // 판정 범위 밖 (미스)
      updateScore('MISS')
    }
  }

  // 롱노트 키 뗌 처리
  const checkLongNoteRelease = (key: string) => {
    // 롱노트 중인지 확인
    const longNote = visibleNotesRef.current.find((note) => pressedNotesRef.current.has(note.id))

    if (!longNote) return

    // 롱노트 종료 시간 체크
    const keyTime = performance.now() - startTimeRef.current
    const shouldEndTime = longNote.endTime || longNote.time

    if (keyTime >= shouldEndTime - JUDGEMENT.BAD) {
      // 정상 종료 (판정 범위 내)
      visibleNotesRef.current = visibleNotesRef.current.filter((note) => note.id !== longNote.id)
      pressedNotesRef.current.delete(longNote.id)

      const timeDiff = Math.abs(shouldEndTime - keyTime)

      if (timeDiff <= JUDGEMENT.PERFECT) {
        updateScore('PERFECT')
      } else if (timeDiff <= JUDGEMENT.GREAT) {
        updateScore('GREAT')
      } else if (timeDiff <= JUDGEMENT.GOOD) {
        updateScore('GOOD')
      } else {
        updateScore('BAD')
      }
    } else {
      // 일찍 뗌 (미스)
      visibleNotesRef.current = visibleNotesRef.current.filter((note) => note.id !== longNote.id)
      pressedNotesRef.current.delete(longNote.id)
      updateScore('MISS')
    }
  }

  // 점수 및 콤보 업데이트
  const updateScore = (judgement: 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS') => {
    let scoreAdd = 0

    switch (judgement) {
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
    setMaxCombo((prev) => Math.max(prev, combo + 1))
  }

  // 노트 렌더링
  const renderNotes = () => {
    if (!isPlaying || !gameAreaRef.current) return null

    const gameWidth = laneCount * LANE_WIDTH

    // 현재 화면에 표시할 노트만 필터링
    const notesInView = visibleNotesRef.current.filter((note) => {
      const noteY = calculateNoteY(note.time)
      // 롱노트의 경우 endTime도 고려
      if (note.isLong && note.endTime) {
        const endY = calculateNoteY(note.endTime)
        return (
          (endY > -NOTE_HEIGHT && noteY < GAME_HEIGHT) ||
          (endY < GAME_HEIGHT && noteY > -NOTE_HEIGHT)
        )
      }
      return noteY > -NOTE_HEIGHT && noteY < GAME_HEIGHT
    })

    return notesInView.map((note) => {
      const noteY = calculateNoteY(note.time)
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

      // 롱노트 높이 계산
      let noteHeight = NOTE_HEIGHT
      if (note.isLong && note.endTime) {
        const endY = calculateNoteY(note.endTime)
        noteHeight = Math.max(20, Math.abs(noteY - endY)) // 최소 높이 20px 보장
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

  // 레인 렌더링
  const renderLanes = () => {
    if (!gameAreaRef.current) return null

    const lanes = []

    for (let i = 0; i < laneCount; i++) {
      const isPressed = keyState[KEY_MAPS[keyMode][i]]

      lanes.push(
        <div
          key={`lane-${i}`}
          className={`${styles.lane} ${isPressed ? styles.pressedLane : ''}`}
          style={{
            left: `${i * LANE_WIDTH}px`,
            width: `${LANE_WIDTH}px`,
          }}
        />,
      )
    }

    return lanes
  }

  // 노트 Y 좌표 계산 (시간 -> 픽셀)
  const calculateNoteY = (noteTime: number) => {
    const timeOffset = noteTime - currentTime
    // 노트가 아래에서 위로 올라오므로 판정선을 기준으로 계산
    // 스크롤 속도 조정을 위해 0.3 계수 사용 (값이 클수록 빠름)
    const scrollSpeed = 0.3
    return JUDGEMENT_LINE_Y - timeOffset * scrollSpeed
  }

  return (
    <div className={styles.playerContainer}>
      <div className={styles.gameInfo}>
        <div className={styles.scoreDisplay}>
          <div>점수: {score}</div>
          <div>콤보: {combo}</div>
          <div>최대 콤보: {maxCombo}</div>
        </div>

        <div className={styles.controls}>
          {!isPlaying ? (
            <button className={styles.startButton} onClick={startGame}>
              시작하기
            </button>
          ) : (
            <button className={styles.stopButton} onClick={stopGame}>
              중지하기
            </button>
          )}
        </div>
      </div>

      <div
        ref={gameAreaRef}
        className={styles.gameArea}
        style={{ width: `${laneCount * LANE_WIDTH}px` }}
      >
        {/* 레인 */}
        {renderLanes()}

        {/* 판정 라인 */}
        <div
          className={styles.judgementLine}
          style={{
            top: `${JUDGEMENT_LINE_Y}px`,
            width: `${laneCount * LANE_WIDTH}px`,
          }}
        />

        {/* 노트 */}
        {renderNotes()}
      </div>

      <div className={styles.keyGuide}>
        {/* 키 가이드 */}
        <div>
          <h4>키 가이드</h4>
          <p>일반 노트: {KEY_MAPS[keyMode].join(', ')}</p>
          <p>
            FX 노트: {SPECIAL_KEYS.fx_left}, {SPECIAL_KEYS.fx_right}
          </p>
          <p>
            LR 노트: {SPECIAL_KEYS.lr_left}, {SPECIAL_KEYS.lr_right}
          </p>
          <p>Enter 노트: {SPECIAL_KEYS.enter}</p>
        </div>
      </div>
    </div>
  )
}

export default TrackPlayer
