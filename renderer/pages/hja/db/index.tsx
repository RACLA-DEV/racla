import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BsGrid, BsList } from 'react-icons/bs'
import { useDispatch, useSelector } from 'react-redux'

import HjaScorePopupComponent from '@/components/score/popup/ScorePopupHja'
import { globalDictionary } from '@constants/globalDictionary'
import { logRendererError } from '@utils/rendererLoggerUtils'
import { motion } from 'framer-motion'
import { debounce } from 'lodash'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

import { useNotificationSystem } from '@hooks/useNotifications'
import { useRouter } from 'next/router'

// 동적 임포트로 ScorePopupComponent 지연 로딩
const ScorePopupComponent = dynamic(() => import('@/components/score/popup/ScorePopupDjmax'), {
  loading: () => <div className='tw-w-[80px] tw-h-[80px] tw-bg-gray-600 tw-bg-opacity-20' />,
})

// DLC 카테고리 매핑 추가
const DLC_CATEGORY_MAPPING = {
  LEGACY: ['P1', 'P2', 'P3', 'CE', 'BS', 'TR', 'T1', 'T2', 'T3'],
  RESPECT: ['R'],
  EXTENSION: ['VE', 'VE1', 'VE2', 'VE3', 'VE4', 'VE5'],
  LIBERTY: ['VL', 'VL1', 'VL2'],
  COLLABORATION: ['COLLABORATION'],
}

