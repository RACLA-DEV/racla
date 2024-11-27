import { useEffect, useState, useRef, MouseEvent, WheelEvent } from 'react'
import { createPortal } from 'react-dom'
import { FaMinus, FaPlus, FaXmark, FaPalette, FaArrowsRotate, FaArrowRightArrowLeft, FaDice, FaHouse, FaTrashCan } from 'react-icons/fa6'

// constants/chart.js
export const DEFAULT_BPM = 206
export const BEATS_PER_SECTION = 16 // 한 섹션에 표시할 비트 수

// utils/timing.js
export const calculateSectionDuration = (bpm) => {
  // 한 비트당 시간(ms) = (60초 * 1000ms) / BPM
  const msPerBeat = (60 * 1000) / bpm
  // 섹션 전체 시간 = 비트당 시간 * 섹션당 비트수
  return msPerBeat * BEATS_PER_SECTION
}

// types/chart.ts
interface Note {
  type: 0 | 1
  index: number
  headMilliSec: number
  tailMilliSec: number
}

interface ChartData {
  fileName: string
  maker: string
  key: number
  mode: number
  level: number
  notes: Note[]
}

interface ChartSection {
  [key: number]: Note[]
}

// components/Note.jsx
const Note = ({ type, position, length, isLongNote }) => {
  const noteStyle = {
    bottom: `${position}%`,
    height: isLongNote ? `${length}%` : '12px',
    clipPath: 'inset(0 0 0 0)',
  }

  return <div className={`note ${isLongNote ? 'long-note' : 'tap-note'}`} style={noteStyle} />
}

// components/ChartSection.tsx
interface WjmaxChartProps {
  chartData: ChartData
  bpm?: number
  onClose: () => void
}

