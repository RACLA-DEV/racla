import { MouseEvent, WheelEvent, useEffect, useRef, useState } from 'react'
import { FaArrowRightArrowLeft, FaArrowsRotate, FaDice, FaPalette, FaXmark } from 'react-icons/fa6'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import { createLog } from '@render/libs/logger'
import { createPortal } from 'react-dom'
import Tooltip from '../ui/Tooltip'

// constants/chart.js
export const DEFAULT_BPM = 206

// utils/timing.js

// types/chart.ts
interface Note {
  type: 0 | 1
  index: number
  headMilliSec: number
  tailMilliSec: number
}

interface ChartData {
  key: number
  mode: number
  level: number
  notes: Note[]
}

type ChartSection = Record<number, Note[]>

// components/Note.jsx
const Note = ({ position, length, isLongNote }) => {
  const noteStyle = {
    bottom: `${position}%`,
    height: isLongNote ? `${length}%` : '12px',
    clipPath: 'inset(0 0 0 0)',
  }

  return <div className={`note ${isLongNote ? 'long-note' : 'tap-note'}`} style={noteStyle} />
}

// components/ChartSection.tsx
interface WjmaxChartProps {
  chartData: string // CSV 형식의 문자열로 변경
  bpm?: number
  onClose: () => void
}

