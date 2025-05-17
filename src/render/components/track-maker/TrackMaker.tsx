import { useAlert } from '@render/hooks/useAlert'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'
import type {
  KeyMode,
  Note,
  NoteType,
  TrackMakerProps,
} from '../../../types/track-maker/TrackMaker'
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
  const [zoom, setZoom] = useState<number>(2)
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null)
  const [activeDivision, setActiveDivision] = useState<number>(16)
  const [draggedNote, setDraggedNote] = useState<{
    noteId: string
    startY: number
    isResizing: boolean
  } | null>(null)
  const [songLength, setSongLength] = useState<number>(120000)
  const [isCtrlPressed, setIsCtrlPressed] = useState<boolean>(false)
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState<{
    x: number
    y: number
    time: number
    beat: string
  } | null>(null)
  const [hoveredNote, setHoveredNote] = useState<Note | null>(null)

  // 히스토리 및 실행 취소/다시 실행 상태
  const [history, setHistory] = useState<Note[][]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1)
  const [isUndoRedo, setIsUndoRedo] = useState<boolean>(false)

  // 초기 패턴 저장 상태
  const [initialPattern, setInitialPattern] = useState<Note[]>([])
  const [initialBpm, setInitialBpm] = useState<number>(bpm)
  const [initialKeyMode, setInitialKeyMode] = useState<KeyMode>(keyMode)

  const { showConfirm } = useAlert()

  const editorRef = useRef<HTMLDivElement>(null)
  const laneCount = getLaneCount(keyMode)

  // 파일 입력 참조 추가
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 기본 그리드 크기 (activeDivision 기준)
  const gridSizeMs = getGridSizeMs(activeDivision)

  // 시간을 가이드 그리드에 맞추는 함수 (노트 위치 결정에만 사용)
  // 이 함수는 오직 새 노트 생성 시 가이드에 맞추기 위해서만 사용해야 함
  const snapToGrid = (timeMs: number): number => {
    const beatDuration = getGridSizeMs(activeDivision)
    return Math.round(timeMs / beatDuration) * beatDuration
  }

  // 밀리초를 BPM 기반 비트로 변환 (개선됨)
  // 이 함수는 UI 표시 용도로만 사용 (노트 위치 결정에 사용하면 안 됨)
  const msToBeats = (ms: number): string => {
    const beatDuration = 60000 / bpm // 한 비트 길이
    const beatsPerMeasure = 4 // 한 마디는 4비트

    // 총 비트 수 계산
    const totalBeats = ms / beatDuration

    // 마디 번호 (1부터 시작)
    const measures = Math.floor(totalBeats / beatsPerMeasure) + 1

    // 마디 내 비트 번호 (1부터 시작)
    const beats = Math.floor(totalBeats % beatsPerMeasure) + 1

    // 비트 내 상대적 위치 계산
    const measureDuration = beatDuration * beatsPerMeasure
    const measurePosition = ms % measureDuration
    const beatPosition = measurePosition % beatDuration

    // 현재 비트 내에서의 상대적 위치를 activeDivision 기준으로 계산
    const divisionSize = beatDuration / (activeDivision / 4)
    const subdivisionIndex = Math.floor(beatPosition / divisionSize) + 1

    return `${measures}:${beats}:${subdivisionIndex}/${activeDivision / 4}`
  }

  useEffect(() => {
    if (pattern.length > 0) {
      createLog('debug', `BPM 변경됨: ${bpm}BPM`)
    }
  }, [bpm])

  // 가이드 분할 변경 시 효과
  useEffect(() => {
    createLog('debug', `가이드 분할 변경됨: ${activeDivision}분할`)
  }, [activeDivision])

  // 스크롤을 가장 하단으로 설정 또는 곡 길이 변경 시 스크롤 조정
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = EDITOR_HEIGHT
    }
  }, [EDITOR_HEIGHT])

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
    // 패턴이 비어있으면 호버 상태 초기화
    if (newPattern.length === 0) {
      setHoveredNote(null)
    }

    // 호버된 노트가 있고, 새 패턴에 해당 노트가 없는 경우 호버 상태 초기화
    if (hoveredNote && !newPattern.some((note) => note.id === hoveredNote.id)) {
      setHoveredNote(null)
    }

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

  // 에디터 마우스 이동 처리 (롱노트 및 위치 미리보기) 수정
  const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current) return

    const rect = editorRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const scrollTop = editorRef.current.scrollTop

    // 뒤집힌 좌표계: 높을수록 작은 시간 (위에서 아래로)
    const y = EDITOR_HEIGHT - (e.clientY - rect.top + scrollTop)

    // 마우스 위치에 해당하는 시간 및 비트 계산
    const pixelsPerMs = zoom * 0.1
    const rawTime = y / pixelsPerMs
    const mouseTime = snapToGrid(rawTime)
    const mouseBeat = msToBeats(mouseTime)

    // 마우스 실제 스크린 위치 저장
    setMousePosition({
      x: e.clientX,
      y: e.clientY,
      time: mouseTime,
      beat: mouseBeat,
    })

    // 드래그 중이 아닐 때만 미리보기 위치 업데이트
    if (!isDragging) {
      setPreviewPosition({ x, y })
    } else {
      // 드래그 중에는 미리보기 숨기기
      setPreviewPosition(null)
    }

    // 드래그 중인 경우
    if (draggedNote) {
      setIsDragging(true)
      const { noteId, isResizing } = draggedNote
      const noteIndex = pattern.findIndex((note) => note.id === noteId)

      if (noteIndex !== -1) {
        const note = pattern[noteIndex]

        // 클라이언트 좌표를 에디터 내부 좌표로 변환
        const editorY = EDITOR_HEIGHT - (e.clientY - rect.top + scrollTop)

        if (isResizing && note.isLong) {
          // 롱노트 크기 조절 모드
          // 최소 길이 설정 (현재 활성화된 비트 분할로 설정)
          const minLength = getGridSizeMs(activeDivision)

          // 롱노트의 새 끝 시간 계산 (그리드에 맞춤)
          const newEndTime = Math.max(note.time + minLength, snapToGrid(editorY / pixelsPerMs))

          // 변경된 길이가 너무 크지 않은지 검사 (최대 10초로 제한)
          const maxDuration = 10000 // 10초
          const finalEndTime = Math.min(note.time + maxDuration, newEndTime)

          // 노트 업데이트
          if (finalEndTime !== note.endTime) {
            const updatedNote = { ...note, endTime: finalEndTime }
            const newPattern = [...pattern]
            newPattern[noteIndex] = updatedNote
            onPatternChange(newPattern)
          }
        } else if (isCtrlPressed) {
          // 노트 이동 모드 (Ctrl 키 누름)
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

          // 새 시간 계산 (그리드에 맞춤, 음수가 되지 않도록)
          const newTime = Math.max(0, snapToGrid(editorY / pixelsPerMs))

          // 노트 업데이트
          const updatedNote = {
            ...note,
            time: newTime,
            lane: finalLane,
          }

          // 롱노트인 경우 endTime도 같이 이동 (상대적 길이 유지)
          if (note.isLong && note.endTime) {
            const duration = note.endTime - note.time
            updatedNote.endTime = newTime + duration
          }

          const newPattern = [...pattern]
          newPattern[noteIndex] = updatedNote
          onPatternChange(newPattern)
        }
      }
    }
  }

  // 롱노트 드래그 종료 함수 수정
  const handleNoteDragEnd = () => {
    createLog('debug', '노트 드래그 종료')

    const wasDragging = isDragging
    setDraggedNote(null)
    setIsDragging(false)

    // 드래그 중 선택 방지 해제
    document.body.style.userSelect = ''

    // 현재 상태를 히스토리에 추가
    if (!isUndoRedo) {
      addToHistory([...pattern])
    }

    // 이벤트 리스너 제거
    window.removeEventListener('mouseup', handleNoteDragEnd)

    // 드래그 종료 직후 클릭 이벤트를 방지하기 위한 플래그 설정
    if (wasDragging) {
      // 드래그 작업 후 클릭 이벤트가 발생하지 않도록 타임아웃 설정
      setTimeout(() => {
        setDraggedNote(null)
      }, 200)
    }
  }

  // 롱노트 크기 조절 관련 이벤트 핸들러 수정
  const handleResizeHandleMouseDown = (e: React.MouseEvent, noteId: string, note: Note) => {
    e.stopPropagation()
    e.preventDefault()

    // 이미 드래그 중이면 무시
    if (isDragging) return

    createLog('debug', `롱노트 크기 조절 시작: ${noteId}`)

    // 노트 드래그 시작 - 크기 조절 모드로 설정
    setHoveredNote(note)
    setIsDragging(true)
    setDraggedNote({
      noteId,
      startY: e.clientY,
      isResizing: true, // 크기 조절 모드로 설정
    })

    // mouseup 이벤트를 window에 추가하여 어디서든 마우스 버튼을 놓았을 때 드래그가 종료되도록 함
    window.addEventListener('mouseup', handleNoteDragEnd)

    // 드래그 중 선택 방지
    document.body.style.userSelect = 'none'
  }

  // 노트 드래그 시작 - 이벤트 핸들러 수정
  const handleNoteDragStart = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // 이미 드래그 중이면 무시
    if (isDragging) return

    // 현재 드래그 중인 노트 찾기
    const note = pattern.find((n) => n.id === noteId)
    if (!note) return

    createLog('debug', `노트 드래그 시작: ${noteId}`)

    setHoveredNote(note)
    setIsDragging(true)
    setDraggedNote({
      noteId,
      startY: e.clientY,
      isResizing: false,
    })

    // mouseup 이벤트를 window에 추가
    window.addEventListener('mouseup', handleNoteDragEnd)

    // 드래그 중 선택 방지
    document.body.style.userSelect = 'none'
  }

  // 에디터 마우스 떠남 처리
  const handleEditorMouseLeave = () => {
    setPreviewPosition(null)
    setMousePosition(null)
  }

  // 에디터 클릭시 노트 추가 - FX/LR 레인 계산 문제 수정
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current || isDragging || isCtrlPressed) return

    // 드래그 작업 직후에는 클릭 이벤트 무시
    if (draggedNote !== null) return

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
    const rawTime = y / pixelsPerMs

    // 정확한 그리드 위치에 맞추기
    const snappedTime = snapToGrid(rawTime)
    createLog('debug', `노트 생성: ${rawTime}ms → ${snappedTime}ms (가이드: ${activeDivision})`)

    // FX 및 LR 노트의 레인 위치 보정
    let finalLane = lane
    if (selectedNoteType === 'fx' || selectedNoteType === 'lr') {
      // 에디터를 정확히 절반으로 나누어 왼쪽/오른쪽 판정
      const isRight = lane >= laneCount / 2
      finalLane = isRight ? 1 : 0
    } else if (selectedNoteType === 'enter') {
      finalLane = 0
    }

    // 위치가 겹치는 노트 확인 (정확히 같은 시간, 같은 레인에 노트가 있는지)
    const existingNoteIndex = pattern.findIndex(
      (note) =>
        Math.abs(note.time - snappedTime) < 1 &&
        note.lane === finalLane &&
        note.type === selectedNoteType,
    )

    // 이미 같은 위치에 노트가 있으면 무시
    if (existingNoteIndex !== -1) {
      return
    }

    // 새 노트 객체 생성 (msToBeats는 표시용으로만 사용)
    const newNote: Note = {
      id: uuidv4(),
      time: snappedTime,
      lane: finalLane,
      type: selectedNoteType, // 선택된 노트 타입 사용
      isLong: isLongNote, // 롱노트 여부
    }

    // 롱노트인 경우 endTime 추가
    if (isLongNote) {
      // 기본 롱노트 길이를 현재 활성화된 그리드 사이즈에 맞게 설정
      newNote.endTime = snappedTime + gridSizeMs
    }

    // 패턴에 노트 추가
    handlePatternChange([...pattern, newNote])
  }

  // 노트 삭제
  const handleNoteClick = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()

    // 드래그 중에는 클릭 이벤트를 무시
    if (isDragging) return

    // Shift 키를 누른 상태에서만 삭제
    if (isShiftPressed) {
      createLog('debug', `노트 삭제 시도: ${noteId}`)

      // 패턴 길이 기록
      const oldPatternLength = pattern.length

      try {
        // 노트 삭제 직접 구현 (filter 대신 새 배열 생성)
        const newPattern = []
        for (const note of pattern) {
          if (note && typeof note === 'object' && 'id' in note && note.id !== noteId) {
            newPattern.push(note)
          } else {
            createLog('debug', `삭제할 노트 발견: ${note.id}`)
          }
        }

        // 실제로 노트가 제거되었는지 확인
        if (newPattern.length === oldPatternLength) {
          createLog('warn', `노트가 제거되지 않았습니다: ${noteId}`)
        } else {
          createLog('debug', `노트 삭제 성공: ${oldPatternLength} → ${newPattern.length}`)

          // 현재 호버된 노트가 삭제되는 노트라면 호버 상태 초기화
          if (hoveredNote && hoveredNote.id === noteId) {
            setHoveredNote(null)
          }

          onPatternChange(newPattern)
        }
      } catch (error) {
        createLog('error', `노트 삭제 중 오류 발생: ${error}`)
      }
    }
  }

  // 노트 마우스 다운 이벤트 처리 - 롱노트 처리 수정
  const handleNoteMouseDown = (e: React.MouseEvent, noteId: string, note: Note) => {
    // shift 키가 눌렸을 때는 삭제 모드 우선
    if (isShiftPressed) {
      handleNoteClick(e, noteId)
      return
    }

    // Ctrl 키가 눌려있으면 이동 모드 우선 (롱노트 여부와 관계없이)
    if (isCtrlPressed) {
      handleNoteDragStart(noteId, e)
      return
    }

    // 롱노트인 경우 크기 조절 모드로 전환 (Ctrl 키가 눌려있지 않을 때)
    if (note.isLong) {
      handleResizeHandleMouseDown(e, noteId, note)
      return
    }
  }

  // 노트 호버 시작
  const handleNoteMouseEnter = (e: React.MouseEvent, note: Note) => {
    if (isDragging) return
    setHoveredNote(note)
  }

  // 노트 호버 종료
  const handleNoteMouseLeave = () => {
    setHoveredNote(null)
  }

  // 패턴 저장
  const handleSavePattern = () => {
    const patternData = JSON.stringify({
      notes: pattern,
      bpm,
      keyMode,
      activeDivision, // 비트 분할 정보도 저장
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

        // 패턴에 저장된 비트 분할 정보가 있으면 적용 (하위 호환성 유지)
        if (data.activeDivision) {
          setActiveDivision(data.activeDivision)
        }

        // 노트 데이터 불러오기
        // 노트의 밀리초 위치는 절대 변경하지 않음
        const loadedNotes = data.notes || []
        createLog('debug', `패턴 불러옴 - 노트 위치는 정확히 유지됨: ${loadedNotes}`)

        onPatternChange(loadedNotes)
        onBpmChange(data.bpm || 120)
        onKeyModeChange(data.keyMode || '4B')
      } catch (error) {
        createLog('error', `Invalid pattern file: ${error}`)
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

    if (notesOutsideRange.length > 0) {
      showConfirm(
        '경고',
        '일부 노트가 새 곡 길이보다 깁니다. 해당 노트를 삭제할까요?',
        () => {
          onPatternChange(
            pattern.filter(
              (note) =>
                note.time <= newLength &&
                (!note.isLong || !note.endTime || note.endTime <= newLength),
            ),
          )
        },
        'warning',
        '삭제',
        '취소',
      )
    }
  }

  // 노트 렌더링 - 롱노트 핸들 이벤트 수정
  const renderNotes = () => {
    if (!editorRef.current) return null

    const editorWidth = editorRef.current.clientWidth
    const laneWidth = editorWidth / laneCount
    const pixelsPerMs = zoom * 0.1

    // 그리드 한 칸의 높이 계산 (일반 노트 높이로 사용)
    const gridHeight = getGridSizeMs(activeDivision) * pixelsPerMs

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
      // 노트 위치는 정확히 note.time 밀리초 위치에 그려짐 (그리드에 맞추지 않음)
      // 일반 노트의 경우 높이를 그리드 크기에 맞게 조정
      const noteHeight =
        note.isLong && note.endTime ? (note.endTime - note.time) * pixelsPerMs : gridHeight
      const top = EDITOR_HEIGHT - note.time * pixelsPerMs - noteHeight

      // 노트 타입에 따른 색상 스타일 클래스
      const noteTypeClass =
        note.type === 'fx'
          ? styles.fxNote
          : note.type === 'lr'
            ? styles.lrNote
            : note.type === 'enter'
              ? styles.enterNote
              : styles.normalNote

      // 드래그 중인 노트인지 확인
      const isDraggingThis = draggedNote && draggedNote.noteId === note.id

      // 커서 스타일 결정
      let cursorStyle = 'pointer'

      if (isDraggingThis) {
        // 드래그 중인 노트의 커서
        cursorStyle = draggedNote.isResizing ? 'ns-resize' : 'move'
      } else if (isCtrlPressed) {
        // Ctrl 키 누름 - 이동 모드
        cursorStyle = 'move'
      } else if (note.isLong) {
        // 롱노트는 기본적으로 크기 조절 커서
        cursorStyle = 'ns-resize'
      }

      return (
        <div
          key={note.id}
          className={`${styles.note} ${noteTypeClass} ${note.isLong ? styles.longNote : ''} ${isDraggingThis ? styles.dragging : ''}`}
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${noteHeight}px`,
            cursor: cursorStyle,
          }}
          onClick={(e) => {
            handleNoteClick(e, note.id)
          }}
          onMouseEnter={(e) => {
            handleNoteMouseEnter(e, note)
          }}
          onMouseLeave={handleNoteMouseLeave}
          onMouseDown={(e) => {
            handleNoteMouseDown(e, note.id, note)
          }}
        >
          {note.isLong && <span className={styles.longNoteLabel}>LONG</span>}
          {/* {isCtrlPressed && (
            <div className={styles.dragIndicator}>
              <span>↕</span>
            </div>
          )} */}
          {note.isLong && (
            <div
              className={styles.resizeHandle}
              style={{
                height: `${noteHeight / 16}px`,
              }}
              title='크기 조절'
            ></div>
          )}
        </div>
      )
    })
  }

  // 미리보기 노트 렌더링
  const renderPreviewNote = () => {
    // Ctrl 키 또는 Shift 키를 누른 상태이거나 노트 위에 호버 중인 경우, 또는 드래그 중일 때 미리보기 노트를 표시하지 않음
    if (
      !previewPosition ||
      !editorRef.current ||
      isCtrlPressed ||
      isShiftPressed ||
      hoveredNote ||
      isDragging
    )
      return null

    const editorWidth = editorRef.current.clientWidth
    const laneWidth = editorRef.current.clientWidth / laneCount
    const pixelsPerMs = zoom * 0.1

    // 그리드 한 칸의 높이 계산 (미리보기 노트 높이로 사용)
    const gridHeight = getGridSizeMs(activeDivision) * pixelsPerMs

    // 레인과 시간 계산
    const lane = Math.floor(previewPosition.x / laneWidth)
    const rawTime = previewPosition.y / pixelsPerMs
    const clickTime = snapToGrid(rawTime)

    let left = 0
    let width = laneWidth

    // 노트 타입에 따른 위치와 너비 조정
    if (selectedNoteType === 'normal') {
      left = lane * laneWidth
    } else if (selectedNoteType === 'fx' || selectedNoteType === 'lr') {
      const isRight = lane >= laneCount / 2
      left = isRight ? editorWidth / 2 : 0
      width = editorWidth / 2
    } else {
      left = 0
      width = editorWidth
    }

    // 뒤집힌 좌표계에서 미리보기 위치 계산 - 정확히 그리드 높이에 맞게 조정
    // 롱노트도 일반 노트와 동일하게 한 그리드 높이로 표시
    const height = gridHeight

    // 그리드에 정확히 맞추기 위해 top 위치 수정
    // clickTime은 이미 snapToGrid로 그리드에 맞춰진 시간
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
    const maxTime = Math.max(songLength, measureMs * 30) // 최소 30마디 또는 사용자 지정 길이

    // 모든 그리드 라인을 그리기 위한 계산
    const beatDurationMs = getGridSizeMs(activeDivision)

    // 가독성을 위해 변수 정의
    const quarterBeatMs = measureMs / 4 // 1/4 비트 (한 비트)
    const eighthBeatMs = measureMs / 8 // 1/8 비트

    // 부동 소수점 비교를 위한 함수
    const isCloseToMultiple = (value: number, divisor: number): boolean => {
      // 더 관대한 허용 오차 사용
      const epsilon = 0.1
      const remainder = value % divisor
      // 0에 가깝거나 divisor에 가까우면 true
      return remainder < epsilon || Math.abs(remainder - divisor) < epsilon
    }

    // 모든 비트 위치에 그리드 라인 추가
    for (let time = 0; time <= maxTime; time += beatDurationMs) {
      // 마디의 시작 위치인지 확인 (정확성 개선)
      const isMeasureStart = isCloseToMultiple(time, measureMs)

      // 비트의 시작 위치인지 확인 (1/4 비트)
      const isBeatStart = !isMeasureStart && isCloseToMultiple(time, quarterBeatMs)

      // 8분음표 위치 확인
      const isEighthBeat = !isMeasureStart && !isBeatStart && isCloseToMultiple(time, eighthBeatMs)

      // 뒤집힌 좌표계에서 그리드 라인 위치 계산
      const linePosition = EDITOR_HEIGHT - time * pixelsPerMs

      // 마디 시작 라인
      if (isMeasureStart) {
        const measureNumber = Math.round(time / measureMs) + 1
        lines.push(
          <div
            key={`measure-${time}`}
            className={`${styles.horizontalLine} ${styles.measureLine}`}
            style={{
              top: `${linePosition}px`,
              width: `${editorWidth}px`,
            }}
          >
            <span className={styles.timeLabel}>
              {measureNumber}:1:1/{activeDivision}
            </span>
          </div>,
        )
      }
      // 1/4 비트 라인 (비트 시작)
      else if (isBeatStart) {
        const measureIndex = Math.floor(time / measureMs)
        const beatIndex = Math.round((time % measureMs) / quarterBeatMs) + 1
        lines.push(
          <div
            key={`beat-${time}`}
            className={`${styles.horizontalLine} ${styles.quarterBeatLine}`}
            style={{
              top: `${linePosition}px`,
              width: `${editorWidth}px`,
            }}
          >
            <span className={styles.beatLabel}>
              {measureIndex + 1}:{beatIndex}
            </span>
          </div>,
        )
      }
      // 1/8 비트 라인
      else if (isEighthBeat) {
        lines.push(
          <div
            key={`eighth-${time}`}
            className={`${styles.horizontalLine} ${styles.eighthBeatLine}`}
            style={{
              top: `${linePosition}px`,
              width: `${editorWidth}px`,
            }}
          />,
        )
      }
      // 일반 그리드 라인
      else {
        lines.push(
          <div
            key={`grid-${time}`}
            className={styles.horizontalLine}
            style={{
              top: `${linePosition}px`,
              width: `${editorWidth}px`,
            }}
          />,
        )
      }
    }

    return lines
  }

  // 마우스 툴팁 렌더링
  const renderMouseTooltip = () => {
    // 노트 위에 마우스가 있을 때는 마우스 툴팁을 표시하지 않음
    if (!mousePosition || hoveredNote) return null

    // 현재 마우스 위치의 정확한 밀리초 표시
    const exactMs = mousePosition.time

    const currentBeat = msToBeats(exactMs)

    return (
      <div
        className={`${styles.mouseTooltip} ${theme === 'dark' ? styles.darkTheme : ''}`}
        style={{
          left: `${mousePosition.x + 32}px`, // 마우스 오른쪽으로 약간 오프셋
          top: `${mousePosition.y - 16}px`,
        }}
      >
        <div className={styles.mouseTooltipTime}>{currentBeat}</div>
        <div>위치: {exactMs.toFixed(0)}ms</div>
      </div>
    )
  }

  // 노트 정보 툴팁 렌더링
  const renderNoteTooltip = () => {
    if (!hoveredNote) return null

    // 노트 타입을 한글로 표시
    const typeText = {
      normal: '일반',
      fx: 'FX',
      lr: 'LR',
      enter: 'Enter',
    }[hoveredNote.type]

    // 롱노트인 경우 길이 계산
    const duration =
      hoveredNote.isLong && hoveredNote.endTime
        ? `길이: ${hoveredNote.endTime - hoveredNote.time}ms`
        : ''

    // 노트의 레인 위치
    const laneText = {
      normal: `레인: ${hoveredNote.lane + 1}`,
      fx: hoveredNote.lane === 0 ? 'FX: 왼쪽' : 'FX: 오른쪽',
      lr: hoveredNote.lane === 0 ? 'LR: 왼쪽' : 'LR: 오른쪽',
      enter: 'Enter',
    }[hoveredNote.type]

    // 노트가 현재 가이드 그리드에서 어느 위치에 있는지 계산 (단순 참고용)
    const noteBeatLabel = msToBeats(hoveredNote.time)

    return (
      <div
        className={`${styles.noteTooltip} ${theme === 'dark' ? styles.darkTheme : ''}`}
        style={{
          left: `${mousePosition?.x + 80}px`,
          top: `${mousePosition?.y - 16}px`,
        }}
      >
        <div>
          <strong>
            {typeText} {hoveredNote.isLong ? '롱' : ''}노트
          </strong>
        </div>
        <div>{laneText}</div>
        <div>비트: {noteBeatLabel}</div>
        {duration && <div>{duration}</div>}
        <div>
          <strong>위치: {hoveredNote.time.toFixed(0)}ms</strong>
        </div>
      </div>
    )
  }

  // 테마에 따른 스타일 클래스 가져오기
  const getThemeClass = (baseClass: string) => {
    return theme === 'dark' ? `${baseClass} ${styles.darkTheme}` : baseClass
  }

  // 초기 패턴 저장
  useEffect(() => {
    if (history.length === 0) {
      setInitialPattern([...pattern])
      setInitialBpm(bpm)
      setInitialKeyMode(keyMode)
    }
  }, [])

  // 패턴 초기화
  const resetPattern = () => {
    showConfirm(
      '경고',
      '정말로 패턴을 초기 상태로 되돌리시겠습니까? 모든 변경사항이 사라집니다.',
      () => {
        onPatternChange([...initialPattern])
        onBpmChange(initialBpm)
        onKeyModeChange(initialKeyMode)
        setActiveDivision(16)

        // 파일 입력 필드 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // 히스토리 초기화
        const newHistory = [[...initialPattern]]
        setHistory(newHistory)
        setCurrentHistoryIndex(0)
      },
      'warning',
      '초기화',
      '취소',
    )
  }

  // componentDidMount와 componentWillUnmount에 해당하는 효과 추가
  useEffect(() => {
    // 전역 마우스업 이벤트 핸들러 추가
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleNoteDragEnd()
      }
    }

    // 전역 이벤트 리스너 등록
    window.addEventListener('mouseup', handleGlobalMouseUp)

    // 컴포넌트가 언마운트될 때 모든 이벤트 리스너 제거
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('mouseup', handleNoteDragEnd)
    }
  }, [isDragging])

  return (
    <div className={getThemeClass(styles.editorContainer)}>
      <div className={`${getThemeClass(styles.sidebar)} tw:custom-scrollbar`}>
        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2' htmlFor='bpmInput'>
            BPM
          </label>
          <input
            id='bpmInput'
            type='number'
            className='tw:block tw:w-full tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:py-2 tw:px-3 tw:focus:border-indigo-500 tw:focus:ring-indigo-500 tw:dark:bg-slate-700 tw:dark:border-slate-600 tw:dark:text-white'
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
            className='tw:block tw:w-full tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:py-2 tw:px-3 tw:focus:border-indigo-500 tw:focus:ring-indigo-500 tw:dark:bg-slate-700 tw:dark:border-slate-600 tw:dark:text-white'
            value={(songLength / 1000).toString()}
            onChange={(e) => {
              handleSongLengthChange(Number(e.target.value))
            }}
            min={10}
            max={600}
          />
        </div>

        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2'>키 모드</label>
          <select
            className='tw:block tw:w-full tw:rounded-lg tw:border tw:border-gray-300 tw:shadow-sm tw:py-2 tw:px-3 tw:focus:border-indigo-500 tw:focus:ring-indigo-500 tw:dark:bg-slate-700 tw:dark:border-slate-600 tw:dark:text-white'
            value={keyMode}
            onChange={(e) => onKeyModeChange(e.target.value as KeyMode)}
          >
            <option value='4B'>4B</option>
            <option value='5B'>5B</option>
            <option value='6B'>6B</option>
            <option value='8B'>8B</option>
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
                    ? 'tw:bg-indigo-600 tw:text-white tw:dark:bg-indigo-500'
                    : 'tw:bg-gray-100 tw:text-gray-700 tw:hover:bg-gray-200 tw:dark:bg-slate-700 tw:dark:text-slate-200 dark:tw:hover:bg-slate-600'
                }`}
                onClick={() => {
                  setActiveDivision(division)
                }}
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
                    ? 'tw:bg-indigo-600 tw:text-white tw:dark:bg-indigo-500'
                    : 'tw:bg-gray-100 tw:text-gray-700 tw:hover:bg-gray-200 tw:dark:bg-slate-700 tw:dark:text-slate-200 dark:tw:hover:bg-slate-600'
                }`}
                onClick={() => {
                  setSelectedNoteType(type)
                }}
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
          <div className='tw:flex tw:items-center tw:bg-gray-50 tw:dark:bg-slate-700 tw:rounded-lg tw:p-3'>
            <input
              id='longNote'
              type='checkbox'
              className='tw:h-4 tw:w-4 tw:rounded tw:border-gray-300 tw:text-indigo-600 tw:focus:ring-indigo-500 tw:dark:border-slate-600'
              checked={isLongNote}
              onChange={(e) => {
                setIsLongNote(e.target.checked)
              }}
            />
            <label
              htmlFor='longNote'
              className='tw:ml-2 tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:dark:text-slate-300'
            >
              롱노트 (드래그로 길이 조절)
            </label>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className='tw:block tw:text-sm tw:font-medium tw:mb-2'>
            줌({zoom.toFixed(1)}x)
          </label>
          <input
            type='range'
            min='0.5'
            max='10'
            step='0.1'
            className='tw:w-full tw:h-2 tw:bg-gray-200 tw:rounded-lg tw:appearance-none tw:cursor-pointer tw:dark:bg-slate-700'
            value={zoom}
            onChange={(e) => {
              setZoom(Number(e.target.value))
            }}
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
              } tw:dark:bg-slate-700 tw:dark:text-slate-200 tw:dark:border-slate-600 tw:dark:hover:bg-slate-600`}
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
              } tw:dark:bg-slate-700 tw:dark:text-slate-200 tw:dark:border-slate-600 tw:dark:hover:bg-slate-600`}
            >
              다시 실행
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <button
            onClick={handleSavePattern}
            className='tw:w-full tw:inline-flex tw:justify-center tw:rounded-lg tw:border tw:border-transparent tw:shadow-sm tw:px-4 tw:py-2 tw:bg-indigo-600 tw:text-base tw:font-medium tw:text-white tw:hover:bg-indigo-700 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-indigo-500 tw:dark:bg-indigo-500 tw:dark:hover:bg-indigo-600'
          >
            패턴 저장
          </button>
          <input
            type='file'
            accept='.json'
            ref={fileInputRef}
            onChange={handleLoadPattern}
            className='tw:block tw:w-full tw:text-sm tw:text-gray-500 tw:dark:text-slate-400 tw:mt-2 tw:file:mr-4 tw:file:py-2 tw:file:px-4 tw:file:rounded-full tw:file:border-0 tw:file:text-sm tw:file:font-semibold tw:file:bg-indigo-50 tw:file:text-indigo-700 tw:hover:file:bg-indigo-100 tw:dark:file:bg-indigo-900 tw:dark:file:text-indigo-200'
          />
        </div>

        <div className={styles.controlGroup}>
          <div className='tw:grid tw:grid-cols-2 tw:gap-2'>
            <button
              onClick={resetPattern}
              className='tw:w-full tw:inline-flex tw:justify-center tw:rounded-lg tw:border tw:border-yellow-500 tw:shadow-sm tw:px-4 tw:py-2 tw:bg-yellow-50 tw:text-base tw:font-medium tw:text-yellow-700 tw:hover:bg-yellow-100 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-yellow-500 tw:dark:bg-yellow-900 tw:dark:text-yellow-200 tw:dark:border-yellow-800 tw:dark:hover:bg-yellow-800'
            >
              초기화
            </button>

            <button
              onClick={() => onPatternChange([])}
              className='tw:w-full tw:inline-flex tw:justify-center tw:rounded-lg tw:border tw:border-red-500 tw:shadow-sm tw:px-4 tw:py-2 tw:bg-red-50 tw:text-base tw:font-medium tw:text-red-700 tw:hover:bg-red-50 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-red-500 tw:dark:bg-slate-700 tw:dark:text-slate-200 tw:dark:border-slate-600 tw:dark:hover:bg-slate-600'
            >
              모두 지우기
            </button>
          </div>
        </div>
      </div>

      <div className={getThemeClass(styles.editorMain)}>
        <div
          ref={editorRef}
          className={`${getThemeClass(styles.editorGrid)} tw:custom-scrollbar`}
          onClick={handleEditorClick}
          onMouseMove={handleEditorMouseMove}
          onMouseLeave={handleEditorMouseLeave}
          onScroll={() => {
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
            {renderNotes()}
            {renderPreviewNote()}
            {renderGridLines()}
          </div>
        </div>
        <div className={getThemeClass(styles.timeIndicator)}>
          {previewPosition && editorRef.current ? (
            <span className={styles.previewInfo}>
              {msToBeats(currentTime)} - {currentTime.toFixed(0)}ms
              {' | '}비트: {msToBeats(Math.round(previewPosition.y / (zoom * 0.1)))}
              {' | '}위치: {Math.round(previewPosition.y / (zoom * 0.1))}ms
            </span>
          ) : (
            <span className={styles.previewInfo}>
              {msToBeats(currentTime)} - {currentTime.toFixed(0)}ms
            </span>
          )}
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

      {/* 노트 정보 툴팁 */}
      {renderNoteTooltip()}
    </div>
  )
}

export default TrackMaker
