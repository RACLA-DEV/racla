import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'
import { NavigateFunction } from 'react-router-dom'

import { Icon } from '@iconify/react'
import ScorePopupComponent from '@render/components/score/ScorePopup'
import { globalDictionary } from '@render/constants/globalDictionary'
import { RootState } from '@render/store'
import { SongData } from '@src/types/games/SongData'
import { useNavigate } from 'react-router-dom'

// LazyListItem 인터페이스 정의
interface LazyListItemProps {
  songItem: SongData
  keyMode: string
  hoveredTitle: string | null
  handleMouseEnter: (songItem: SongData) => void
  handleMouseLeave: () => void
  selectedLevel: string
  showPlusOnly: boolean
  navigate: NavigateFunction
}

// LazyGridItem 인터페이스 정의
interface LazyGridItemProps {
  songItem: SongData
  keyMode: string
}

// LazyListItem 컴포넌트 추가
const LazyListItem = React.memo(
  ({
    songItem,
    keyMode,
    hoveredTitle,
    handleMouseEnter,
    handleMouseLeave,
    selectedLevel,
    showPlusOnly,
    navigate,
  }: LazyListItemProps) => {
    const { ref, inView } = useInView({
      triggerOnce: false,
      threshold: 0.1,
      rootMargin: '200px',
    })

    const handleClick = useCallback(() => {
      navigate(`/games/platina_lab/db/${songItem.title}`)
    }, [songItem.title, navigate])

    if (!inView) {
      return <div ref={ref} className='tw:h-[84px]' /> // 플레이스홀더
    }

    return (
      <div
        ref={ref}
        data-song-title={songItem.title}
        onClick={() => {
          handleClick()
        }}
        className={`tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:relative tw:overflow-hidden tw:cursor-pointer ${hoveredTitle === String(songItem.title) ? 'tw:bg-slate-100 tw:dark:bg-slate-700/50' : ''} hover:tw:bg-slate-100 hover:tw:dark:bg-slate-700/50`}
        onMouseEnter={() => {
          handleMouseEnter(songItem)
        }}
        onMouseLeave={() => {
          handleMouseLeave()
        }}
      >
        {/* 애니메이션 배경 레이어 */}
        <div
          className={`tw:absolute tw:inset-0 tw:opacity-0 tw:transition-opacity tw:duration-300 before:tw:content-[''] before:tw:absolute before:tw:inset-[-150%] before:tw:bg-[length:200%_200%] before:tw:animate-gradientSlide before:tw:bg-gradient-to-r before:tw:from-[#4f46e5] before:tw:via-[#6366f1] before:tw:via-[#8b5cf6] before:tw:via-[#6366f1] before:tw:to-[#4f46e5] ${hoveredTitle === String(songItem.title) ? 'tw:opacity-10' : ''} `}
        />

        {/* 기존 콘텐츠 */}
        <div className='tw:relative tw:w-full tw:flex tw:items-center tw:gap-4'>
          <div className='tw:w-auto'>
            <ScorePopupComponent
              songTitle={songItem.title}
              keyMode={keyMode.replace('P', '')}
              isVisibleCode={true}
              isLink={false}
            />
          </div>
          <div className='tw:flex tw:flex-1'>
            <div className='tw:flex-1'>
              <div className='tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                {songItem.name}
              </div>
              <div className='tw:flex tw:gap-2 tw:mt-1'>
                <div className='tw:text-slate-500 tw:dark:text-slate-400'>
                  {songItem.artist +
                    ' / ' +
                    (songItem.bpm == songItem.bpmLow
                      ? songItem.bpm
                      : songItem.bpmLow + '~' + songItem.bpm) +
                    ' BPM'}
                </div>
              </div>
            </div>

            {/* 난이도별 고정 칸 */}
            <div className='tw:flex tw:gap-4 tw:items-center tw:text-center tw:justify-center'>
              {['EASY', 'HD', 'OVER', 'PLUS_1', 'PLUS_2', 'PLUS_3']
                .filter((diff) => !showPlusOnly || diff.startsWith('PLUS_'))
                .map((diff) => (
                  <div key={diff} className='tw:w-20 tw:text-center'>
                    {songItem.patterns[`${keyMode.replace('P', '')}B`]?.[diff] ? (
                      <div
                        className={`tw:flex tw:items-center tw:gap-1 tw:font-extrabold tw:w-full tw:text-center tw:justify-center ${
                          selectedLevel === 'all' ||
                          Math.floor(
                            songItem.patterns[`${keyMode.replace('P', '')}B`][diff].level,
                          ) == Number(selectedLevel)
                            ? ''
                            : 'tw:opacity-30'
                        } ${diff === 'EASY' && 'tw:text-platina_lab-EASY'} ${diff === 'HD' && 'tw:text-platina_lab-HD'} ${diff === 'OVER' && 'tw:text-platina_lab-OVER'} ${diff === 'PLUS_1' && 'tw:text-platina_lab-PLUS-1'} ${diff === 'PLUS_2' && 'tw:text-platina_lab-PLUS-2'} ${diff === 'PLUS_3' && 'tw:text-platina_lab-PLUS-3'} `}
                      >
                        <div className='tw:w-full tw:text-center'>
                          Lv.
                          {songItem.patterns[`${keyMode.replace('P', '')}B`][diff].level.toFixed(0)}
                        </div>
                      </div>
                    ) : (
                      <div className='tw:opacity-30 tw:text-slate-500 tw:dark:text-slate-400'>
                        <div className='tw:text-base tw:font-extrabold'>-</div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  },
)

// LazyGridItem 컴포넌트 추가
const LazyGridItem = React.memo(({ songItem, keyMode }: LazyGridItemProps) => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
    rootMargin: '200px',
  })

  return (
    <div ref={ref} className='tw:w-[80px] tw:h-[80px]'>
      {inView && (
        <ScorePopupComponent
          songTitle={songItem.title}
          keyMode={keyMode.replace('P', '')}
          isVisibleCode={true}
        />
      )}
    </div>
  )
})

const PlatinaLabDbPage = () => {
  const { songData, selectedGame } = useSelector((state: RootState) => state.app)

  const [keyMode, setKeyMode] = useState<string>('4')
  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [searchName, setSearchName] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showPlusOnly, setShowPlusOnly] = useState<boolean>(false)

  const [selectedDlcCode, setSelectedDlcCode] = useState<string>('Entertain')

  const navigate = useNavigate()

  // 스크롤 중인지 감지하는 상태 추가
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimer = useRef(null)

  // 마지막 마우스 위치를 저장할 ref
  const lastMousePositionRef = useRef({ x: 0, y: 0 })

  // 무한 스크롤을 위한 상태와 훅 추가
  const [visibleItems, setVisibleItems] = useState<number>(20) // 초기에 보여줄 아이템 수
  const { inView, ref: loadMoreRef } = useInView({
    threshold: 0.1,
    rootMargin: '400px 0px',
  })

  // 스크롤 핸들러 수정
  const handleScroll = useCallback(() => {
    // 스크롤 시작시 호버 효과 제거
    setHoveredTitle(null)
    setIsScrolling(true)

    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current)
    }

    scrollTimer.current = setTimeout(() => {
      setIsScrolling(false)
      // 스크롤이 끝난 후 마우스 위치의 엘리먼트 찾기
      const element = document.elementFromPoint(
        lastMousePositionRef.current.x,
        lastMousePositionRef.current.y,
      )
      // 해당 엘리먼트의 가장 가까운 곡 아이템 컨테이너 찾기
      const songContainer = element?.closest('[data-song-title]')
      if (songContainer) {
        const songTitle = songContainer.getAttribute('data-song-title')
        setHoveredTitle(songTitle) // 스크롤 끝나면 즉시 호버 상태 적용
      }
    }, 500) // 타이머 시간을 좀 더 짧게 조정
  }, [])

  // 호버 핸들러 수정
  const handleMouseEnter = useCallback(
    (songItem) => {
      if (!isScrolling) {
        // 스크롤 중이 아닐 때만 호버 효과 적용
        setHoveredTitle(songItem.title)
      }
    },
    [isScrolling],
  )

  const handleMouseLeave = useCallback(() => {
    if (!isScrolling) {
      // 스크롤 중이 아닐 때만 호버 효과 제거
      setHoveredTitle(null)
    }
  }, [isScrolling])

  // 마우스 이동 핸들러 추가
  const handleMouseMove = useCallback((e: MouseEvent) => {
    lastMousePositionRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  useEffect(() => {
    const scrollContainer = document.querySelector('.tw-overflow-y-auto')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      document.addEventListener('mousemove', handleMouseMove)
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
        document.removeEventListener('mousemove', handleMouseMove)
        if (scrollTimer.current) {
          clearTimeout(scrollTimer.current)
        }
      }
    }
  }, [handleScroll, handleMouseMove])

  const searchSong = (songItem, searchName) => {
    const searchNameLower = searchName.toLowerCase().trim()
    const backspacedSearchNameLower = searchName.toLowerCase().trim().replace(' ', '')

    // 일반 문자열 검색
    const isStringMatch =
      String(songItem.artist).toLowerCase().includes(searchNameLower) ||
      String(songItem.composer).toLowerCase().includes(searchNameLower) ||
      String(songItem.name).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(searchNameLower) ||
      String(songItem.title).includes(searchNameLower)

    const isStringMatchBackspaced =
      String(songItem.artist).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.composer).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.name).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.title).includes(searchNameLower)
    // 초성 검색
    // const isChosungMatch = isMatchingChosung(songItem.composer, searchName) || isMatchingChosung(songItem.name, searchName)

    return isStringMatch || isStringMatchBackspaced
  }

  // DLC 코드 목록을 추출하는 메모이즈된 값
  const dlcCodeList = useMemo(() => {
    const dlcOrder = {
      전체: 1,
      Entertain: 2,
      PLATINA: 3,
    }

    const codes = [...new Set(songData[selectedGame].map((song) => song.dlc || '기본'))]
      .filter((code) => code !== '전체') // '전체'는 따로 처리
      .sort((a, b) => {
        const orderA = dlcOrder[a] || 100 // 정의되지 않은 DLC는 중간 순서로
        const orderB = dlcOrder[b] || 100
        return orderA - orderB
      })

    return ['전체', ...codes] // '전체'를 마지막에 추가
  }, [songData, selectedGame])

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // 키재 선택된 곡의 인덱스를 추적하기 위한 state 추가
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(-1)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // 필터링된 곡 데이터 계산
  const filteredSongData = useMemo(() => {
    const filtered = songData[selectedGame].filter((songItem) => {
      // 검색어 필터
      const searchFilter = searchName === '' || searchSong(songItem, searchName)

      // DLC 필터
      const dlcFilter = selectedDlcCode === '전체' || (songItem.dlc || '기본') === selectedDlcCode

      // 난이도 필터
      const levelFilter =
        selectedLevel === 'all' ||
        ['EASY', 'HD', 'OVER', 'PLUS_1', 'PLUS_2', 'PLUS_3'].some((difficulty) => {
          const pattern = songItem.patterns[`${keyMode.replace('P', '')}B`]
          const level = pattern?.[difficulty]?.level
          return level !== undefined && Math.floor(level) === parseInt(selectedLevel)
        })

      // PLUS ONLY 필터
      const plusFilter =
        !showPlusOnly ||
        ['PLUS_1', 'PLUS_2', 'PLUS_3'].some((difficulty) => {
          const pattern = songItem.patterns[`${keyMode.replace('P', '')}B`]
          return pattern?.[difficulty]?.level !== undefined
        })

      return searchFilter && dlcFilter && levelFilter && plusFilter
    })

    // 정렬 적용
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name)
      } else {
        return b.name.localeCompare(a.name)
      }
    })
  }, [
    songData,
    selectedGame,
    searchName,
    selectedDlcCode,
    selectedLevel,
    keyMode,
    sortOrder,
    showPlusOnly,
  ])

  // 검색 input ref 추가
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 초기 선택 인덱스 설정
  useEffect(() => {
    if (viewMode === 'list' && filteredSongData.length > 0 && selectedSongIndex === -1) {
      setSelectedSongIndex(0)
    }
  }, [viewMode, filteredSongData.length])

  // 스크롤 시 더 많은 아이템 로드
  useEffect(() => {
    if (inView && visibleItems < filteredSongData.length) {
      setVisibleItems((prev) => Math.min(prev + 20, filteredSongData.length))
    }
  }, [inView, filteredSongData.length, visibleItems])

  // 필터 변경 시 가시적 아이템 수 초기화
  useEffect(() => {
    setVisibleItems(20)
  }, [searchName, selectedDlcCode, selectedLevel, keyMode, sortOrder, showPlusOnly])

  // 현재 화면에 보여줄 곡 목록
  const visibleSongData = useMemo(() => {
    return filteredSongData.slice(0, visibleItems)
  }, [filteredSongData, visibleItems])

  return (
    selectedGame === 'platina_lab' && (
      <React.Fragment>
        <div className='tw:flex tw:flex-col tw:gap-4 tw:h-[calc(100vh-106px)] tw:relative tw:text-sm'>
          {/* 상단 영역 */}
          <div
            className={`tw:flex tw:flex-col tw:gap-4 tw:transition-all tw:w-full'} duration-300`}
          >
            <div className='tw:flex tw:w-full tw:gap-4'>
              <div className='tw:flex tw:w-full tw:flex-col tw:gap-4 tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:shadow-lg tw:p-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                {/* 헤더 */}
                <div className='tw:flex tw:w-full tw:bg-slate-100 tw:dark:bg-slate-700 tw:rounded tw:overflow-x-auto tw:scroll-smooth'>
                  <div className='tw:flex tw:items-center tw:w-full'>
                    {dlcCodeList.map((dlcCode, index) => (
                      <button
                        key={dlcCode}
                        ref={(el: HTMLButtonElement | null) => {
                          buttonRefs.current[index] = el
                        }}
                        onClick={() => {
                          setSelectedDlcCode(dlcCode)
                        }}
                        className={`tw:py-2 tw:flex-1 tw:min-w-0 tw:text-sm tw:font-medium tw:whitespace-nowrap tw:relative tw:transition-all tw:duration-300 ${
                          selectedDlcCode === dlcCode
                            ? 'tw:text-white tw:bg-indigo-500'
                            : 'tw:text-slate-600 tw:dark:text-slate-300 hover:tw:text-slate-900 hover:tw:dark:text-white hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600'
                        } `}
                      >
                        {dlcCode}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 설명 내용 */}
                <div className='tw:flex tw:flex-col tw:gap-2'>
                  <div className='tw:flex tw:justify-between tw:items-center tw:gap-2'>
                    <div className='tw:flex tw:gap-2 tw:items-center'>
                      <button
                        onClick={() => {
                          setViewMode('list')
                        }}
                        className={`tw:p-2 tw:rounded-md tw:transition-all ${
                          viewMode === 'list'
                            ? 'tw:bg-indigo-500 tw:text-white'
                            : 'tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600'
                        }`}
                      >
                        <Icon icon='lucide:list' className='tw:w-5 tw:h-5' />
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('grid')
                        }}
                        className={`tw:p-2 tw:rounded-md tw:transition-all ${
                          viewMode === 'grid'
                            ? 'tw:bg-indigo-500 tw:text-white'
                            : 'tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600'
                        }`}
                      >
                        <Icon icon='lucide:grid' className='tw:w-5 tw:h-5' />
                      </button>
                    </div>

                    <div className='tw:flex tw:flex-1 tw:items-center tw:gap-2'>
                      <button
                        onClick={() => {
                          setShowPlusOnly(!showPlusOnly)
                        }}
                        className={`tw:px-4 tw:py-1.5 tw:rounded-lg tw:border tw:border-slate-300 tw:dark:border-slate-600 tw:transition-all ${
                          showPlusOnly
                            ? 'tw:bg-indigo-500 tw:text-white hover:tw:bg-indigo-600'
                            : 'tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-200 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600'
                        }`}
                      >
                        PLUS ONLY {showPlusOnly ? 'ON' : 'OFF'}
                      </button>
                      <select
                        value={selectedLevel}
                        onChange={(e) => {
                          setSelectedLevel(e.target.value)
                        }}
                        className='tw:p-1.5 tw:min-w-[120px] tw:max-w-[120px] tw:w-36 tw:text-sm tw:rounded-lg tw:border tw:dark:bg-slate-700 tw:dark:text-white tw:dark:border-slate-600 tw:bg-white tw:text-slate-700 tw:border-slate-300 focus:tw:border-indigo-400 focus:tw:ring-2 focus:tw:ring-indigo-400 focus:tw:ring-opacity-20 tw:transition-all'
                      >
                        <option value='all'>모든 난이도</option>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((level) => (
                          <option key={level} value={level.toString()}>
                            Lv.{level}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        }}
                        className='tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-200 tw:px-4 tw:py-1.5 tw:rounded-lg tw:border tw:border-slate-300 tw:dark:border-slate-600 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600 tw:transition-all'
                      >
                        {sortOrder === 'asc' ? '이름 ↑' : '이름 ↓'}
                      </button>

                      <div className='tw:relative tw:flex-1'>
                        <div className='tw:absolute tw:inset-y-0 tw:left-0 tw:pl-3 tw:flex tw:items-center tw:pointer-events-none'>
                          <svg
                            className='tw:h-5 tw:w-5 tw:text-slate-400'
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                          >
                            <path
                              fillRule='evenodd'
                              d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>

                        <input
                          ref={searchInputRef}
                          className='tw:w-full tw:text-sm tw:placeholder:text-slate-400 tw:bg-white tw:dark:bg-slate-700 tw:bg-opacity-25 tw:text-light tw:pl-10 tw:pr-4 tw:py-1.5 tw:rounded-lg tw:border tw:border-slate-300 tw:dark:border-slate-600 tw:border-opacity-50 focus:tw:border-blue-400 focus:tw:ring-2 focus:tw:ring-blue-400 focus:tw:ring-opacity-20 tw:transition-all'
                          onChange={(e) => {
                            setSearchName(e.currentTarget.value)
                          }}
                          type='text'
                          placeholder='제목, 제작자명 또는 DLC명으로 검색'
                        />
                      </div>
                      <div className='tw:flex tw:gap-2'>
                        {globalDictionary.gameDictionary[selectedGame].keyModeList.map((value) => (
                          <button
                            key={`keyModeSelector_${value}`}
                            onClick={() => {
                              setKeyMode(String(value))
                            }}
                            className={`tw:p-1.5 tw:rounded-md tw:transition-all tw:w-12 ${
                              keyMode === String(value)
                                ? `platina_lab_bg_b${String(value).replace('P', '')} tw:opacity-100`
                                : 'tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600'
                            }`}
                            disabled={keyMode === String(value)}
                          >
                            <span className='tw:text-sm tw:font-bold'>{`${String(value).replace('P', '')}B${String(value).includes('P') ? '+' : ''}`}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/*
                <div className='tw:flex tw:justify-end tw:gap-2 tw:items-center tw:text-xs tw:font-semibold'>
                  <Icon icon='lucide:check-circle' className='tw:text-green-500' />
                  <div className='tw:flex tw:items-center tw:gap-1 tw:text-slate-500 tw:dark:text-slate-400'>
                    PLATiNA :: LAB Steam Build 18306451 데이터로 동기화됨
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 - 상단 고정 영역만큼 여백 추가 */}
          {/* 상단 고정 영역의 높이에 맞게 조정 필요 */}
          <div
            className={`tw:flex-1 tw:overflow-hidden tw:transition-all tw:w-full'} duration-300`}
          >
            <div className='tw:h-full tw:overflow-y-auto tw:custom-scrollbar tw:scroll-smooth'>
              <div className='tw:flex tw:flex-col tw:mr-2 tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:rounded-md tw:p-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                <div
                  className={`tw:w-full ${viewMode === 'grid' ? 'tw:grid tw:grid-cols-[repeat(auto-fill,80px)] tw:gap-3 tw:justify-center' : 'tw:flex tw:flex-col'}`}
                >
                  {viewMode === 'list' && (
                    <div className='tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:text-slate-500 tw:dark:text-slate-400 tw:font-bold tw:text-sm'>
                      <div className='tw:w-[80px] tw:text-center'>곡 이미지</div>
                      <div className='tw:flex tw:flex-1'>
                        <div className='tw:flex-1'>곡 정보</div>
                        <div
                          className={`${!showPlusOnly ? 'tw:w-[576px]' : 'tw:w-[288px]'} tw:text-center`}
                        >
                          난이도
                        </div>
                      </div>
                    </div>
                  )}

                  {visibleSongData.map((songItem) =>
                    viewMode === 'grid' ? (
                      <LazyGridItem key={songItem.title} songItem={songItem} keyMode={keyMode} />
                    ) : (
                      <LazyListItem
                        key={songItem.title}
                        songItem={songItem}
                        keyMode={keyMode}
                        hoveredTitle={hoveredTitle}
                        handleMouseEnter={handleMouseEnter}
                        handleMouseLeave={handleMouseLeave}
                        selectedLevel={selectedLevel}
                        showPlusOnly={showPlusOnly}
                        navigate={navigate}
                      />
                    ),
                  )}

                  {viewMode === 'grid' &&
                    Array.from(Array(20)).map((_, index) => (
                      <div key={index} className='tw:w-[80px] tw:h-[80px]' />
                    ))}

                  {/* 더 불러오기를 위한 관찰 요소 */}
                  {visibleItems < filteredSongData.length && (
                    <div
                      ref={loadMoreRef}
                      className={`tw:h-20 tw:w-full tw:flex tw:justify-center tw:items-center ${viewMode === 'grid' ? 'tw:col-span-full' : ''}`}
                    >
                      <div className='tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-slate-500 tw:dark:text-slate-400'>
                        <Icon icon='lucide:loader' className='tw:animate-spin tw:w-4 tw:h-4' />
                        <span>더 불러오는 중...</span>
                      </div>
                    </div>
                  )}

                  {/* 검색 결과가 없을 때 */}
                  {filteredSongData.length === 0 && (
                    <div className='tw:w-full tw:py-10 tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-slate-500 tw:dark:text-slate-400'>
                      <Icon
                        icon='lucide:search-x'
                        className='tw:w-12 tw:h-12 tw:mb-2 tw:opacity-40'
                      />
                      <p>검색 결과가 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  )
}

export default PlatinaLabDbPage