export default function WjmaxChartComponent({ chartData, bpm = DEFAULT_BPM, onClose }: WjmaxChartProps) {
  const [sections, setSections] = useState<ChartSection>({})
  const SECTIONS_PER_COLUMN = 3 // 한 컬럼당 섹션 수
  const [scale, setScale] = useState(0.5) // 기본 0.5배 크기로 시작
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })
  const [theme, setTheme] = useState('blue') // 테마 상태 추가
  const [sectionHeight, setSectionHeight] = useState(1360) // 섹션 높이 상태 추가
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false)
  const [laneOrder, setLaneOrder] = useState<string>('')
  const [isLaneOrderValid, setIsLaneOrderValid] = useState(true)

  const chartRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>()

  useEffect(() => {
    const sectionDuration = calculateSectionDuration(bpm)
    const groupedNotes: ChartSection = {}

    chartData.notes.forEach((note) => {
      const sectionIndex = Math.floor(note.headMilliSec / sectionDuration)

      if (note.type === 1) {
        const endSectionIndex = Math.floor(note.tailMilliSec / sectionDuration)

        for (let i = sectionIndex; i <= endSectionIndex; i++) {
          if (!groupedNotes[i]) {
            groupedNotes[i] = []
          }

          const clonedNote = { ...note }

          const sectionStartTime = i * sectionDuration
          const sectionEndTime = (i + 1) * sectionDuration

          clonedNote.headMilliSec = Math.max(note.headMilliSec, sectionStartTime)
          clonedNote.tailMilliSec = Math.min(note.tailMilliSec, sectionEndTime)

          groupedNotes[i].push(clonedNote)
        }
      } else {
        if (!groupedNotes[sectionIndex]) {
          groupedNotes[sectionIndex] = []
        }
        groupedNotes[sectionIndex].push(note)
      }
    })

    setSections(groupedNotes)
  }, [chartData, bpm])

  useEffect(() => {
    const updateChartPosition = () => {
      if (chartRef.current) {
        const chartRect = chartRef.current.getBoundingClientRect()
        setChartSize({ width: chartRect.width, height: chartRect.height })

        if (!isVisible) {
          const centerX = (window.innerWidth - chartRect.width * scale) / 2
          const centerY = (window.innerHeight - chartRect.height * scale) / 2
          setPosition({ x: centerX, y: centerY })
        }
      }
    }

    requestAnimationFrame(() => {
      updateChartPosition()
      setIsVisible(true)
    })

    window.addEventListener('resize', updateChartPosition)

    return () => {
      window.removeEventListener('resize', updateChartPosition)
    }
  }, [])

  const handleZoomIn = () => {
    setScale((prev) => {
      const newScale = Math.min(prev + 0.25, 3)
      const scaleFactor = newScale / prev
      setPosition((prevPos) => ({
        x: prevPos.x - (chartSize.width * (scaleFactor - 1)) / 2,
        y: prevPos.y - (chartSize.height * (scaleFactor - 1)) / 2,
      }))
      return newScale
    })
  }

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.25, 0.5)
      const scaleFactor = newScale / prev
      setPosition((prevPos) => ({
        x: prevPos.x - (chartSize.width * (scaleFactor - 1)) / 2,
        y: prevPos.y - (chartSize.height * (scaleFactor - 1)) / 2,
      }))
      return newScale
    })
  }

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const calculateNotePosition = (timeMs: number, sectionDuration: number) => {
    const sectionStartTime = Math.floor(timeMs / sectionDuration) * sectionDuration
    const relativeTime = timeMs - sectionStartTime
    return (relativeTime / sectionDuration) * 100
  }

  // 시간 포맷 유틸리티 함수
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  // 레인 순서 유효성 검사 수정
  const validateLaneOrder = (order: string) => {
    // 콤마와 공백 제거
    const cleanOrder = order.replace(/[,\s]/g, '')
    const numbers = [...cleanOrder].map((n) => parseInt(n))

    // 빈 입력값은 기본 순서 사용
    if (cleanOrder === '') return true

    // 숫자가 아닌 입력 체크
    if (numbers.some(isNaN)) return false

    // 4키/6키 검증
    const expectedLength = chartData.key === 0 ? 4 : 6
    if (numbers.length !== expectedLength) return false

    // 1부터 시작하는 입력을 0부터 시작하는 인덱스로 변환하여 검증
    const converted = numbers.map((n) => n - 1)

    // 중복 검사
    const unique = new Set(converted)
    if (unique.size !== expectedLength) return false

    // 범위 검사 (0 ~ 3 또는 0 ~ 5)
    return converted.every((n) => n >= 0 && n < expectedLength)
  }

  // 레인 순서 변경 핸들러 수정
  const handleLaneOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOrder = e.target.value.replace(/[,\s]/g, '')
    setLaneOrder(newOrder)
    setIsLaneOrderValid(validateLaneOrder(newOrder))
  }

  // 실제 레인 순서 계산 수정
  const getLaneOrder = () => {
    if (!laneOrder.trim() || !isLaneOrderValid) {
      // 기본 순서 반환
      return Array.from({ length: chartData.key === 0 ? 4 : 6 }, (_, i) => i)
    }
    // 1부터 시작하는 입력을 0부터 시작하는 인덱스로 변환
    return [...laneOrder.replace(/[,\s]/g, '')].map((n) => parseInt(n) - 1)
  }

  // 현재 적용된 레인 순서를 문자열로 반환
  const getCurrentLaneOrder = () => {
    const order = getLaneOrder()
    return order.map((n) => n + 1).join('')
  }

  // 정배치 기능 수정
  const handleOriginal = () => {
    setLaneOrder('')
    setIsLaneOrderValid(true)
  }

  const handleMirror = () => {
    const length = chartData.key === 0 ? 4 : 6
    const mirrored = Array.from({ length }, (_, i) => length - i)
    setLaneOrder(mirrored.join(''))
    setIsLaneOrderValid(true)
  }

  // 랜덤 기능 수정
  const handleRandom = () => {
    const length = chartData.key === 0 ? 4 : 6
    const numbers = Array.from({ length }, (_, i) => i + 1)

    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }

    setLaneOrder(numbers.join(''))
    setIsLaneOrderValid(true)
  }

  const renderColumn = (startSectionIndex: number) => {
    return (
      <div className="chart-column tw-z-[99999]">
        {Array.from({ length: SECTIONS_PER_COLUMN }).map((_, i) => {
          const sectionIndex = startSectionIndex + (SECTIONS_PER_COLUMN - 1 - i)
          const sectionNotes = sections[sectionIndex] || []
          const sectionTime = formatTime(sectionIndex * calculateSectionDuration(bpm))

          return (
            <div key={sectionIndex} className="chart-section" style={{ height: `${sectionHeight}px` }}>
              <div className="section-header">
                <div className="section-info">
                  <span className={`section-number tw-text-${theme}-500`}>#{sectionIndex + 1}</span>
                  <span className="section-time">{sectionTime}</span>
                  <span className={`bpm-indicator tw-font-bold`}>BPM: {bpm}</span>
                </div>
              </div>
              <div className="lanes-container">
                <div className="measure-lines">
                  {Array.from({ length: BEATS_PER_SECTION / 4 }).map((_, i) => (
                    <div key={`major-${i}`} className="measure-line major" style={{ bottom: `${i * 25}%` }} />
                  ))}
                  {Array.from({ length: BEATS_PER_SECTION }).map((_, i) => (
                    <div key={`minor-${i}`} className="measure-line minor" style={{ bottom: `${i * (100 / BEATS_PER_SECTION)}%` }} />
                  ))}
                </div>
                {getLaneOrder().map((lane) => (
                  <div
                    key={lane}
                    className={`lane ${theme}-theme ${
                      (chartData.key === 0 && (lane === 1 || lane === 2)) || (chartData.key === 2 && (lane === 1 || lane === 4)) ? 'special-lane' : ''
                    }`}
                  >
                    {sectionNotes
                      .filter((note) => note.index === lane)
                      .map((note, idx) => {
                        const sectionDuration = calculateSectionDuration(bpm)
                        const startPos = calculateNotePosition(note.headMilliSec % sectionDuration, sectionDuration)
                        const endPos = calculateNotePosition(note.tailMilliSec % sectionDuration, sectionDuration)
                        const noteLength = note.type === 1 ? Math.abs(endPos - startPos) : 0

                        return <Note key={idx} type={note.type} position={startPos} length={noteLength} isLongNote={note.type === 1} />
                      })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const maxSectionIndex = Math.max(...Object.keys(sections).map(Number))
  const columnCount = Math.ceil((maxSectionIndex + 1) / SECTIONS_PER_COLUMN)

  // 성능 최적화를 위한 throttle 함수
  const handleMouseMoveThrottled = (e: MouseEvent) => {
    if (isDragging && !frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
        frameRef.current = undefined
      })
    }
  }

  // 휠 이벤트 throttle
  const handleWheelThrottled = (e: WheelEvent) => {
    e.preventDefault()
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        if (e.deltaY < 0) {
          setScale((prev) => Math.min(prev + 0.1, 3))
        } else {
          setScale((prev) => Math.max(prev - 0.1, 0.5))
        }
        frameRef.current = undefined
      })
    }
  }

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  // 테마 변경 핸들러
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setIsThemeDropdownOpen(false)
  }

  // 높이 변경 핸들러
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 500 && value <= 2000) {
      setSectionHeight(value)
    }
  }

  // 드롭다운 외부 클릭 감지를 위한 ref
  const themeDropdownRef = useRef<HTMLDivElement>(null)

  // // 외부 클릭 시 드롭다운 닫기
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
  //       setIsThemeDropdownOpen(false)
  //     }
  //   }

  //   document.addEventListener('mousedown', handleClickOutside)
  //   return () => document.removeEventListener('mousedown', handleClickOutside)
  // }, [])

  return createPortal(
    <div className={`chart-viewer ${isVisible ? 'visible' : ''}`} style={{ zIndex: 99999 }}>
      {/* 배경 */}
      <div className="chart-backdrop" style={{ zIndex: -1 }} />

      {/* 메인 컨테이너 */}
      <div
        className={`chart-main-container ${isVisible ? 'visible' : 'hidden'}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMoveThrottled}
        onWheel={handleWheelThrottled}
      >
        {/* 컨트롤 버튼 */}
        <div
          className="tw-absolute tw-bottom-20 tw-flex tw-items-center tw-gap-4 tw-bg-gray-900 tw-shadow-lg tw-border tw-border-gray-800 tw-rounded-md tw-p-2"
          style={{ zIndex: 100000 }}
        >
          <div className="tw-flex tw-items-center tw-gap-2">
            <button onClick={handleZoomOut} className="tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white">
              <FaMinus className="tw-w-4 tw-h-4" />
            </button>
            <span className="tw-text-white tw-text-sm">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white">
              <FaPlus className="tw-w-4 tw-h-4" />
            </button>
          </div>

          {/* 테마 선택 드롭다운 수정 */}
          <div ref={themeDropdownRef} className="tw-relative">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white"
            >
              <FaPalette className="tw-w-4 tw-h-4" />
            </button>
            {isThemeDropdownOpen && (
              <div className="tw-absolute tw-w-36 tw-left-[-56px] tw-bottom-10 tw-text-sm tw-flex tw-gap-2 tw-mb-2 tw-bg-gray-900 tw-rounded-md tw-shadow-lg tw-border tw-border-gray-800">
                <button
                  onClick={() => handleThemeChange('blue')}
                  className="tw-block tw-w-full tw-text-left tw-h-10 tw-px-4 tw-py-2 tw-rounded-md tw-bg-blue-500 hover:tw-bg-blue-800 tw-text-white"
                ></button>
                <button
                  onClick={() => handleThemeChange('orange')}
                  className="tw-block tw-w-full tw-text-left tw-h-10 tw-px-4 tw-py-2 tw-rounded-md tw-bg-orange-500 hover:tw-bg-orange-800 tw-text-white"
                ></button>
                <button
                  onClick={() => handleThemeChange('red')}
                  className="tw-block tw-w-full tw-text-left tw-h-10 tw-px-4 tw-py-2 tw-rounded-md tw-bg-red-500 hover:tw-bg-red-800 tw-text-white"
                ></button>
              </div>
            )}
          </div>

          {/* 높이 조절 입력 */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-white tw-text-xs tw-font-bold">높이 설정</span>
            <input
              type="number"
              value={sectionHeight}
              onChange={handleHeightChange}
              className="tw-w-20 tw-px-2 tw-pl-5 tw-py-1 tw-rounded-md tw-bg-gray-800 tw-text-white tw-border tw-text-center tw-border-gray-700 tw-text-sm"
              min="640"
              max="2000"
              step="60"
            />
          </div>

          {/* 레인 순서 입력 및 버튼들 */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-white tw-text-xs tw-font-bold">레인 설정</span>
            <input
              type="text"
              value={laneOrder}
              onChange={handleLaneOrderChange}
              placeholder={getCurrentLaneOrder()}
              className={`tw-w-20 tw-px-2 tw-py-1 tw-rounded-md tw-bg-gray-800 tw-text-white tw-border ${
                isLaneOrderValid ? 'tw-border-gray-700' : 'tw-border-blue-500'
              } tw-text-sm tw-text-center`}
            />
            <button onClick={handleOriginal} title="정배치로 초기화" className="tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white">
              <FaTrashCan className="tw-w-4 tw-h-4" />
            </button>
            <button onClick={handleMirror} title="미러" className="tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white">
              <FaArrowRightArrowLeft className="tw-w-4 tw-h-4" />
            </button>
            <button onClick={handleRandom} title="랜덤" className="tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white">
              <FaDice className="tw-w-4 tw-h-4" />
            </button>
          </div>

          <button onClick={handleClose} className="tw-p-2 tw-rounded-md tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white">
            <FaXmark className="tw-w-4 tw-h-4" />
          </button>
        </div>

        <div
          className="chart-wrapper"
          style={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            ref={chartRef}
            className={`chart-content ${isDragging ? 'grabbing' : 'grab'}`}
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              transition: isVisible ? 'transform 0.3s ease' : 'none',
            }}
          >
            <div
              className="chart-scale-container"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: '0 0',
                transition: 'transform 0.2s ease',
              }}
            >
              {Array.from({ length: columnCount }).map((_, i) => (
                <div key={i} className="chart-column">
                  {renderColumn(i * SECTIONS_PER_COLUMN)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