export default function WjmaxChartViewer({
  chartData,
  bpm = DEFAULT_BPM,
  onClose,
}: WjmaxChartProps) {
  const [parsedChartData, setParsedChartData] = useState<ChartData | null>(null)
  const [sections, setSections] = useState<ChartSection>({})
  const [scale, setScale] = useState(0.5) // 기본 0.5배 크기로 시작
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })
  const [theme, setTheme] = useState('blue') // 테마 상태 추가
  const [sectionHeight, setSectionHeight] = useState(1800) // 섹션 높이 상태 추가
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false)
  const [laneOrder, setLaneOrder] = useState<string>('')
  const [isLaneOrderValid, setIsLaneOrderValid] = useState(true)
  const [BEATS_PER_SECTION, setBEATS_PER_SECTION] = useState(4)
  const [SECTIONS_PER_COLUMN, setSECTIONS_PER_COLUMN] = useState(1)

  const chartRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(null)

  const calculateSectionDuration = (bpm) => {
    // 한 비트당 시간(ms) = (60초 * 1000ms) / BPM
    const msPerBeat = (60 * 1000) / bpm
    // 섹션 전체 시간 = 비트당 시간 * 섹션당 비트수
    return msPerBeat * BEATS_PER_SECTION
  }

  // CSV 파싱 함수 추가
  const parseCSVChartData = (csvData: string): ChartData => {
    const lines = csvData.trim().split('\n')

    // 첫 번째 줄은 헤더 (key, mode, level)
    const headerParts = lines[0].split(',').map((part) => parseFloat(part))

    const chartData: ChartData = {
      key: headerParts[0],
      mode: headerParts[1],
      level: headerParts[2],
      notes: [],
    }

    // 나머지 줄은 노트 데이터
    for (let i = 1; i < lines.length; i++) {
      const noteParts = lines[i].split(',').map((part) => parseFloat(part))

      chartData.notes.push({
        type: noteParts[0] as 0 | 1,
        index: noteParts[1],
        headMilliSec: noteParts[2],
        tailMilliSec: noteParts[3],
      })
    }

    return chartData
  }

  // 차트 데이터 파싱
  useEffect(() => {
    if (chartData) {
      const parsed = parseCSVChartData(chartData)
      setParsedChartData(parsed)
    }
  }, [chartData])

  // 기존 useEffect 수정 - parsedChartData 사용
  useEffect(() => {
    if (!parsedChartData) return

    const sectionDuration = calculateSectionDuration(bpm)
    const groupedNotes: ChartSection = {}

    parsedChartData.notes.forEach((note) => {
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
  }, [parsedChartData, bpm, BEATS_PER_SECTION])

  useEffect(() => {
    const updateChartPosition = () => {
      if (chartRef.current) {
        const chartRect = chartRef.current.getBoundingClientRect()

        // 실제 스케일이 적용된 차트의 크기 계산
        const scaledWidth = chartRect.width * scale
        const scaledHeight = chartRect.height * scale

        // transformOrigin이 '0 0'이므로, 이를 고려한 위치 계산
        const centerX = (window.innerWidth - scaledWidth) / 2
        const centerY = (window.innerHeight - scaledHeight) / 2

        setChartSize({ width: chartRect.width, height: chartRect.height })

        // isVisible이 false일 때만 중앙 정렬 (초기 렌더링 시)
        if (!isVisible) {
          requestAnimationFrame(() => {
            setPosition({
              x: Math.max(0, centerX),
              y: Math.max(0, centerY),
            })
            setIsVisible(true)
          })
        }
      }
    }

    // 컴포넌트 마운트 후 약간의 지연을 두고 위치 계산
    const timer = setTimeout(updateChartPosition, 200)

    // 윈도우 리사이즈 시 위치 재계산
    const handleResize = () => {
      if (isVisible) {
        updateChartPosition()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [scale, isVisible]) // isVisible도 의존성 배열에 추가

  const handleZoomIn = () => {
    setScale((prev) => {
      const newScale = Math.min(prev + 0.1, 3)
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
      const newScale = Math.max(prev - 0.1, 0.5)
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

  //   const handleWheel = (e: WheelEvent) => {
  //     e.preventDefault()
  //     if (e.deltaY < 0) {
  //       handleZoomIn()
  //     } else {
  //       handleZoomOut()
  //     }
  //   }

  const handleClose = () => {
    // 애니메이션 시작 전에 transition 효과 제거
    if (chartRef.current) {
      chartRef.current.style.transition = 'none'
    }

    // opacity 애니메이션을 위한 상태 변경
    setIsVisible(false)

    // 애니메이션이 완료된 후에 컴포넌트 제거
    setTimeout(() => {
      onClose()
    }, 200) // 200ms로 줄임 (기존 300ms)
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
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

    // 4키/6키 검증 수정
    const expectedLength = parsedChartData?.key === 0 ? 4 : 6
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
      return Array.from({ length: parsedChartData?.key === 0 ? 4 : 6 }, (_, i) => i)
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
    const length = parsedChartData?.key === 0 ? 4 : 6
    const mirrored = Array.from({ length }, (_, i) => length - i)
    setLaneOrder(mirrored.join(''))
    setIsLaneOrderValid(true)
  }

  // 랜덤 기능 수정
  const handleRandom = () => {
    const length = parsedChartData?.key === 0 ? 4 : 6
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
      <div className='chart-column tw:z-[99999]'>
        {Array.from({ length: SECTIONS_PER_COLUMN }).map((_, i) => {
          const sectionIndex = startSectionIndex + (SECTIONS_PER_COLUMN - 1 - i)
          const sectionNotes = sections[sectionIndex] || []
          const sectionTime = formatTime(sectionIndex * calculateSectionDuration(bpm))

          return (
            <div
              key={sectionIndex}
              className='chart-section'
              style={{ height: `${sectionHeight}px` }}
            >
              <div className='section-header tw:relative'>
                <div className='tw:flex tw:gap-16 tw:absolute tw:w-[800px] tw:h-32 tw:left-[-314px] tw:bottom-[360px] tw:transform tw:rotate-[-90deg]'>
                  <span
                    className={`section-number tw:text-5xl ${theme === 'blue' ? 'tw:text-blue-500' : theme === 'orange' ? 'tw:text-orange-500' : theme === 'red' ? 'tw:text-red-500' : ''}`}
                  >
                    #{sectionIndex + 1}
                  </span>
                  <span className='section-time tw:text-5xl tw:font-bold'>{sectionTime}</span>
                  <span className={`bpm-indicator tw:text-5xl tw:font-bold`}>BPM: {bpm}</span>
                </div>
              </div>
              <div className='lanes-container'>
                <div className='measure-lines'>
                  {Array.from({ length: BEATS_PER_SECTION / 4 }).map((_, i) => (
                    <div
                      key={`major-${i}`}
                      className={`measure-line major ${theme}-theme`}
                      style={{ bottom: `${i * 25}%` }}
                    />
                  ))}
                  {Array.from({ length: BEATS_PER_SECTION }).map((_, i) => (
                    <div
                      key={`minor-${i}`}
                      className={`measure-line minor ${theme}-theme`}
                      style={{ bottom: `${i * (100 / BEATS_PER_SECTION)}%` }}
                    />
                  ))}
                </div>
                {getLaneOrder().map((lane) => (
                  <div
                    key={lane}
                    className={`lane ${theme}-theme ${
                      (parsedChartData?.key === 0 && (lane === 1 || lane === 2)) ||
                      (parsedChartData?.key === 2 && (lane === 1 || lane === 4))
                        ? 'special-lane'
                        : ''
                    }`}
                  >
                    {sectionNotes
                      .filter((note) => note.index === lane)
                      .map((note, idx) => {
                        const sectionDuration = calculateSectionDuration(bpm)
                        const startPos = calculateNotePosition(
                          note.headMilliSec % sectionDuration,
                          sectionDuration,
                        )
                        const endPos = calculateNotePosition(
                          note.tailMilliSec % sectionDuration,
                          sectionDuration,
                        )
                        const noteLength = note.type === 1 ? Math.abs(endPos - startPos) : 0

                        return (
                          <Note
                            key={idx}
                            position={startPos}
                            length={noteLength}
                            isLongNote={note.type === 1}
                          />
                        )
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

  // 성능 최적화를 위한 throttle 함수 수정
  const handleMouseMoveThrottled = (e: MouseEvent) => {
    if (isDragging && !frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        handleMouseMove(e)
        frameRef.current = undefined
      })
    }
  }

  // 휠 이벤트 throttle 수정
  const handleWheelThrottled = (e: WheelEvent) => {
    e.preventDefault()
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        if (e.deltaY < 0) {
          handleZoomIn()
        } else {
          handleZoomOut()
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
    if (!isNaN(value) && value >= 900 && value <= 6000) {
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
      <div
        className='chart-backdrop tw:bg-slate-50 tw:dark:bg-slate-900'
        style={{
          zIndex: -1,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
        }}
      />

      {/* 메인 컨테이너 */}
      <div
        className={`chart-main-container`}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
          visibility: isVisible ? 'visible' : 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMoveThrottled}
        onWheel={handleWheelThrottled}
      >
        {/* 컨트롤 버튼 */}
        <div
          className='tw:absolute tw:bottom-4 tw:flex tw:items-center tw:gap-4 tw:bg-white tw:dark:bg-slate-800 tw:shadow-lg tw:border tw:border-slate-200 tw:dark:border-slate-700 tw:rounded-md tw:p-2'
          style={{ zIndex: 100000 }}
        >
          {/* 테마 선택 드롭다운 수정 */}
          <div ref={themeDropdownRef} className='tw:relative'>
            <Tooltip content='테마 변경' position='top'>
              <button
                onClick={() => {
                  setIsThemeDropdownOpen(!isThemeDropdownOpen)
                }}
                className='tw:p-2 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-white'
              >
                <FaPalette className='tw:w-4 tw:h-4' />
              </button>
            </Tooltip>
            {isThemeDropdownOpen && (
              <div className='tw:absolute tw:w-auto tw:p-1 tw:left-[-46px] tw:bottom-10 tw:text-sm tw:flex tw:gap-2 tw:mb-2 tw:bg-white tw:dark:bg-slate-800 tw:rounded-md tw:shadow-lg tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                <button
                  onClick={() => {
                    handleThemeChange('blue')
                  }}
                  className='tw:block tw:w-full tw:text-left tw:h-8 tw:px-4 tw:py-2 tw:rounded-md tw:bg-blue-500 hover:tw:bg-blue-600 tw:text-white'
                ></button>
                <button
                  onClick={() => {
                    handleThemeChange('orange')
                  }}
                  className='tw:block tw:w-full tw:text-left tw:h-8 tw:px-4 tw:py-2 tw:rounded-md tw:bg-orange-500 hover:tw:bg-orange-600 tw:text-white'
                ></button>
                <button
                  onClick={() => {
                    handleThemeChange('red')
                  }}
                  className='tw:block tw:w-full tw:text-left tw:h-8 tw:px-4 tw:py-2 tw:rounded-md tw:bg-red-500 hover:tw:bg-red-600 tw:text-white'
                ></button>
              </div>
            )}
          </div>

          <div className='tw:flex tw:items-center tw:gap-2'>
            <span className='tw:text-slate-700 tw:dark:text-white tw:text-xs tw:font-bold'>
              1열당 섹션
            </span>
            <input
              type='number'
              value={SECTIONS_PER_COLUMN}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (!isNaN(value) && value >= 1 && value <= 4) {
                  setSECTIONS_PER_COLUMN(value)
                }
              }}
              className='tw:w-20 tw:px-2 tw:pl-5 tw:py-1 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-white tw:border tw:text-center tw:border-slate-300 tw:dark:border-slate-600 tw:text-sm'
              min='1'
              max='4'
              step='1'
            />
          </div>

          <div className='tw:flex tw:items-center tw:gap-2'>
            <span className='tw:text-slate-700 tw:dark:text-white tw:text-xs tw:font-bold'>
              1섹션당 비트
            </span>
            <input
              type='number'
              value={BEATS_PER_SECTION}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (!isNaN(value) && value >= 1 && value <= 16) {
                  setBEATS_PER_SECTION(value)
                }
              }}
              className='tw:w-20 tw:px-2 tw:pl-5 tw:py-1 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-white tw:border tw:text-center tw:border-slate-300 tw:dark:border-slate-600 tw:text-sm'
              min='4'
              max='16'
              step='1'
            />
          </div>

          {/* 높이 조절 입력 */}
          <div className='tw:flex tw:items-center tw:gap-2'>
            <span className='tw:text-slate-700 tw:dark:text-white tw:text-xs tw:font-bold'>
              높이
            </span>
            <input
              type='number'
              value={sectionHeight}
              onChange={handleHeightChange}
              className='tw:w-20 tw:px-2 tw:pl-5 tw:py-1 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-white tw:border tw:text-center tw:border-slate-300 tw:dark:border-slate-600 tw:text-sm'
              min='900'
              max='6000'
              step='60'
            />
          </div>

          {/* 레인 순서 입력 및 버튼들 */}
          <div className='tw:flex tw:items-center tw:gap-2'>
            <span className='tw:text-slate-700 tw:dark:text-white tw:text-xs tw:font-bold'>
              레인 배치
            </span>
            <input
              type='text'
              value={laneOrder}
              onChange={handleLaneOrderChange}
              placeholder={getCurrentLaneOrder()}
              className={`tw:w-20 tw:px-2 tw:py-1 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-white tw:border ${
                isLaneOrderValid
                  ? 'tw:border-slate-300 tw:dark:border-slate-600'
                  : 'tw:border-indigo-500'
              } tw:text-sm tw:text-center`}
            />
            <Tooltip content='정배치로 초기화' position='top'>
              <button
                onClick={handleOriginal}
                className='tw:p-2 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-white'
              >
                <FaArrowsRotate className='tw:w-4 tw:h-4' />
              </button>
            </Tooltip>
            <Tooltip content='미러' position='top'>
              <button
                onClick={handleMirror}
                className='tw:p-2 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-white'
              >
                <FaArrowRightArrowLeft className='tw:w-4 tw:h-4' />
              </button>
            </Tooltip>
            <Tooltip content='랜덤' position='top'>
              <button
                onClick={handleRandom}
                className='tw:p-2 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-white'
              >
                <FaDice className='tw:w-4 tw:h-4' />
              </button>
            </Tooltip>
          </div>

          <Tooltip content='닫기' position='top'>
            <button
              onClick={handleClose}
              className='tw:p-2 tw:rounded-md tw:bg-slate-100 tw:dark:bg-slate-700 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-white'
            >
              <FaXmark className='tw:w-4 tw:h-4' />
            </button>
          </Tooltip>
        </div>

        <div
          className='chart-wrapper'
          style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
        >
          <TransformWrapper
            key={`chart-${BEATS_PER_SECTION}-${SECTIONS_PER_COLUMN}`}
            initialScale={0.2}
            minScale={0.2}
            maxScale={2}
            onPanning={(position) => {
              createLog('info', 'onPanning', { position })
            }}
            onInit={(init) => {
              createLog('info', 'onInit', { init })
            }}
            initialPositionX={0}
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ opacity: isVisible ? 1 : 0 }}
            >
              <div ref={chartRef} className='chart-scale-container'>
                {Array.from({ length: columnCount }).map((_, i) => (
                  <div key={i} className='chart-column'>
                    {renderColumn(i * SECTIONS_PER_COLUMN)}
                  </div>
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>
    </div>,
    document.body,
  )
}
