import { RootState } from '@render/store'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'
import { KeyMode, Note, NoteType, TrackMakerProps } from '../../../types/games/TrackMaker'
import styles from './TrackMaker.module.css'

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

const BEAT_DIVISIONS = [8, 16, 24, 32, 48, 64]

const TrackMaker: React.FC<TrackMakerProps> = ({
  pattern,
  onPatternChange,
  bpm,
  onBpmChange,
  keyMode,
  onKeyModeChange,
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>('normal')
  const [isLongNote, setIsLongNote] = useState<boolean>(false)
  const [zoom, setZoom] = useState<number>(1) // 줌 레벨
  const [startLongNote, setStartLongNote] = useState<Note | null>(null)
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null)
  const [activeDivision, setActiveDivision] = useState<number>(16) // 기본 16비트
  const [draggedNote, setDraggedNote] = useState<{
    noteId: string
    startY: number
    isResizing: boolean
  } | null>(null)
  const [songLength, setSongLength] = useState<number>(120000) // 기본 2분 (밀리초)
  const [isCtrlPressed, setIsCtrlPressed] = useState<boolean>(false)
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState<{
    x: number
    y: number
    time: number
    beat: string
  } | null>(null)

  // 히스토리 및 실행 취소/다시 실행 상태
  const [history, setHistory] = useState<Note[][]>([]) // 패턴 히스토리
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1) // 현재 히스토리 인덱스
  const [isUndoRedo, setIsUndoRedo] = useState<boolean>(false) // 실행 취소/다시 실행 중인지 여부

  const editorRef = useRef<HTMLDivElement>(null)
  const laneCount = getLaneCount(keyMode)

  // 에디터 높이를 곡 길이와 줌 레벨에 따라 동적으로 계산
  const getEditorHeight = () => {
    const baseHeight = songLength * (zoom * 0.1) + 500 // 추가 여백 500px
    return Math.max(5000, baseHeight) // 최소 높이 보장
  }

  // 에디터 높이
  const EDITOR_HEIGHT = getEditorHeight()

  // BPM에 따른 그리드 계산 - 비트 구분 적용
  const getGridSizeMs = (division: number) => {
    // 한 마디는 4비트, division은 한 마디를 몇 등분할지 결정
    return ((60000 / bpm) * 4) / division
  }

  // 기본 그리드 크기 (16 비트 기준)
  const gridSizeMs = getGridSizeMs(activeDivision)

  // BPM 변경 시 노트 시간 재계산 및 에디터 높이 조정
  useEffect(() => {
    if (pattern.length > 0) {
      // 새 BPM 기준으로 모든 노트의 시간을 재조정
      const updatedPattern = pattern.map((note) => {
        // 원래 시간이 몇 비트에 해당하는지 계산
        const oldBeatPosition = (note.time / ((60000 / bpm) * 4)) * activeDivision
        // 동일한 비트 위치로 새 시간 계산
        const newTime = Math.round(oldBeatPosition) * getGridSizeMs(activeDivision)

        if (note.isLong && note.endTime) {
          const oldEndBeatPosition = (note.endTime / ((60000 / bpm) * 4)) * activeDivision
          const newEndTime = Math.round(oldEndBeatPosition) * getGridSizeMs(activeDivision)
          return { ...note, time: newTime, endTime: newEndTime }
        }

        return { ...note, time: newTime }
      })

      onPatternChange(updatedPattern)
    }
  }, [bpm])

  // 스크롤을 가장 하단으로 설정 또는 곡 길이 변경 시 스크롤 조정
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = EDITOR_HEIGHT
    }
  }, [EDITOR_HEIGHT])

  // 밀리초를 BPM 기반 박자로 변환
  const msToBeats = (ms: number): string => {
    const beatsPerMeasure = 4 // 한 마디는 4비트
    const totalBeats = ms / (60000 / bpm)
    const measures = Math.floor(totalBeats / beatsPerMeasure)
    const beats = Math.floor(totalBeats % beatsPerMeasure) + 1

    // 비트 내에서의 위치 (activeDivision 기준)
    const subdivision = Math.floor((totalBeats % 1) * activeDivision) + 1

    return `${measures + 1}:${beats}:${subdivision}/${activeDivision}`
  }

  // 히스토리 추가
  const addToHistory = (newPattern: Note[]) => {
    if (isUndoRedo) {
      setIsUndoRedo(false)
      return
    }

    // 현재 인덱스 이후의 히스토리는 제거
    const newHistory = history.slice(0, currentHistoryIndex + 1)

    // 새로운 패턴이 마지막 히스토리와 동일하지 않을 때만 추가
    const lastPattern = newHistory.length > 0 ? newHistory[newHistory.length - 1] : []
    if (JSON.stringify(lastPattern) !== JSON.stringify(newPattern)) {
      newHistory.push([...newPattern])
      setHistory(newHistory)
      setCurrentHistoryIndex(newHistory.length - 1)
    }
  }

  // 패턴 변경 함수 오버라이드 (히스토리 추가)
  const handlePatternChange = (newPattern: Note[]) => {
    onPatternChange(newPattern)
    addToHistory(newPattern)
  }

  // 실행 취소
  const undo = () => {
    if (currentHistoryIndex > 0) {
      setIsUndoRedo(true)
      const prevIndex = currentHistoryIndex - 1
      const prevPattern = history[prevIndex]
      onPatternChange([...prevPattern])
      setCurrentHistoryIndex(prevIndex)
    }
  }

  // 다시 실행
  const redo = () => {
    if (currentHistoryIndex < history.length - 1) {
      setIsUndoRedo(true)
      const nextIndex = currentHistoryIndex + 1
      const nextPattern = history[nextIndex]
      onPatternChange([...nextPattern])
      setCurrentHistoryIndex(nextIndex)
    }
  }

  // 초기 패턴 히스토리에 추가
  useEffect(() => {
    if (history.length === 0 && pattern.length > 0) {
      addToHistory([...pattern])
    }
  }, [])

  // Ctrl 및 Shift 키 이벤트 감지
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true)
      }
      if (e.key === 'Shift') {
        setIsShiftPressed(true)
      }

      // Ctrl+Z (실행 취소)
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undo()
      }

      // Ctrl+Y 또는 Ctrl+Shift+Z (다시 실행)
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        redo()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false)
      }
      if (e.key === 'Shift') {
        setIsShiftPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [history, currentHistoryIndex])

  // 에디터 마우스 이동 처리 (롱노트 및 위치 미리보기)
  const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current) return

    const rect = editorRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const scrollTop = editorRef.current.scrollTop

    // 뒤집힌 좌표계: 높을수록 작은 시간 (위에서 아래로)
    const y = EDITOR_HEIGHT - (e.clientY - rect.top + scrollTop)

    // 마우스 위치에 해당하는 시간 및 박자 계산
    const pixelsPerMs = zoom * 0.1
    const mouseTime = Math.round(y / pixelsPerMs)
    const mouseBeat = msToBeats(mouseTime)

    // 마우스 실제 스크린 위치 저장
    setMousePosition({
      x: e.clientX,
      y: e.clientY,
      time: mouseTime,
      beat: mouseBeat,
    })

    if (!isDragging) {
      setPreviewPosition({ x, y })
    }

    // 드래그 중인 경우
    if (draggedNote) {
      setIsDragging(true)
      const { noteId, startY, isResizing } = draggedNote
      const noteIndex = pattern.findIndex((note) => note.id === noteId)

      if (noteIndex !== -1) {
        const note = pattern[noteIndex]
        const pixelsPerMs = zoom * 0.1

        if (isResizing && note.isLong) {
          // 롱노트 크기 조절 모드
          const deltaY = y - startY
          const timeDelta = Math.round(deltaY / pixelsPerMs / gridSizeMs) * gridSizeMs

          // 최소 길이 보장 (1/4 비트)
          const minLength = getGridSizeMs(4)
          // note.time + timeDelta가 음수가 될 수 있으므로, 롱노트 끝시간이 최소한 시작시간 + 최소길이가 되도록 함
          const newEndTime = Math.max(note.time + minLength, note.time + timeDelta)

          const updatedNote = { ...note, endTime: newEndTime }
          const newPattern = [...pattern]
          newPattern[noteIndex] = updatedNote
          onPatternChange(newPattern)
        } else if (isCtrlPressed) {
          // 노트 이동 모드 (Ctrl 키 누름)
          const deltaY = y - startY
          const timeDelta = Math.round(deltaY / pixelsPerMs / gridSizeMs) * gridSizeMs

          // 레인 계산
          const laneWidth = rect.width / laneCount
          const newLane = Math.floor(x / laneWidth)

          // 노트 타입에 따라 레인 제한
          let finalLane = newLane
          if (note.type === 'fx' || note.type === 'lr') {
            finalLane = newLane >= laneCount / 2 ? 1 : 0 // FX, LR 노트는 좌/우로만 이동
          } else if (note.type === 'enter') {
            finalLane = 0 // Enter 노트는 레인 이동 X
          } else {
            finalLane = Math.min(Math.max(0, newLane), laneCount - 1) // normal 노트는 유효 레인 내에서만
          }

          // 새 시간 계산 (음수가 되지 않도록)
          const newTime = Math.max(0, note.time + timeDelta)

          // 노트 업데이트
          const updatedNote = {
            ...note,
            time: newTime,
            lane: finalLane,
          }

          // 롱노트인 경우 endTime도 같이 이동
          if (note.isLong && note.endTime) {
            const duration = note.endTime - note.time
            updatedNote.endTime = newTime + duration
          }

          const newPattern = [...pattern]
          newPattern[noteIndex] = updatedNote
          onPatternChange(newPattern)

          // 드래그 기준점 업데이트 (계속 이동하기 위해)
          setDraggedNote({ noteId, startY: y, isResizing })
        }
      }
    }
  }

  // 롱노트 드래그 시작
  const handleNoteDragStart = (
    e: React.MouseEvent,
    noteId: string,
    isResizing: boolean = false,
  ) => {
    e.stopPropagation()
    if (!editorRef.current) return

    const note = pattern.find((n) => n.id === noteId)
    if (!note) return

    // resizing이 아닌데 isLong이 아닌 경우도 드래그 허용 (Ctrl로 이동)
    if (!isResizing && !note.isLong && !isCtrlPressed) return

    // 현재 마우스 위치 (뒤집힌 좌표계)
    const rect = editorRef.current.getBoundingClientRect()
    const scrollTop = editorRef.current.scrollTop
    const y = EDITOR_HEIGHT - (e.clientY - rect.top + scrollTop)

    setDraggedNote({ noteId, startY: y, isResizing })
    setIsDragging(true)

    // 마우스 이벤트 설정
    document.addEventListener('mouseup', handleNoteDragEnd)
  }

  // 롱노트 드래그 종료
  const handleNoteDragEnd = () => {
    setDraggedNote(null)
    // 드래그 상태를 약간 지연시켜 종료 - 클릭 이벤트와 충돌 방지
    setTimeout(() => {
      setIsDragging(false)
    }, 50)
    document.removeEventListener('mouseup', handleNoteDragEnd)
  }

  // 에디터 마우스 떠남 처리
  const handleEditorMouseLeave = () => {
    setPreviewPosition(null)
    setMousePosition(null)
  }

  // 에디터 클릭시 노트 추가
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current || isDragging || isCtrlPressed) return

    const rect = editorRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    // 스크롤을 고려한 y 좌표 계산 (뒤집힌 좌표계)
    const scrollTop = editorRef.current.scrollTop
    const y = EDITOR_HEIGHT - (e.clientY - rect.top + scrollTop)

    // 레인 계산
    const laneWidth = rect.width / laneCount
    const lane = Math.floor(x / laneWidth)

    // 시간 계산 (y 좌표를 시간으로 변환)
    const pixelsPerMs = zoom * 0.1 // 확대/축소에 따른 픽셀당 밀리초
    const clickTime = Math.round(y / pixelsPerMs / gridSizeMs) * gridSizeMs

    // 디버그용 로그
    console.log('Click position:', { x, y, scrollTop, lane, clickTime })

    // 노트 유형에 따른 처리
    if (selectedNoteType === 'normal') {
      if (isLongNote) {
        // 롱노트 처리
        if (startLongNote === null) {
          // 롱노트 시작점 설정
          const newNote: Note = {
            id: uuidv4(),
            type: 'normal',
            lane,
            time: clickTime,
            isLong: true,
            endTime: clickTime + getGridSizeMs(4), // 기본 길이: 1/4 비트
          }
          handlePatternChange([...pattern, newNote])
        } else {
          // 롱노트 끝점 설정 - 이제 사용하지 않음 (드래그로 대체)
          setStartLongNote(null)
        }
      } else {
        // 일반 노트 추가
        const newNote: Note = {
          id: uuidv4(),
          type: 'normal',
          lane,
          time: clickTime,
          isLong: false,
        }
        handlePatternChange([...pattern, newNote])
      }
    } else if (selectedNoteType === 'fx') {
      // FX 노트 (좌/우 반으로 나눔)
      const isRight = lane >= laneCount / 2
      const newNote: Note = {
        id: uuidv4(),
        type: 'fx',
        lane: isRight ? 1 : 0, // 0: 왼쪽, 1: 오른쪽
        time: clickTime,
        isLong: isLongNote,
        endTime: isLongNote ? clickTime + getGridSizeMs(4) : undefined,
      }
      handlePatternChange([...pattern, newNote])
    } else if (selectedNoteType === 'lr') {
      // LR 노트 (좌/우 반으로 나눔)
      const isRight = lane >= laneCount / 2
      const newNote: Note = {
        id: uuidv4(),
        type: 'lr',
        lane: isRight ? 1 : 0, // 0: 왼쪽, 1: 오른쪽
        time: clickTime,
        isLong: isLongNote,
        endTime: isLongNote ? clickTime + getGridSizeMs(4) : undefined,
      }
      handlePatternChange([...pattern, newNote])
    } else if (selectedNoteType === 'enter') {
      // Enter 노트 (전체 레인)
      const newNote: Note = {
        id: uuidv4(),
        type: 'enter',
        lane: 0, // 전체 레인 사용
        time: clickTime,
        isLong: isLongNote,
        endTime: isLongNote ? clickTime + getGridSizeMs(4) : undefined,
      }
      handlePatternChange([...pattern, newNote])
    }
  }

  // 노트 삭제
  const handleNoteClick = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()
    if (isDragging) return

    // Shift 키를 누른 상태에서만 삭제
    if (isShiftPressed) {
      const newPattern = pattern.filter((note) => note.id !== noteId)
      handlePatternChange(newPattern)
    }
  }

  // 패턴 저장
  const handleSavePattern = () => {
    const patternData = JSON.stringify({
      notes: pattern,
      bpm,
      keyMode,
    })

    const blob = new Blob([patternData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `rhythm_pattern_${keyMode}_${bpm}bpm.json`
    a.click()
  }

  // 패턴 불러오기
  const handleLoadPattern = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        handlePatternChange(data.notes || [])
        onBpmChange(data.bpm || 120)
        onKeyModeChange(data.keyMode || '4k')
      } catch (error) {
        console.error('Invalid pattern file', error)
      }
    }
    reader.readAsText(file)
  }

  // 곡 길이 변경 이벤트 핸들러
  const handleSongLengthChange = (seconds: number) => {
    const newLength = seconds * 1000
    setSongLength(newLength)

    // 노트가 곡 길이를 넘어가는 경우 처리 (선택사항)
    const notesOutsideRange = pattern.filter(
      (note) => note.time > newLength || (note.isLong && note.endTime && note.endTime > newLength),
    )

    if (
      notesOutsideRange.length > 0 &&
      confirm('일부 노트가 새 곡 길이보다 깁니다. 해당 노트를 삭제할까요?')
    ) {
      onPatternChange(
        pattern.filter(
          (note) =>
            note.time <= newLength && (!note.isLong || !note.endTime || note.endTime <= newLength),
        ),
      )
    }
  }

  // 노트 렌더링
  const renderNotes = () => {
    if (!editorRef.current) return null

    const editorWidth = editorRef.current.clientWidth
    const laneWidth = editorWidth / laneCount
    const pixelsPerMs = zoom * 0.1

    return pattern.map((note) => {
      let left = 0
      let width = laneWidth

      // 노트 타입에 따른 위치와 너비 조정
      if (note.type === 'normal') {
        left = note.lane * laneWidth
      } else if (note.type === 'fx' || note.type === 'lr') {
        left = note.lane === 0 ? 0 : editorWidth / 2
        width = editorWidth / 2
      } else if (note.type === 'enter') {
        left = 0
        width = editorWidth
      }

      // 뒤집힌 좌표계에서 노트 위치 계산
      const top =
        EDITOR_HEIGHT -
        note.time * pixelsPerMs -
        (note.isLong && note.endTime ? (note.endTime - note.time) * pixelsPerMs : 20)
      const height = note.isLong && note.endTime ? (note.endTime - note.time) * pixelsPerMs : 20

      // 노트 타입에 따른 색상 스타일 클래스
      const noteTypeClass =
        note.type === 'fx'
          ? styles.fxNote
          : note.type === 'lr'
            ? styles.lrNote
            : note.type === 'enter'
              ? styles.enterNote
              : styles.normalNote

      // 커서 스타일 - Ctrl 키를 누르고 있으면 이동 커서로 변경
      const cursorStyle = isCtrlPressed ? 'move' : note.isLong ? 'ns-resize' : 'pointer'

      return (
        <div
          key={note.id}
          className={`${styles.note} ${noteTypeClass} ${note.isLong ? styles.longNote : ''}`}
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            cursor: cursorStyle,
          }}
          onClick={(e) => handleNoteClick(e, note.id)}
          onMouseDown={(e) => {
            if (note.isLong) {
              // 롱노트 하단 부분(리사이징 영역)인지 확인
              const rect = e.currentTarget.getBoundingClientRect()
              const clickY = e.clientY
              const bottomAreaY = rect.bottom - 20 // 하단 20px을 리사이징 영역으로 간주

              // Ctrl 키가 눌렸을 때는 항상 이동 모드가 우선
              if (isCtrlPressed) {
                // 이동 모드
                handleNoteDragStart(e, note.id, false)
              } else if (clickY > bottomAreaY) {
                // 리사이징 모드
                handleNoteDragStart(e, note.id, true)
              }
            } else if (isCtrlPressed) {
              // 일반 노트 이동 모드
              handleNoteDragStart(e, note.id, false)
            }
          }}
        >
          {note.isLong && <span className={styles.longNoteLabel}>LONG</span>}
          {isCtrlPressed && (
            <div className={styles.dragIndicator}>
              <span>↕</span>
            </div>
          )}
        </div>
      )
    })
  }

  // 미리보기 노트 렌더링
  const renderPreviewNote = () => {
    // Ctrl 키 또는 Shift 키를 누른 상태에서는 미리보기 노트를 표시하지 않음
    if (!previewPosition || !editorRef.current || isCtrlPressed || isShiftPressed) return null

    const editorWidth = editorRef.current.clientWidth
    const laneWidth = editorRef.current.clientWidth / laneCount
    const pixelsPerMs = zoom * 0.1

    // 레인과 시간 계산
    const lane = Math.floor(previewPosition.x / laneWidth)
    const clickTime = Math.round(previewPosition.y / pixelsPerMs / gridSizeMs) * gridSizeMs

    let left = 0
    let width = laneWidth

    // 노트 타입에 따른 위치와 너비 조정
    if (selectedNoteType === 'normal') {
      left = lane * laneWidth
    } else if (selectedNoteType === 'fx' || selectedNoteType === 'lr') {
      const isRight = lane >= laneCount / 2
      left = isRight ? editorWidth / 2 : 0
      width = editorWidth / 2
    } else if (selectedNoteType === 'enter') {
      left = 0
      width = editorWidth
    }

    // 뒤집힌 좌표계에서 미리보기 위치 계산
    const height = 20
    const top = EDITOR_HEIGHT - clickTime * pixelsPerMs - height

    // 노트 타입에 따른 스타일 클래스
    const noteTypeClass =
      selectedNoteType === 'fx'
        ? styles.fxNote
        : selectedNoteType === 'lr'
          ? styles.lrNote
          : selectedNoteType === 'enter'
            ? styles.enterNote
            : styles.normalNote

    return (
      <div
        className={`${styles.previewNote} ${noteTypeClass}`}
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {isLongNote && <span className={styles.longNoteLabel}>LONG</span>}
      </div>
    )
  }

  // 그리드 라인 렌더링
  const renderGridLines = () => {
    if (!editorRef.current) return null

    const editorWidth = editorRef.current.clientWidth
    const pixelsPerMs = zoom * 0.1

    const lines = []

    // 수직선 (레인 구분)
    for (let i = 1; i < laneCount; i++) {
      const left = (editorWidth / laneCount) * i
      lines.push(
        <div
          key={`v-${i}`}
          className={styles.verticalLine}
          style={{
            left: `${left}px`,
            height: `${EDITOR_HEIGHT}px`,
          }}
        />,
      )
    }

    // 수평선 (비트 구분)
    const measureMs = (60000 / bpm) * 4 // 한 마디 (4비트)

    // 마디 최대 표시 개수를 BPM과 곡 길이에 따라 조정
    const maxTime = Math.max(songLength, measureMs * 30) // 최소 30마디 또는 사용자 지정 길이

    // 먼저 모든 마디선(measure)을 명시적으로 추가
    for (let measure = 0; measure <= Math.ceil(maxTime / measureMs); measure++) {
      const time = measure * measureMs
      const linePosition = EDITOR_HEIGHT - time * pixelsPerMs

      lines.push(
        <div
          key={`measure-${measure}`}
          className={`${styles.horizontalLine} ${styles.measureLine}`}
          style={{
            top: `${linePosition}px`,
            width: `${editorWidth}px`,
          }}
        >
          <span className={styles.timeLabel}>{msToBeats(time)}</span>
        </div>,
      )
    }

    // 그 다음 일반 비트 분할 표시
    for (let time = 0; time <= maxTime; time += getGridSizeMs(activeDivision)) {
      // 이미 추가한 마디선은 건너뛰기
      if (Math.round((time * 1000) % Math.round(measureMs * 1000)) === 0) {
        continue
      }

      // 정확한 나머지 계산을 위해 정수 형태로 변환
      const scaledTime = Math.round(time * 1000)
      const scaledQuarterBeat = Math.round((measureMs / 4) * 1000)
      const scaledEighthBeat = Math.round((measureMs / 8) * 1000)

      // 정확한 나머지 계산
      const isQuarterBeat = scaledTime % scaledQuarterBeat === 0
      const isEighthBeat = scaledTime % scaledEighthBeat === 0

      // 뒤집힌 좌표계에서 그리드 라인 위치 계산
      const linePosition = EDITOR_HEIGHT - time * pixelsPerMs

      let lineClass = styles.horizontalLine
      if (isQuarterBeat) {
        lineClass = `${styles.horizontalLine} ${styles.quarterBeatLine}`
      } else if (isEighthBeat) {
        lineClass = `${styles.horizontalLine} ${styles.eighthBeatLine}`
      }

      lines.push(
        <div
          key={`h-${time}`}
          className={lineClass}
          style={{
            top: `${linePosition}px`,
            width: `${editorWidth}px`,
          }}
        />,
      )
    }

    return lines
  }

  // 마우스 툴팁 렌더링
  const renderMouseTooltip = () => {
    if (!mousePosition) return null

    return (
      <div
        className={`${styles.mouseTooltip} ${theme === 'dark' ? styles.darkTheme : ''}`}
        style={{
          left: `${mousePosition.x - 32}px`, // 마우스 오른쪽으로 약간 오프셋
          top: `${mousePosition.y - 64}px`,
        }}
      >
        <div className={styles.mouseTooltipTime}>{mousePosition.time}ms</div>
        <div className={styles.mouseTooltipBeat}>{mousePosition.beat}</div>
      </div>
    )
  }

  // 테마에 따른 스타일 클래스 가져오기
  const getThemeClass = (baseClass: string) => {
    return theme === 'dark' ? `${baseClass} ${styles.darkTheme}` : baseClass
  }

  return (
    <div className={getThemeClass(styles.editorContainer)}>
      <div className={getThemeClass(styles.sidebar)}>
        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2' htmlFor='bpmInput'>
            BPM
          </label>
          <input
            id='bpmInput'
            type='number'
            className='tw:block tw:w-full tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:py-2 tw:px-3 tw:focus:border-indigo-500 tw:focus:ring-indigo-500 dark:tw:bg-slate-700 dark:tw:border-slate-600 dark:tw:text-white'
            value={bpm.toString()}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            min={1}
            max={400}
          />
        </div>

        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2' htmlFor='songLengthInput'>
            곡 길이 (초)
          </label>
          <input
            id='songLengthInput'
            type='number'
            className='tw:block tw:w-full tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:py-2 tw:px-3 tw:focus:border-indigo-500 tw:focus:ring-indigo-500 dark:tw:bg-slate-700 dark:tw:border-slate-600 dark:tw:text-white'
            value={(songLength / 1000).toString()}
            onChange={(e) => handleSongLengthChange(Number(e.target.value))}
            min={10}
            max={600}
          />
        </div>

        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2'>키 모드</label>
          <select
            className='tw:block tw:w-full tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:py-2 tw:px-3 tw:focus:border-indigo-500 tw:focus:ring-indigo-500 dark:tw:bg-slate-700 dark:tw:border-slate-600 dark:tw:text-white'
            value={keyMode}
            onChange={(e) => onKeyModeChange(e.target.value as KeyMode)}
          >
            <option value='4k'>4K</option>
            <option value='5k'>5K</option>
            <option value='6k'>6K</option>
            <option value='8k'>8K</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2'>비트 분할</label>
          <div className='tw:grid tw:grid-cols-3 tw:gap-2'>
            {BEAT_DIVISIONS.map((division) => (
              <button
                key={division}
                className={`tw:px-3 tw:py-2 tw:text-sm tw:rounded-lg tw:transition-colors ${
                  activeDivision === division
                    ? 'tw:bg-indigo-600 tw:text-white dark:tw:bg-indigo-500'
                    : 'tw:bg-gray-100 tw:text-gray-700 hover:tw:bg-gray-200 dark:tw:bg-slate-700 dark:tw:text-slate-200 dark:hover:tw:bg-slate-600'
                }`}
                onClick={() => setActiveDivision(division)}
              >
                {division}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2'>노트 타입</label>
          <div className='tw:grid tw:grid-cols-2 tw:gap-2 tw:mb-2'>
            {(['normal', 'fx', 'lr', 'enter'] as const).map((type) => (
              <button
                key={type}
                className={`tw:px-3 tw:py-2 tw:text-sm tw:rounded-lg tw:transition-colors ${
                  selectedNoteType === type
                    ? 'tw:bg-indigo-600 tw:text-white dark:tw:bg-indigo-500'
                    : 'tw:bg-gray-100 tw:text-gray-700 hover:tw:bg-gray-200 dark:tw:bg-slate-700 dark:tw:text-slate-200 dark:hover:tw:bg-slate-600'
                }`}
                onClick={() => setSelectedNoteType(type)}
              >
                {type === 'normal' && '일반'}
                {type === 'fx' && 'FX'}
                {type === 'lr' && 'LR'}
                {type === 'enter' && 'Enter'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <div className='tw:flex tw:items-center tw:bg-gray-50 dark:tw:bg-slate-700 tw:rounded-lg tw:p-3'>
            <input
              id='longNote'
              type='checkbox'
              className='tw:h-4 tw:w-4 tw:rounded tw:border-gray-300 tw:text-indigo-600 tw:focus:ring-indigo-500 dark:tw:border-slate-600'
              checked={isLongNote}
              onChange={(e) => setIsLongNote(e.target.checked)}
            />
            <label
              htmlFor='longNote'
              className='tw:ml-2 tw:block tw:text-sm tw:font-medium tw:text-gray-700 dark:tw:text-slate-300'
            >
              롱노트 (드래그로 길이 조절)
            </label>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2'>줌</label>
          <input
            type='range'
            min='0.5'
            max='2'
            step='0.1'
            className='tw:w-full tw:h-2 tw:bg-gray-200 tw:rounded-lg tw:appearance-none tw:cursor-pointer dark:tw:bg-slate-700'
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>

        <div className={styles.controlGroup}>
          <div className='tw:flex tw:justify-between tw:gap-2'>
            <button
              onClick={undo}
              disabled={currentHistoryIndex <= 0}
              className={`tw:flex-1 tw:inline-flex tw:justify-center tw:items-center tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:px-2 tw:py-2 tw:bg-white tw:text-base tw:font-medium tw:text-gray-700 ${
                currentHistoryIndex > 0
                  ? 'tw:hover:bg-gray-50 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-indigo-500'
                  : 'tw:opacity-50 tw:cursor-not-allowed'
              } dark:tw:bg-slate-700 dark:tw:text-slate-200 dark:tw:border-slate-600 dark:tw:hover:bg-slate-600`}
            >
              실행 취소
            </button>

            <button
              onClick={redo}
              disabled={currentHistoryIndex >= history.length - 1}
              className={`tw:flex-1 tw:inline-flex tw:justify-center tw:items-center tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:px-2 tw:py-2 tw:bg-white tw:text-base tw:font-medium tw:text-gray-700 ${
                currentHistoryIndex < history.length - 1
                  ? 'tw:hover:bg-gray-50 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-indigo-500'
                  : 'tw:opacity-50 tw:cursor-not-allowed'
              } dark:tw:bg-slate-700 dark:tw:text-slate-200 dark:tw:border-slate-600 dark:tw:hover:bg-slate-600`}
            >
              다시 실행
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <button
            onClick={handleSavePattern}
            className='tw:w-full tw:inline-flex tw:justify-center tw:rounded-lg tw:border tw:border-transparent tw:shadow-sm tw:px-4 tw:py-2 tw:bg-indigo-600 tw:text-base tw:font-medium tw:text-white tw:hover:bg-indigo-700 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-indigo-500 dark:tw:bg-indigo-500 dark:tw:hover:bg-indigo-600'
          >
            패턴 저장
          </button>
          <input
            type='file'
            accept='.json'
            onChange={handleLoadPattern}
            className='tw:block tw:w-full tw:text-sm tw:text-gray-500 dark:tw:text-slate-400 tw:mt-2 tw:file:mr-4 tw:file:py-2 tw:file:px-4 tw:file:rounded-full tw:file:border-0 tw:file:text-sm tw:file:font-semibold tw:file:bg-indigo-50 tw:file:text-indigo-700 hover:tw:file:bg-indigo-100 dark:tw:file:bg-indigo-900 dark:tw:file:text-indigo-200'
          />
        </div>

        <div className={styles.controlGroup}>
          <button
            onClick={() => onPatternChange([])}
            className='tw:w-full tw:inline-flex tw:justify-center tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:px-4 tw:py-2 tw:bg-white tw:text-base tw:font-medium tw:text-gray-700 tw:hover:bg-gray-50 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-indigo-500 dark:tw:bg-slate-700 dark:tw:text-slate-200 dark:tw:border-slate-600 dark:tw:hover:bg-slate-600'
          >
            모두 지우기
          </button>
        </div>
      </div>

      <div className={getThemeClass(styles.editorMain)}>
        <div className={getThemeClass(styles.timeIndicator)}>
          {msToBeats(currentTime)} - {currentTime}ms
          {previewPosition && editorRef.current && (
            <span className={styles.previewInfo}>
              {' | '}위치: {Math.round(previewPosition.y / (zoom * 0.1))}ms
              {' | '}비트: {msToBeats(Math.round(previewPosition.y / (zoom * 0.1)))}
            </span>
          )}
        </div>
        <div
          ref={editorRef}
          className={getThemeClass(styles.editorGrid)}
          onClick={handleEditorClick}
          onMouseMove={handleEditorMouseMove}
          onMouseLeave={handleEditorMouseLeave}
          onScroll={(e) => {
            if (editorRef.current) {
              // 뒤집힌 좌표계에서 스크롤 위치 변환
              const invertedPosition = EDITOR_HEIGHT - editorRef.current.scrollTop
              setCurrentTime(invertedPosition / (zoom * 0.1))
            }
          }}
          style={{ height: '100%', overflowX: 'hidden' }}
        >
          <div
            className={styles.editorContent}
            style={{
              position: 'relative',
              width: '100%',
              height: `${EDITOR_HEIGHT}px`,
            }}
          >
            {renderGridLines()}
            {renderNotes()}
            {renderPreviewNote()}
          </div>
        </div>
      </div>

      {/* Ctrl 키 가이드 메시지 */}
      {isCtrlPressed && (
        <div className={`${styles.ctrlGuide} ${theme === 'dark' ? styles.darkTheme : ''}`}>
          이동 모드 - Ctrl 키를 눌러 노트를 드래그하여 이동할 수 있습니다
        </div>
      )}

      {/* Shift 키 가이드 메시지 */}
      {isShiftPressed && (
        <div className={`${styles.shiftGuide} ${theme === 'dark' ? styles.darkTheme : ''}`}>
          삭제 모드 - Shift 키를 누른 상태에서 노트를 클릭하여 삭제할 수 있습니다
        </div>
      )}

      {/* 마우스 위치 툴팁 */}
      {renderMouseTooltip()}
    </div>
  )
}

export default TrackMaker
