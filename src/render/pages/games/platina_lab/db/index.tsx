import 'dayjs/locale/ko'

import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BsGrid, BsList } from 'react-icons/bs'
import { useDispatch, useSelector } from 'react-redux'

import { globalDictionary } from '@constants/globalDictionary'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { debounce } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FaCircleCheck } from 'react-icons/fa6'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

dayjs.locale('ko')
dayjs.extend(utc)

const PlatinaLabDbPage = () => {
  const dispatch = useDispatch()
  const { platinaLabSongData, userData, vArchiveUserData } = useSelector(
    (state: RootState) => state.app,
  )

  const [keyMode, setKeyMode] = useState<string>('4')

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)

  const [searchName, setSearchName] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showPlusOnly, setShowPlusOnly] = useState<boolean>(false)

  const [selectedDlcCode, setSelectedDlcCode] = useState<string>('Entertain')

  const router = useRouter()

  // 프리뷰 BGA 변경을 위한 디바운스된 함수
  const debouncedSetBgaName = useMemo(
    () =>
      debounce((title: string) => {
        if (title) {
          dispatch(
            setBackgroundBgaName(
              'resources/music' +
                String(
                  platinaLabSongData.filter((song) => song.title == title)[0].bgaPreviewFileName,
                ).replace('.mp4', ''),
            ),
          )
        }
      }, 300),
    [dispatch, platinaLabSongData],
  )

  // 스크롤 중인지 감지하는 상태 추가
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimer = useRef(null)

  // 마지막 마우스 위치를 저장할 ref
  const lastMousePositionRef = useRef({ x: 0, y: 0 })

  // 스크롤 핸들러 수정
  const handleScroll = () => {
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
        debouncedSetBgaName(songTitle) // BGA는 디바운스 적용
      }
    }, 500) // 타이머 시간을 좀 더 짧게 조정
  }

  // 호버 핸들러 수정
  const handleMouseEnter = (songItem) => {
    if (!isScrolling) {
      // 스크롤 중이 아닐 때만 호버 효과 적용
      setHoveredTitle(songItem.title)
      debouncedSetBgaName(songItem.title)
    }
  }

  const handleMouseLeave = () => {
    if (!isScrolling) {
      // 스크롤 중이 아닐 때만 호버 효과 제거
      setHoveredTitle(null)
      dispatch(setBackgroundBgaName(''))
      debouncedSetBgaName.cancel()
    }
  }

  // 마우스 이동 핸들러 추가
  const handleMouseMove = (e: MouseEvent) => {
    lastMousePositionRef.current = { x: e.clientX, y: e.clientY }
  }

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
  }, [])

  // 초성을 추출하는 함수
  const getChosung = (char) => {
    const baseCode = '가'.charCodeAt(0)
    const chosung = [
      'ㄱ',
      'ㄲ',
      'ㄴ',
      'ㄷ',
      'ㄸ',
      'ㄹ',
      'ㅁ',
      'ㅂ',
      'ㅃ',
      'ㅅ',
      'ㅆ',
      'ㅇ',
      'ㅈ',
      'ㅉ',
      'ㅊ',
      'ㅋ',
      'ㅌ',
      'ㅍ',
      'ㅎ',
    ]

    const code = char.charCodeAt(0)
    if (code < baseCode) return ''

    const cho = Math.floor((code - baseCode) / (21 * 28))
    return chosung[cho]
  }

  // 초성을 추출하는 함수
  const extractChosung = (text) => {
    return [...text].map(getChosung).join('')
  }

  const isMatchingChosung = (text, searchTerm) => {
    const textChosung = extractChosung(text)
    const searchChosung = extractChosung(searchTerm)

    return textChosung.includes(searchChosung)
  }

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

    const codes = [...new Set(platinaLabSongData.map((song) => song.dlc || '기본'))]
      .filter((code) => code !== '전체') // '전체'는 따로 처리
      .sort((a, b) => {
        const orderA = dlcOrder[a] || 100 // 정의되지 않은 DLC는 중간 순서로
        const orderB = dlcOrder[b] || 100
        return orderA - orderB
      })

    return ['전체', ...codes] // '전체'를 마지막에 추가
  }, [platinaLabSongData])

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // 키재 선택된 곡의 인덱스를 추적하기 위한 state 추가
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(-1)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // 필터링된 곡 데이터 계산 (DPC 필터 추가)
  const filteredSongData = useMemo(() => {
    const filtered = platinaLabSongData.filter((songItem) => {
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
    platinaLabSongData,
    searchName,
    selectedDlcCode,
    selectedLevel,
    keyMode,
    sortOrder,
    showPlusOnly,
  ])

  // 선택된 곡의 ref를 저장하기 위한 ref 추가
  const selectedSongRef = useRef<HTMLDivElement>(null)

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
  }, [viewMode, filteredSongData.length])

  // 선택된 곡이 변경될 때 스크롤 처리 추가
  // useEffect(() => {
  //   if (selectedSongIndex >= 0 && viewMode === 'list' && selectedSongRef.current) {
  //     selectedSongRef.current.scrollIntoView({
  //       behavior: 'smooth',
  //       block: 'nearest',
  //     })

  //     const selectedSong = filteredSongData[selectedSongIndex]
  //     handleHoverTitle(selectedSong.title)
  //   }
  // }, [selectedSongIndex, viewMode])

  const isDjCommentOpen = useSelector((state: RootState) => state.ui.isDjCommentOpen)

  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)

  return (
    selectedGame === 'platina_lab' && (
      <React.Fragment>
        <Head>
          <title>
            {String(keyMode).replace('PLUS', '').replace('P', '').replace('B', '').replace('_', '')}
            B{keyMode.includes('P') ? '+' : ''} 데이터베이스 - RACLA
          </title>
        </Head>
        <div className='tw-flex tw-flex-col tw-gap-4 vh-screen tw-relative'>
          {/* 상단 영역 */}
          <div className={`tw-flex tw-flex-col tw-gap-4 tw-transition-all w-w-full'} duration-300`}>
            <div className='tw-flex tw-w-full tw-gap-4'>
              <div className='tw-flex tw-w-full tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-4'>
                {/* 헤더 */}

                <div className='tw-flex tw-w-full tw-bg-gray-700 tw-bg-opacity-30 tw-rounded tw-overflow-x-auto tw-scroll-smooth'>
                  <div className='tw-flex tw-items-center tw-w-full'>
                    {dlcCodeList.map((dlcCode, index) => (
                      <button
                        key={dlcCode}
                        ref={(el: HTMLButtonElement | null) => {
                          buttonRefs.current[index] = el
                        }}
                        onClick={() => setSelectedDlcCode(dlcCode)}
                        className={`tw-py-2 tw-flex-1 tw-min-w-0 tw-text-sm tw-font-medium tw-whitespace-nowrap tw-relative tw-transition-all tw-duration-300 ${
                          selectedDlcCode === dlcCode
                            ? 'tw-text-white tw-bg-blue-500'
                            : 'tw-text-gray-400 hover:tw-text-gray-200 hover:tw-bg-gray-600 hover:tw-bg-opacity-30'
                        } `}
                      >
                        {dlcCode}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 설명 내용 */}
                <div className='tw-flex tw-flex-col tw-gap-2'>
                  <div className='tw-flex tw-justify-between tw-items-center tw-gap-2'>
                    <div className='tw-flex tw-gap-2'>
                      {globalDictionary.platina_lab.keyModeList.map((value) => (
                        <button
                          key={`keyModeSelector_${value}`}
                          onClick={() => setKeyMode(String(value))}
                          className={`tw-p-2 tw-rounded-md tw-transition-all tw-w-12 ${
                            keyMode === String(value)
                              ? `platina_lab_bg_b${value.replace('P', '')} tw-opacity-100`
                              : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                          }`}
                          disabled={keyMode === String(value) || !isScoredBaseSongData}
                        >
                          <span className='tw-text-sm tw-font-bold'>{`${value.replace('P', '')}B${value.includes('P') ? '+' : ''}`}</span>
                        </button>
                      ))}
                    </div>
                    <div className='tw-flex tw-flex-1 tw-gap-2'>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className='tw-bg-gray-500 tw-bg-opacity-25 tw-text-light tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 hover:tw-bg-gray-800 tw-transition-all'
                      >
                        {sortOrder === 'asc' ? '이름 ↑' : '이름 ↓'}
                      </button>
                      <button
                        onClick={() => setShowPlusOnly(!showPlusOnly)}
                        className={`tw-text-light tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 tw-transition-all ${
                          showPlusOnly
                            ? 'tw-bg-blue-500 tw-bg-opacity-100 tw-text-white hover:tw-bg-blue-500'
                            : 'tw-bg-gray-500 tw-bg-opacity-25 hover:tw-bg-gray-800'
                        }`}
                      >
                        PLUS ONLY {showPlusOnly ? 'ON' : 'OFF'}
                      </button>
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className='form-select tw-text-sm tw-bg-gray-900 tw-bg-opacity-80 tw-w-36 tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all'
                      >
                        <option value='all'>모든 난이도</option>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((level) => (
                          <option key={level} value={level.toString()}>
                            Lv.{level}
                          </option>
                        ))}
                      </select>

                      <div className='tw-relative tw-flex-1'>
                        <div className='tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none'>
                          <svg
                            className='tw-h-5 tw-w-5 tw-text-gray-400'
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
                          className='tw-w-full tw-bg-gray-500 tw-bg-opacity-25 tw-text-light tw-pl-10 tw-pr-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all'
                          onChange={(e) => setSearchName(e.currentTarget.value)}
                          type='text'
                          placeholder='제목, 제작자명 또는 DLC명으로 검색'
                        />
                      </div>
                    </div>
                    <div className='tw-flex tw-gap-2 tw-items-center'>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`tw-p-2 tw-rounded-md tw-transition-all ${
                          viewMode === 'list'
                            ? 'tw-bg-blue-500 tw-text-white'
                            : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                        }`}
                      >
                        <BsList size={20} />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`tw-p-2 tw-rounded-md tw-transition-all ${
                          viewMode === 'grid'
                            ? 'tw-bg-blue-500 tw-text-white'
                            : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                        }`}
                      >
                        <BsGrid size={20} />
                      </button>
                    </div>
                  </div>
                </div>
                {/* 하단 정보 */}
                <div className='tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold'>
                  <FaCircleCheck className='tw-text-green-500' />
                  <div className='tw-flex tw-items-center tw-gap-1 tw-text-gray-300'>
                    PLATiNA :: LAB Steam Build 18306451 데이터로 동기화됨
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 - 상단 고정 영역만큼 여백 추가 */}
          {/* 상단 고정 영역의 높이에 맞게 조정 필요 */}
          <div
            className={`tw-flex-1 tw-overflow-hidden tw-transition-all tw-w-full'} duration-300`}
          >
            <div className='tw-h-full tw-overflow-y-auto custom-scrollbar custom-scrollbar-always tw-scroll-smooth'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={selectedDlcCode} // 키가 변경될 때마다 애니메이션 트리거
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className='tw-flex tw-flex-col tw-mr-2 tw-gap-1 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-p-4'
                >
                  <div
                    className={`tw-w-full ${viewMode === 'grid' ? 'tw-flex tw-gap-3 tw-flex-wrap tw-justify-between' : 'tw-flex tw-flex-col'}`}
                  >
                    {viewMode === 'list' && (
                      <div className='tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-600 tw-text-gray-400 tw-font-bold tw-text-sm'>
                        <div className='tw-w-[80px] tw-text-center'>곡 이미지</div>
                        <div className='tw-flex tw-flex-1'>
                          <div className='tw-flex-1'>곡 정보</div>
                          <div
                            className={`${!showPlusOnly ? 'tw-w-[576px]' : 'tw-w-[288px]'} tw-text-center`}
                          >
                            난이도
                          </div>
                        </div>
                      </div>
                    )}

                    {filteredSongData.map((songItem, songItemIndex) =>
                      viewMode === 'grid' ? (
                        <RaScorePopupComponent
                          gameCode='platina_lab'
                          key={songItem.title}
                          songItem={songItem}
                          songItemTitle={songItem.title}
                          keyMode={keyMode.replace('P', '')}
                          isVisibleCode={true}
                          judgementType={keyMode.includes('P') ? '1' : '0'}
                        />
                      ) : (
                        <div
                          key={songItem.title}
                          data-song-title={songItem.title}
                          ref={songItemIndex === selectedSongIndex ? selectedSongRef : null}
                          onClick={() =>
                            router.push(`/projectRa/platina_lab/db/title/${songItem.title}`)
                          }
                          className={`tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-700 tw-relative tw-overflow-hidden tw-cursor-pointer ${hoveredTitle === songItem.title ? 'tw-bg-gray-700 tw-bg-opacity-30' : ''} hover:tw-bg-gray-700 hover:tw-bg-opacity-30`}
                          onMouseEnter={() => handleMouseEnter(songItem)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {/* 애니메이션 배경 레이어 */}
                          <div
                            className={`tw-absolute tw-inset-0 tw-opacity-0 tw-transition-opacity tw-duration-300 before:tw-content-[''] before:tw-absolute before:tw-inset-[-150%] before:tw-bg-[length:200%_200%] before:tw-animate-gradientSlide before:tw-bg-gradient-to-r before:tw-from-[#1d8975] before:tw-via-[#5276b4] before:tw-via-[#8432bd] before:tw-via-[#5276b4] before:tw-to-[#1d8975] ${hoveredTitle === songItem.title ? 'tw-opacity-20' : ''} `}
                          />

                          {/* 기존 콘텐츠 */}
                          <div className='tw-relative tw-z-10 tw-w-full tw-flex tw-items-center tw-gap-4'>
                            <div className='tw-w-auto'>
                              <RaScorePopupComponent
                                gameCode='platina_lab'
                                songItem={songItem}
                                songItemTitle={songItem.title}
                                keyMode={keyMode.replace('P', '')}
                                isVisibleCode={true}
                                isScored={false}
                                judgementType={keyMode.includes('P') ? 'HARD' : 'NORMAL'}
                              />
                            </div>
                            <div className='tw-flex tw-flex-1'>
                              <div className='tw-flex-1'>
                                <div className='tw-font-bold'>{songItem.name}</div>
                                <div className='tw-flex tw-gap-2 tw-mt-1'>
                                  <div className='tw-text-gray-400'>
                                    {songItem.artist +
                                      ' / ' +
                                      (songItem.bpm == songItem.bpmLow
                                        ? songItem.bpm
                                        : songItem.bpmLow + '~' + songItem.bpm) +
                                      ' BPM'}
                                  </div>
                                  {/* <div className="tw-text-blue-400">{songItem.dlc || ''}</div> */}
                                </div>
                              </div>

                              {/* 난이도별 고정 칸 */}
                              <div className='tw-flex tw-gap-4 tw-items-center tw-text-center justify-center'>
                                {['EASY', 'HD', 'OVER', 'PLUS_1', 'PLUS_2', 'PLUS_3']
                                  .filter((diff) => !showPlusOnly || diff.startsWith('PLUS_'))
                                  .map((diff) => (
                                    <div key={diff} className='tw-w-20 tw-text-center'>
                                      {songItem.patterns[`${keyMode.replace('P', '')}B`]?.[diff] ? (
                                        <div
                                          className={`tw-flex tw-items-center tw-gap-1 tw-font-extrabold tw-w-full tw-text-center justify-center ${
                                            selectedLevel === 'all' ||
                                            Math.floor(
                                              songItem.patterns[`${keyMode.replace('P', '')}B`][
                                                diff
                                              ].level,
                                            ) == Number(selectedLevel)
                                              ? ''
                                              : 'tw-opacity-30'
                                          } ${diff === 'EASY' && 'tw-text-platina-lab-easy'} ${diff === 'HD' && 'tw-text-platina-lab-hd'} ${diff === 'OVER' && 'tw-text-platina-lab-over'} ${diff === 'PLUS_1' && 'tw-text-platina-lab-plus'} ${diff === 'PLUS_2' && 'tw-text-platina-lab-plus'} ${diff === 'PLUS_3' && 'tw-text-platina-lab-plus'} `}
                                        >
                                          <div className='tw-text-base tw-w-full tw-text-center'>
                                            Lv.
                                            {songItem.patterns[`${keyMode.replace('P', '')}B`][
                                              diff
                                            ].level.toFixed(0)}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className='tw-opacity-30'>
                                          <div className='tw-text-base tw-font-extrabold'>-</div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )}

                    {viewMode === 'grid' &&
                      Array.from(Array(20)).map((_, index) => (
                        <div key={index} className='tw-w-[130px] tw-h-[74px]' />
                      ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  )
}

export default PlatinaLabDbPage
