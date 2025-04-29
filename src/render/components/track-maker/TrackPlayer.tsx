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

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const visibleNotesRef = useRef<Note[]>([])
  const pressedNotesRef = useRef<Set<string>>(new Set())
  const laneCount = getLaneCount(keyMode)

  // 테마 상태 가져오기
  const theme = useSelector((state: RootState) => state.ui.theme)

  // 판정 애니메이션 지속 시간
  const JUDGEMENT_DISPLAY_DURATION = 500 // ms

  // 게임판 크기
  const LANE_WIDTH = 60
  const GAME_HEIGHT = 800 // 높이 증가
  const NOTE_HEIGHT = 20
  const JUDGEMENT_LINE_Y = GAME_HEIGHT - 100

  // 첫 노트 지연 시간
  const INITIAL_DELAY = 3000 // 3초

  // 미리 보이는 노트 시간 범위 (ms)
  const VISIBLE_NOTE_RANGE = 4000 // 노트가 미리 보이기 시작하는 시간

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
    setCurrentJudgement(null)
    setJudgementsEnabled(true)
    pressedNotesRef.current.clear()

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

    // 게임 종료 조건 체크
    if (visibleNotesRef.current.length === 0 && pressedNotesRef.current.size === 0) {
      stopGame()
      return
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

    // 해당 레인 및 타입에 맞는 노트 찾기
    const targetNotes = visibleNotesRef.current.filter((note) => {
      if (note.type !== noteType) return false

      if (noteType === 'normal') {
        return note.lane === laneIndex
      } else if (noteType === 'fx' || noteType === 'lr') {
        return note.lane === laneIndex
      } else if (noteType === 'enter') {
        return true
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
  const updateScore = (judgementText: 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS') => {
    let scoreAdd = 0

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
    setMaxCombo((prev) => Math.max(prev, combo + 1))
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
        noteHeight = Math.max(20, Math.abs(noteY - endY))
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
            height: `${GAME_HEIGHT}px`, // 전체 높이 적용
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
              height: `${GAME_HEIGHT}px`, // 전체 높이 적용
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
          top: `${JUDGEMENT_LINE_Y - 30}px`,
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
      const timeOffset = noteTime - currentTime
      const pixelOffset = timeOffset * (scrollSpeed / 1000)

      // 노트가 자연스럽게 등장하도록 처리
      if (timeOffset > VISIBLE_NOTE_RANGE) {
        // 범위 밖이면 화면 위쪽(음수 위치)에 배치
        return -NOTE_HEIGHT
      }

      // 판정선 기준으로 위치 계산
      return JUDGEMENT_LINE_Y - pixelOffset
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
        <div className={styles.leftPanel}>
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
                      setJudgementsEnabled(!judgementsEnabled)
                    }}
                  />
                  <span>판정 표시</span>
                </label>
                <label className={styles.optionCheckbox}>
                  <input
                    type='checkbox'
                    checked={showGuide}
                    onChange={() => {
                      setShowGuide(!showGuide)
                    }}
                  />
                  <span>키 가이드 표시</span>
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
              height: `${GAME_HEIGHT}px`, // 전체 높이 적용
            }}
          >
            {renderLanes()}

            <div
              className={styles.judgementLine}
              style={{
                top: `${JUDGEMENT_LINE_Y}px`,
                width: `${laneCount * LANE_WIDTH}px`,
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