export default function HjaDbPage() {
  const { showNotification } = useNotificationSystem()
  const dispatch = useDispatch()
  const { songData, userData, vArchiveUserData } = useSelector((state: RootState) => state.app)
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)

  const [keyMode, setKeyMode] = useState<string>('4')
  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [songItemData, setSongItemData] = useState<any>(null)

  const [isFetchingCommentData, setIsFetchingCommentData] = useState(false)
  const [commentData, setCommentData] = useState<any[]>([])
  const [commentPage, setCommentPage] = useState<number>(0)
  const [hasNextCommentData, setHasNextCommentData] = useState(true)

  const [searchName, setSearchName] = useState<string>('')

  const [commentRivalName, setCommentRivalName] = useState<string>('')
  const [commentRivalSongItemData, setCommentRivalSongItemData] = useState<any>(null)

  const isDjCommentOpen = useSelector((state: RootState) => state.ui.isDjCommentOpen)

  const { selectedGame } = useSelector((state: RootState) => state.app)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(-1)
  const selectedSongRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  // selectedDlcCode 상태를 카테고리로 변경
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'LEGACY' | 'RESPECT' | 'EXTENSION' | 'LIBERTY' | 'COLLABORATION'
  >('LEGACY')

  const fetchSongItemData = async (title) => {
    try {
      if (vArchiveUserData.userName !== '') {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/title/${hoveredTitle}`,
        )
        const result = await response.json()
        setSongItemData(result)
      } else {
        const response = songData.filter((songData) => String(songData.title) == String(title))
        const result = response.length > 0 ? response[0] : []
        setSongItemData(result)
      }
    } catch (error) {
      logRendererError(error, { message: 'Error in fetchSongItemData', ...userData })
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    let timer
    if (hoveredTitle) {
      timer = setTimeout(() => {
        fetchSongItemData(hoveredTitle)
        dispatch(setBackgroundBgaName(String(hoveredTitle)))
      }, 500)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [hoveredTitle])

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
      String(songItem.composer).toLowerCase().includes(searchNameLower) ||
      String(songItem.name).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(searchNameLower) ||
      String(songItem.title).includes(searchNameLower)

    const isStringMatchBackspaced =
      String(songItem.composer).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.name).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.title).includes(searchNameLower)
    // 초성 검색
    // const isChosungMatch = isMatchingChosung(songItem.composer, searchName) || isMatchingChosung(songItem.name, searchName)

    return isStringMatch || isStringMatchBackspaced
  }

  const [visibleItems, setVisibleItems] = useState<number>(20) // 초기에 보여줄 아이템 수
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '400px 0px',
  })

  const [selectedDlcCode, setSelectedDlcCode] = useState<string>('R')
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const handleCategoryScroll = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200
      const targetScroll =
        categoryScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
      categoryScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      })
    }
  }

  // 필터링된 곡 데이터 계산 수정
  const filteredSongData = useMemo(() => {
    const filtered = songData.filter((songItem) => {
      const patterns = songItem.patterns[keyMode + 'B']
      const scLevel = patterns?.['SC']?.level ?? 0
      const mxLevel = patterns?.['MX']?.level ?? 0

      // 검색어 필터
      const searchFilter = searchName === '' || searchSong(songItem, searchName)

      // 레벨 필터
      let levelFilter = false
      if (selectedLevel === 'all') {
        // 전체 보기: SC8 이상 또는 MX15 이상
        levelFilter = scLevel >= 8 || mxLevel >= 15
      } else if (selectedLevel === '8') {
        // 레벨 8: SC8 또는 MX15 이상
        levelFilter = (scLevel >= 8 && Math.floor(scLevel) === 8) || mxLevel >= 15
      } else {
        // 그 외 레벨: 해당 레벨의 SC만
        levelFilter = Math.floor(scLevel) === parseInt(selectedLevel)
      }

      // DLC 카테고리 필터
      const categoryFilter =
        selectedCategory === 'all' ||
        DLC_CATEGORY_MAPPING[selectedCategory]?.includes(songItem.dlcCode) ||
        DLC_CATEGORY_MAPPING[selectedCategory]?.includes(songItem.dlc)

      return searchFilter && levelFilter && categoryFilter
    })

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name)
      } else {
        return b.name.localeCompare(a.name)
      }
    })
  }, [songData, searchName, selectedLevel, keyMode, sortOrder, selectedCategory])

  // 스크롤 시 더 많은 아이템 로드
  useEffect(() => {
    if (inView && visibleItems < filteredSongData.length) {
      setVisibleItems((prev) => Math.min(prev + 20, filteredSongData.length))
    }
  }, [inView, filteredSongData.length, visibleItems])

  // 키보드 접근성
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 검색창에 포커스가 있을 때
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault()
          searchInputRef.current.blur()
        }
        return
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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 스크롤 중인지 감지하는 상태 추가
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimer = useRef(null)
  const lastMousePositionRef = useRef({ x: 0, y: 0 })

  // 프리뷰 BGA 변경을 위한 디바운스된 함수
  const debouncedSetBgaName = useMemo(
    () =>
      debounce((title: string) => {
        // title이 0이거나 다른 유효한 값인 경우
        dispatch(setBackgroundBgaName(title))
      }, 300),
    [dispatch, songData],
  )

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
    }, 100)
  }

  // 마우스 이동 핸들러 추가
  const handleMouseMove = (e: MouseEvent) => {
    lastMousePositionRef.current = { x: e.clientX, y: e.clientY }
  }

  // 호버 핸들러 수정
  const handleMouseEnter = (songItem) => {
    if (!isScrolling) {
      setHoveredTitle(songItem.title)
      debouncedSetBgaName(songItem.title)
    }
  }

  const handleMouseLeave = () => {
    if (!isScrolling) {
      setHoveredTitle(null)
      dispatch(setBackgroundBgaName(''))
      debouncedSetBgaName.cancel()
    }
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

  return (
    selectedGame === 'djmax_respect_v' && (
      <React.Fragment>
        <Head>
          <title>{keyMode}B 데이터베이스 - V-ARCHIVE</title>
        </Head>
        <div className='tw-flex tw-flex-col tw-gap-4 vh-screen tw-relative'>
          {/* 상단 영역 */}
          <div className='tw-flex tw-flex-col tw-gap-4 tw-transition-all tw-w-full duration-300'>
            <div className='tw-flex tw-w-full tw-gap-4'>
              <div className='tw-flex tw-w-full tw-flex-col tw-gap-4 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-shadow-lg tw-p-4'>
                {/* 헤더 */}
                <div className='tw-flex tw-w-full tw-bg-gray-700 tw-bg-opacity-30 tw-rounded tw-overflow-x-auto tw-scroll-smooth'>
                  <div className='tw-flex tw-flex-col tw-gap-4 tw-p-4 tw-w-full'>
                    {/* 카테고리 영역 */}
                    <div className='tw-flex tw-w-full tw-items-center tw-gap-2'>
                      <div className='tw-flex tw-w-full tw-bg-gray-700 tw-bg-opacity-30 tw-rounded tw-overflow-x-auto tw-scroll-smooth'>
                        <div className='tw-flex tw-items-center tw-w-full'>
                          <button
                            onClick={() => setSelectedCategory('all')}
                            className={`tw-py-2 tw-flex-1 tw-min-w-0 tw-text-sm tw-font-medium tw-whitespace-nowrap tw-relative tw-transition-all tw-duration-300 ${
                              selectedCategory === 'all'
                                ? 'tw-text-white tw-bg-blue-500'
                                : 'tw-text-gray-400 hover:tw-text-gray-200 hover:tw-bg-gray-600 hover:tw-bg-opacity-30'
                            }`}
                          >
                            전체
                          </button>
                          {['LEGACY', 'RESPECT', 'EXTENSION', 'LIBERTY', 'COLLABORATION'].map(
                            (category) => (
                              <button
                                key={category}
                                onClick={() =>
                                  setSelectedCategory(category as typeof selectedCategory)
                                }
                                className={`tw-py-2 tw-flex-1 tw-min-w-0 tw-text-sm tw-font-medium tw-whitespace-nowrap tw-relative tw-transition-all tw-duration-300 ${
                                  selectedCategory === category
                                    ? 'tw-text-white tw-bg-blue-500'
                                    : 'tw-text-gray-400 hover:tw-text-gray-200 hover:tw-bg-gray-600 hover:tw-bg-opacity-30'
                                }`}
                              >
                                {category}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='tw-flex tw-items-center tw-justify-between'>
                      <div className='tw-flex tw-gap-2'>
                        <div className='tw-flex tw-gap-2'>
                          {globalDictionary[selectedGame].keyModeList.map((mode) => (
                            <button
                              key={`mode_${mode}`}
                              onClick={() => setKeyMode(String(mode))}
                              className={`tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-0.5 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md tw-flex-1 ${
                                String(mode) === keyMode
                                  ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                                  : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100'
                              }`}
                            >
                              <div
                                className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 ${
                                  selectedGame === 'djmax_respect_v' ? 'respect' : 'wjmax'
                                }_bg_b${String(mode).replace('P', '')}`}
                              />
                              <span className='tw-relative tw-text-base tw-font-bold'>
                                {String(mode).replace('P', '')}B
                                {String(mode).includes('P') ? '+' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className='tw-flex tw-flex-1 tw-gap-2 tw-ml-4'>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className='tw-bg-gray-900 tw-bg-opacity-50 tw-text-light tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 hover:tw-bg-gray-800 tw-transition-all'
                        >
                          {sortOrder === 'asc' ? '이름 ↑' : '이름 ↓'}
                        </button>
                        <select
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          className='form-select tw-text-sm tw-bg-gray-900 tw-bg-opacity-80 tw-w-36 tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all'
                        >
                          <option value='all'>모든 난이도</option>
                          {Array.from({ length: 8 }, (_, i) => i + 8).map((level) => (
                            <option key={level} value={level.toString()}>
                              SC {level}
                              {level === 8 ? ' + MX 15' : ''}
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
                            className='tw-w-full tw-bg-gray-900 tw-bg-opacity-50 tw-text-light tw-pl-10 tw-pr-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all'
                            onChange={(e) => setSearchName(e.currentTarget.value)}
                            type='text'
                            placeholder='제목, 제작자명 또는 DLC명으로 검색'
                          />
                        </div>
                      </div>
                      <div className='tw-flex tw-gap-2 tw-items-center tw-ml-4'>
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
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className='tw-flex-1 tw-overflow-hidden tw-transition-all tw-w-full duration-300'>
            <div className='tw-h-full tw-overflow-y-auto tw-scroll-smooth custom-scrollbar custom-scrollbar-always'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='tw-flex tw-mr-2 tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-md tw-p-4'
              >
                <div
                  className={`tw-w-full ${viewMode === 'grid' ? 'tw-flex tw-gap-3 tw-flex-wrap tw-justify-between' : 'tw-flex tw-flex-col'}`}
                >
                  {viewMode === 'list' && (
                    <div className='tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-600 tw-text-gray-400 tw-font-bold tw-text-sm'>
                      <div className='tw-w-[80px] tw-text-center'>곡 이미지</div>
                      <div className='tw-flex tw-flex-1'>
                        <div className='tw-flex-1'>곡 정보</div>
                        <div className='tw-w-48 tw-text-center'>난이도</div>
                      </div>
                    </div>
                  )}

                  {filteredSongData.map((songItem, songItemIndex) =>
                    viewMode === 'grid' ? (
                      <HjaScorePopupComponent
                        isVisibleCode={true}
                        key={songItem.title}
                        songItem={songItem}
                        keyMode={String(keyMode)}
                      />
                    ) : (
                      <div
                        key={songItem.title}
                        data-song-title={songItem.title}
                        className={`tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-700 tw-relative tw-overflow-hidden tw-cursor-pointer ${hoveredTitle === songItem.title ? 'tw-bg-gray-700 tw-bg-opacity-30' : ''} hover:tw-bg-gray-700 hover:tw-bg-opacity-30`}
                        onMouseEnter={() => handleMouseEnter(songItem)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => {
                          if (songItem.hardArchiveTitle) {
                            router.push(`/hja/db/title/${songItem.title}`)
                          } else {
                            showNotification(
                              '전일 아카이브 수록곡 고유 ID(UUID) 정보가 없습니다. 피드백 센터로 해당 수록곡의 데이터 갱신 요청을 문의해주세요.',
                              'tw-bg-red-600',
                            )
                          }
                        }}
                      >
                        {/* 애니메이션 배경 레이어 */}
                        <div
                          className={`tw-absolute tw-inset-0 tw-opacity-0 tw-transition-opacity tw-duration-300 before:tw-content-[''] before:tw-absolute before:tw-inset-[-150%] before:tw-bg-[length:200%_200%] before:tw-animate-gradientSlide before:tw-bg-gradient-to-r before:tw-from-[#1d8975] before:tw-via-[#5276b4] before:tw-via-[#8432bd] before:tw-via-[#5276b4] before:tw-to-[#1d8975] ${(viewMode === 'list' && selectedSongIndex === songItemIndex) || hoveredTitle === songItem.title ? 'tw-opacity-20' : ''} `}
                        />

                        {/* 곡 정보 */}
                        <div className='tw-relative tw-z-10 tw-w-full tw-flex tw-items-center tw-gap-4'>
                          <HjaScorePopupComponent
                            isVisibleCode={true}
                            key={songItem.title}
                            songItem={songItem}
                            keyMode={String(keyMode)}
                          />
                          <div className='tw-flex tw-flex-1'>
                            <div className='tw-flex tw-flex-col tw-flex-1'>
                              <span className='tw-text-sm tw-text-gray-400'>
                                {songItem.composer}
                              </span>
                              <span className='tw-font-bold'>{songItem.name}</span>
                            </div>
                            {/* 난이도별 고정 칸 */}
                            <div className='tw-flex tw-gap-4 tw-items-center justify-center'>
                              {['MX', 'SC'].map((diff) => {
                                const pattern =
                                  songItem.patterns[`${keyMode.replace('P', '')}B`]?.[diff]
                                const level = pattern?.level

                                // 기본 표시 조건
                                const baseShowCondition =
                                  (diff === 'MX' && level >= 15) || (diff === 'SC' && level >= 8)

                                // 하이라이트 조건 수정
                                const shouldHighlight =
                                  (diff === 'SC' &&
                                    (selectedLevel === 'all' ||
                                      Math.floor(level) === parseInt(selectedLevel))) || // SC 하이라이트 조건
                                  (diff === 'MX' &&
                                    level >= 15 &&
                                    (selectedLevel === 'all' || selectedLevel === '8')) // MX 하이라이트 조건

                                const opacity = !shouldHighlight ? 'tw-opacity-30' : ''

                                return baseShowCondition ? (
                                  <div key={diff} className='tw-w-20 tw-text-center'>
                                    <div
                                      className={`tw-flex tw-justify-center tw-items-center tw-gap-1 tw-font-extrabold ${diff === 'MX' && 'tw-text-respect-nm-15'} ${diff === 'SC' && 'tw-text-respect-sc-15'} ${opacity}`}
                                    >
                                      <Image
                                        src={`/images/djmax_respect_v/nm_${diff}_star.png`}
                                        width={16}
                                        height={16}
                                        alt={diff}
                                      />
                                      <div className='tw-text-base'>{level}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div key={diff} className='tw-opacity-30'>
                                    <div className='tw-text-base tw-font-extrabold'>-</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                  {viewMode == 'grid' &&
                    Array.from(Array(20)).map((_, index) => (
                      <div key={index} className='tw-w-[80px] tw-h-[80px]' />
                    ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  )
}
