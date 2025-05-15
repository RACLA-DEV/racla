import 'dayjs/locale/ko'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'
import { NavigateFunction } from 'react-router-dom'

import { Icon } from '@iconify/react'
import Image from '@render/components/image/Image'
import ScorePopupComponent from '@render/components/score/ScorePopup'
import { globalDictionary } from '@render/constants/globalDictionary'
import { RootState } from '@render/store'
import { SongData } from '@src/types/games/SongData'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useNavigate } from 'react-router-dom'

dayjs.locale('ko')
dayjs.extend(utc)

// LazyListItem 인터페이스 정의
interface LazyListItemProps {
  songItem: SongData
  keyMode: string
  hoveredTitle: string | null
  handleMouseEnter: (songItem: SongData) => void
  handleMouseLeave: () => void
  selectedLevel: string
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
    navigate,
  }: LazyListItemProps) => {
    const { ref, inView } = useInView({
      triggerOnce: false,
      threshold: 0.1,
      rootMargin: '200px',
    })

    const handleClick = useCallback(() => {
      navigate(`/games/wjmax/db/${songItem.title}`)
    }, [songItem.title, navigate])

    if (!inView) {
      return <div ref={ref} className='tw:h-[84px]' /> // 플레이스홀더
    }

    return (
      <div
        ref={ref}
        data-song-title={songItem.title}
        onClick={handleClick}
        className={`tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:relative tw:overflow-hidden tw:cursor-pointer ${hoveredTitle === String(songItem.title) ? 'tw:bg-slate-100 tw:dark:bg-slate-700/50' : ''} hover:tw:bg-slate-100 hover:tw:dark:bg-slate-700/50`}
        onMouseEnter={() => handleMouseEnter(songItem)}
        onMouseLeave={handleMouseLeave}
      >
        {/* 애니메이션 배경 레이어 */}
        <div
          className={`tw:absolute tw:inset-0 tw:opacity-0 tw:transition-opacity tw:duration-300 before:tw:content-[''] before:tw:absolute before:tw:inset-[-150%] before:tw:bg-[length:200%_200%] before:tw:animate-gradientSlide before:tw:bg-gradient-to-r before:tw:from-[#1d8975] before:tw:via-[#5276b4] before:tw:via-[#8432bd] before:tw:via-[#5276b4] before:tw:to-[#1d8975] ${hoveredTitle === String(songItem.title) ? 'tw:opacity-10' : ''} `}
        />

        {/* 기존 콘텐츠 */}
        <div className='tw:relative tw:w-full tw:flex tw:items-center tw:gap-4'>
          <div className='tw:w-auto'>
            <ScorePopupComponent
              songTitle={songItem.title}
              keyMode={keyMode.replace('P', '')}
              isVisibleCode={true}
              judgementType={keyMode.includes('P') ? 1 : 0}
              isLink={false}
              width={130}
              height={74}
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
                    (songItem.composer !== '' ? ` / ${songItem.composer}` : '') +
                    ' / ' +
                    songItem.bpm +
                    ' BPM / ' +
                    dayjs
                      .utc(songItem.time * 1000)
                      .locale('ko')
                      .format('m분 s초')}
                </div>
              </div>
            </div>

            {/* 난이도별 고정 칸 */}
            <div className='tw:flex tw:gap-4 tw:flex-1 tw:items-center tw:justify-center'>
              {['NM', 'HD', 'MX', 'SC', 'DPC'].map((diff) => (
                <div key={diff} className='tw:w-20 tw:text-center'>
                  {songItem.patterns[`${keyMode.replace('P', '')}B`]?.[diff] ? (
                    <div
                      className={`tw:flex tw:h-full tw:items-center tw:gap-1 tw:font-extrabold tw:justify-center ${
                        selectedLevel === 'all' ||
                        Math.floor(songItem.patterns[`${keyMode.replace('P', '')}B`][diff].level) ==
                          Number(selectedLevel)
                          ? ''
                          : 'tw:opacity-30'
                      } ${diff === 'NM' && 'tw:text-wjmax-NM'} ${diff === 'HD' && 'tw:text-wjmax-HD'} ${diff === 'MX' && 'tw:text-wjmax-MX'} ${diff === 'SC' && 'tw:text-wjmax-SC'} ${diff === 'DPC' && 'tw:text-wjmax-DPC'} `}
                    >
                      <Image
                        src={`${import.meta.env.VITE_CDN_URL}/wjmax/nm_${diff.toLowerCase()}.png`}
                        width={24}
                        height={30}
                        alt={diff}
                      />
                      <div className='tw:text-sm'>
                        {songItem.patterns[`${keyMode.replace('P', '')}B`][diff].level.toFixed(1)}
                      </div>
                    </div>
                  ) : (
                    <div key={diff} className='tw:opacity-30'>
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
    <div ref={ref} className='tw:w-[130px] tw:h-[74px]'>
      {inView && (
        <ScorePopupComponent
          songTitle={songItem.title}
          keyMode={keyMode.replace('P', '')}
          isVisibleCode={true}
          judgementType={keyMode.includes('P') ? 1 : 0}
          width={130}
          height={74}
        />
      )}
    </div>
  )
})

const WjmaxDbPage = () => {
  const { songData, selectedGame } = useSelector((state: RootState) => state.app)

  const [keyMode, setKeyMode] = useState<string>('4')

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)

  const [searchName, setSearchName] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [selectedDlcCode, setSelectedDlcCode] = useState<string>('이세돌')

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

  const searchSong = useCallback((songItem, searchName) => {
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
  }, [])

  // DLC 코드 목록을 추출하는 메모이즈된 값
  const dlcCodeList = useMemo(() => {
    const dlcOrder = {
      전체: 1,
      이세돌: 2,
      우왁굳: 3,
      고정멤버: 4,
      중간계: 5,
      팬메이드: 6,
      쇼츠: 7,
      콜라보: 8,
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

  // 필터링된 곡 데이터 계산 (DPC 필터 추가)
  const filteredSongData = useMemo(() => {
    const filtered = songData[selectedGame].filter((songItem) => {
      // 검색어 필터
      const searchFilter = searchName === '' || searchSong(songItem, searchName)

      // DLC 필터
      const dlcFilter = selectedDlcCode === '전체' || (songItem.dlc || '기본') === selectedDlcCode

      // 난이도 필터
      const levelFilter =
        selectedLevel === 'all' ||
        ['NM', 'HD', 'MX', 'SC', 'DPC'].some((difficulty) => {
          const pattern = songItem.patterns[`${keyMode.replace('P', '')}B`]
          const level = pattern?.[difficulty]?.level
          return level !== undefined && Math.floor(level) === parseInt(selectedLevel)
        })

      return searchFilter && dlcFilter && levelFilter
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
    searchSong,
  ])

  // 검색 input ref 추가
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 키보드 접근성
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 검색창에 포커스가 있을 때
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault()
          searchInputRef.current.blur()
        }
        return // 다른 모든 키보드 단축키 무시
      }

      // 일반 입력 필드에서는 키보드 단축키를 무시
      if (
        (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) &&
        e.target !== searchInputRef.current
      ) {
        return
      }

      // 메타키가 눌려있으면 무시
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return
      }

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 초기 선택 인덱스 설정
  useEffect(() => {
    if (viewMode === 'list' && filteredSongData.length > 0 && selectedSongIndex === -1) {
      setSelectedSongIndex(0)
    }
  }, [viewMode, filteredSongData.length, selectedSongIndex])

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = useCallback((mode: 'list' | 'grid') => {
    setViewMode(mode)
  }, [])

  // 정렬 순서 변경 핸들러
  const handleSortOrderChange = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }, [sortOrder])

  // 키 모드 변경 핸들러
  const handleKeyModeChange = useCallback((value: string) => {
    setKeyMode(value)
  }, [])

  // 메모이징된 DLC 코드 버튼 렌더링
  const renderDlcCodeButtons = useMemo(() => {
    return dlcCodeList.map((dlcCode, index) => (
      <button
        key={dlcCode}
        ref={(el: HTMLButtonElement | null) => {
          buttonRefs.current[index] = el
        }}
        onClick={() => setSelectedDlcCode(dlcCode)}
        className={`tw:py-2 tw:flex-1 tw:min-w-0 tw:text-sm tw:font-medium tw:whitespace-nowrap tw:relative tw:transition-all tw:duration-300 ${
          selectedDlcCode === dlcCode
            ? 'tw:text-white tw:bg-indigo-500'
            : 'tw:text-slate-600 tw:dark:text-slate-300 hover:tw:text-slate-900 hover:tw:dark:text-white hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600'
        } `}
      >
        {dlcCode}
      </button>
    ))
  }, [dlcCodeList, selectedDlcCode])

  // 메모이징된 키 모드 버튼 렌더링
  const renderKeyModeButtons = useMemo(() => {
    return globalDictionary.gameDictionary[selectedGame].keyModeList.map((value) => (
      <button
        key={`keyModeSelector_${value}`}
        onClick={() => handleKeyModeChange(String(value))}
        className={`tw:p-1.5 tw:rounded-md tw:transition-all tw:w-12 ${
          keyMode === String(value)
            ? `wjmax_bg_b${value.replace('P', '')} tw:opacity-100`
            : 'tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600'
        }`}
        disabled={keyMode === String(value)}
      >
        <span className='tw:text-sm tw:font-bold'>{`${value.replace('P', '')}B${value.includes('P') ? '+' : ''}`}</span>
      </button>
    ))
  }, [selectedGame, keyMode, handleKeyModeChange])

  // 메모이징된 뷰 모드 버튼 렌더링
  const viewModeButtons = useMemo(
    () => (
      <>
        <button
          onClick={() => handleViewModeChange('list')}
          className={`tw:p-2 tw:rounded-md tw:transition-all ${
            viewMode === 'list'
              ? 'tw:bg-indigo-500 tw:text-white'
              : 'tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600'
          }`}
        >
          <Icon icon='lucide:list' className='tw:w-5 tw:h-5' />
        </button>
        <button
          onClick={() => handleViewModeChange('grid')}
          className={`tw:p-2 tw:rounded-md tw:transition-all ${
            viewMode === 'grid'
              ? 'tw:bg-indigo-500 tw:text-white'
              : 'tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600'
          }`}
        >
          <Icon icon='lucide:grid' className='tw:w-5 tw:h-5' />
        </button>
      </>
    ),
    [viewMode, handleViewModeChange],
  )

  // 메모이징된 목록 항목 렌더링
  const renderSongItem = useCallback(
    (songItem) => {
      if (viewMode === 'grid') {
        return <LazyGridItem key={songItem.title} songItem={songItem} keyMode={keyMode} />
      }

      return (
        <LazyListItem
          key={songItem.title}
          songItem={songItem}
          keyMode={keyMode}
          hoveredTitle={hoveredTitle}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          selectedLevel={selectedLevel}
          navigate={navigate}
        />
      )
    },
    [viewMode, keyMode, hoveredTitle, handleMouseEnter, handleMouseLeave, selectedLevel, navigate],
  )

  // 스크롤 시 더 많은 아이템 로드
  useEffect(() => {
    if (inView && visibleItems < filteredSongData.length) {
      setVisibleItems((prev) => Math.min(prev + 20, filteredSongData.length))
    }
  }, [inView, filteredSongData.length, visibleItems])

  // 현재 화면에 보여줄 곡 목록
  const visibleSongData = useMemo(() => {
    return filteredSongData.slice(0, visibleItems)
  }, [filteredSongData, visibleItems])

  // 메모이징된 곡 목록 렌더링
  const songListContent = useMemo(() => {
    return (
      <>
        {visibleSongData.map((songItem) => renderSongItem(songItem))}

        {viewMode === 'grid' &&
          Array.from(Array(20)).map((_, index) => (
            <div key={index} className='tw:w-[130px] tw:h-[74px]' />
          ))}

        {/* 더 불러오기를 위한 관찰 요소 */}
        {visibleItems < filteredSongData.length && (
          <div
            ref={loadMoreRef}
            className={`tw:h-20 tw:w-full tw:flex tw:justify-center tw:items-center ${viewMode === 'grid' ? 'tw:col-span-full' : ''}`}
          >
            <div className='tw:text-sm tw:text-slate-500'>더 불러오는 중...</div>
          </div>
        )}
      </>
    )
  }, [
    visibleSongData,
    renderSongItem,
    viewMode,
    visibleItems,
    filteredSongData.length,
    loadMoreRef,
  ])

  return (
    selectedGame === 'wjmax' && (
      <React.Fragment>
        <div className='tw:flex tw:flex-col tw:gap-4 tw:h-[calc(100vh-106px)] tw:relative tw:text-sm'>
          {/* 상단 영역 */}
          <div
            className={`tw:flex tw:flex-col tw:gap-4 tw:transition-all tw:w-full'} duration-300`}
          >
            <div className='tw:flex tw:w-full tw:gap-4'>
              <div className='tw:flex tw:w-full tw:flex-col tw:gap-4 tw:rounded-lg tw:border tw:border-slate-200 tw:dark:border-slate-700 tw:bg-white tw:dark:bg-slate-800 tw:p-4'>
                {/* 헤더 */}

                <div className='tw:flex tw:w-full tw:bg-slate-100 tw:dark:bg-slate-700 tw:rounded tw:overflow-x-auto tw:scroll-smooth'>
                  <div className='tw:flex tw:items-center tw:w-full'>{renderDlcCodeButtons}</div>
                </div>
                {/* 설명 내용 */}
                <div className='tw:flex tw:flex-col tw:gap-2'>
                  <div className='tw:flex tw:justify-between tw:items-center tw:gap-2'>
                    <div className='tw:flex tw:gap-2 tw:items-center'>{viewModeButtons}</div>

                    <div className='tw:flex tw:flex-1 tw:gap-2'>
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className='tw:text-sm tw:bg-white tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-200 tw:w-36 tw:border tw:border-slate-300 tw:dark:border-slate-600 focus:tw:border-indigo-400 focus:tw:ring-2 focus:tw:ring-indigo-400 focus:tw:ring-opacity-20 tw:transition-all tw:rounded-lg'
                      >
                        <option value='all'>모든 난이도</option>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((level) => (
                          <option key={level} value={level.toString()}>
                            Lv.{level}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleSortOrderChange}
                        className='tw:bg-slate-200 tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-200 tw:px-4 tw:py-1.5 tw:rounded-lg tw:border tw:border-slate-300 tw:dark:border-slate-600 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600 tw:transition-all'
                      >
                        {sortOrder === 'asc' ? '이름 ↑' : '이름 ↓'}
                      </button>

                      <div className='tw:relative tw:flex-1'>
                        <div className='tw:absolute tw:inset-y-0 tw:left-0 tw:pl-3 tw:flex tw:items-center tw:pointer-events-none'>
                          <Icon icon='lucide:search' className='tw:h-5 tw:w-5 tw:text-slate-400' />
                        </div>

                        <input
                          ref={searchInputRef}
                          className='tw:w-full tw:bg-white tw:dark:bg-slate-700 tw:text-slate-700 tw:dark:text-slate-200 tw:pl-10 tw:pr-4 tw:py-1.5 tw:rounded-lg tw:border tw:border-slate-300 tw:dark:border-slate-600 focus:tw:border-indigo-400 focus:tw:ring-2 focus:tw:ring-indigo-400 focus:tw:ring-opacity-20 tw:transition-all'
                          onChange={(e) => setSearchName(e.currentTarget.value)}
                          type='text'
                          placeholder='제목, 제작자명 또는 DLC명으로 검색'
                        />
                      </div>

                      <div className='tw:flex tw:gap-2'>{renderKeyModeButtons}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 - 상단 고정 영역만큼 여백 추가 */}
          {/* 상단 고정 영역의 높이에 맞게 조정 필요 */}
          <div
            className={`tw:flex-1 tw:overflow-hidden tw:transition-all tw:w-full'} duration-300`}
          >
            <div className='tw:h-full tw:overflow-y-auto tw:custom-scrollbar tw:scroll-smooth'>
              <div
                key={selectedDlcCode} // 키가 변경될 때마다 애니메이션 트리거
                className='tw:flex tw:flex-col tw:mr-2 tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:rounded-md tw:p-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'
              >
                <div
                  className={`tw:w-full ${viewMode === 'grid' ? 'tw:grid tw:grid-cols-[repeat(auto-fill,130px)] tw:gap-3 tw:justify-center tw:content-center' : 'tw:flex tw:flex-col'}`}
                >
                  {viewMode === 'list' && (
                    <div className='tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:text-slate-500 tw:dark:text-slate-400 tw:font-bold tw:text-sm'>
                      <div className='tw:w-[130px] tw:text-center'>곡 이미지</div>
                      <div className='tw:flex tw:flex-1'>
                        <div className='tw:flex-1'>곡 정보</div>
                        <div className='tw:w-[480px] tw:text-center'>난이도</div>
                      </div>
                    </div>
                  )}

                  {songListContent}
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  )
}

export default WjmaxDbPage
