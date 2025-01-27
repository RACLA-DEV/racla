import 'moment/locale/ko'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BsGrid, BsList } from 'react-icons/bs'
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'
import { setBackgroundBgaName, setIsDjCommentOpen } from 'store/slices/uiSlice'

import { logRendererError } from '@/libs/client/rendererLogger'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import { globalDictionary } from '@/libs/server/globalDictionary'
import axios from 'axios'
import { motion } from 'framer-motion'
import { debounce } from 'lodash'
import moment from 'moment'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { IconContext } from 'react-icons'
import { useInView } from 'react-intersection-observer'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'

// 동적 임포트로 ScorePopupComponent 지연 로딩
const ScorePopupComponent = dynamic(() => import('@/components/score/ScorePopupComponent'), {
  loading: () => <div className='tw-w-[80px] tw-h-[80px] tw-bg-gray-600 tw-bg-opacity-10' />,
})

export default function VArchiveDbPage() {
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
  const [difficulty, setDifficulty] = useState<'all' | 'sc'>('all')

  const router = useRouter()

  // URL 패턴을 정규식으로 정의
  const urlPattern = /https?:\/\/[^\s]+/g

  // 문자열에서 URL을 링크로 변환하고 줄바꿈을 처리하는 함수
  const parseText = (text) => {
    // 줄바꿈을 <br /> 태그로 변환
    const newText = text.replace(/\n/g, '<br>').replace(urlPattern, (url) => {
      // URL을 링크로 변환
      const splited = String(url).split('<br>')

      return `<a href="#" onclick="window.ipc.openBrowser('${splited.length > 1 ? String(url).split('<br>')[0] : String(url)}'); return false;">${
        splited.length > 1 ? String(url).split('<br>')[0] : String(url)
      }(<svg style="display: inline;" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"></path></svg>)</a>${
        splited.length > 1 ? '<br>' + splited.filter((v, index) => index != 0).join('<br>') : ''
      }`
    })

    return newText
  }

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

  const fetchCommentRivalSongItemData = async (title) => {
    try {
      if (commentRivalName !== '') {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${commentRivalName}/title/${hoveredTitle}`,
        )
        const result = await response.json()
        setCommentRivalSongItemData(result)
      } else {
        const response = songData.filter((songData) => String(songData.title) == String(title))
        const result = response.length > 0 ? response[0] : []
        setCommentRivalSongItemData(result)
      }
    } catch (error) {
      logRendererError(error, { message: 'Error in fetchCommentRivalSongItemData', ...userData })
      console.error('Error fetching data:', error)
    }
  }

  const [voteComment, setVoteComment] = useState<number>(null)

  const updateCommentVote = async (title, cmtNo, cmd) => {
    try {
      const response = await axios
        .post(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/db/title/${title}/comment/${cmtNo}/vote`,
          {
            vote: 1,
            cmd,
          },
          {
            method: 'POST',
            headers: {
              Authorization: `${vArchiveUserData.userNo}|${vArchiveUserData.userToken}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          },
        )
        .then((data) => {
          if (data.data.success) {
            setVoteComment(cmtNo)
            setCommentData(
              commentData.map((commentItem) => {
                if (commentItem.cmtNo === cmtNo) {
                  return data.data.comment
                } else {
                  return commentItem
                }
              }),
            )
          }
        })
        .catch((error) => {
          logRendererError(error, { message: 'Error in updateCommentVote', ...userData })
          // console.log(error)
        })
    } catch (error) {
      logRendererError(error, { message: 'Error in updateCommentVote', ...userData })
      console.error('Error fetching data:', error)
    }
  }

  // DJ 코멘트 데이터 가져오기 함수
  const fetchCommentData = async () => {
    if (isFetchingCommentData) return // 이미 데이터를 가져오는 중이면 종료
    setIsFetchingCommentData(true)

    try {
      const response = await axios
        .get(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/db/comments?page=${commentPage}&order=ymdt`,
          {
            headers: {
              Authorization: `${vArchiveUserData.userNo}|${vArchiveUserData.userToken}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          },
        )
        .then((result) => {
          if (result.data.success) {
            // console.log(result.data.commentList)
            setCommentData((prevData) => [...prevData, ...result.data.commentList])
            setCommentPage((prevPage) => prevPage + 1)
            setHasNextCommentData(result.data.hasNext)
          }
        })
    } catch (error) {
      logRendererError(error, { message: 'Error in fetchCommentData', ...userData })
      console.error('Error fetching data:', error)
    } finally {
      setIsFetchingCommentData(false)
    }
  }

  useEffect(() => {
    fetchCommentData()
  }, [])

  useEffect(() => {
    let timer
    if (hoveredTitle) {
      timer = setTimeout(() => {
        fetchSongItemData(hoveredTitle)
        fetchCommentRivalSongItemData(hoveredTitle)
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

  // 필터링된 곡 데이터 계산
  const filteredSongData = useMemo(() => {
    const filtered = songData.filter((songItem) => {
      // 검색어 필터
      const searchFilter = searchName === '' || searchSong(songItem, searchName)

      // 난이도 필터
      const levelFilter =
        difficulty === 'all'
          ? selectedLevel === 'all' ||
            ['NM', 'HD', 'MX', 'SC'].some(
              (diff) =>
                Math.floor(songItem.patterns[keyMode + 'B']?.[diff]?.level ?? 0) ===
                parseInt(selectedLevel),
            )
          : songItem.patterns[keyMode + 'B']?.['SC']?.level && // SC 난이도 존재 확인
            (selectedLevel === 'all' ||
              Math.floor(songItem.patterns[keyMode + 'B']?.['SC']?.level) ===
                parseInt(selectedLevel))

      // DLC 필터 추가
      const dlcFilter = selectedDlcCode === 'all' || songItem.dlcCode === selectedDlcCode

      return searchFilter && levelFilter && dlcFilter
    })

    // 정렬 적용
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name)
      } else {
        return b.name.localeCompare(a.name)
      }
    })
  }, [songData, searchName, selectedLevel, keyMode, sortOrder, selectedDlcCode, difficulty])

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
              <div className='tw-flex tw-w-full tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-4'>
                {/* 헤더 */}
                <div className='tw-flex tw-w-full tw-bg-gray-700 tw-bg-opacity-30 tw-rounded tw-overflow-x-auto tw-scroll-smooth'>
                  <div className='tw-flex tw-flex-col tw-gap-4 tw-p-4 tw-w-full'>
                    <div className='tw-flex tw-w-full tw-items-center tw-gap-2'>
                      {/* 왼쪽 스크롤 버튼 */}
                      <button
                        onClick={() => handleCategoryScroll('left')}
                        className='tw-flex-none tw-p-2 tw-rounded-md tw-bg-gray-700 tw-bg-opacity-80 hover:tw-bg-gray-600'
                      >
                        <FaChevronLeft className='tw-text-gray-300' />
                      </button>

                      {/* 스크롤 가능한 중앙 영역 */}
                      <div
                        ref={categoryScrollRef}
                        className='tw-flex-1 tw-flex tw-gap-2 tw-overflow-x-auto tw-scroll-smooth tw-scrollbar-thin tw-scrollbar-thumb-gray-600 tw-scrollbar-track-transparent'
                      >
                        <button
                          onClick={() => setSelectedDlcCode('all')}
                          className={`tw-flex-none tw-p-2 tw-rounded-md tw-transition-all tw-min-w-20 ${
                            selectedDlcCode === 'all'
                              ? 'tw-bg-blue-500 tw-text-white'
                              : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                          }`}
                        >
                          전체 보기
                        </button>
                        {globalDictionary.djmax_respect_v.dlcList.map((item, index) => (
                          <button
                            key={item[0]}
                            onClick={() => setSelectedDlcCode(item[0])}
                            className={`tw-flex-none tw-p-2 tw-rounded-md tw-transition-all tw-min-w-12 ${
                              selectedDlcCode === item[0]
                                ? 'tw-bg-blue-500 tw-text-white'
                                : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                            }`}
                          >
                            {item[0]}
                          </button>
                        ))}
                      </div>

                      {/* 오른쪽 스크롤 버튼 */}
                      <button
                        onClick={() => handleCategoryScroll('right')}
                        className='tw-flex-none tw-p-2 tw-rounded-md tw-bg-gray-700 tw-bg-opacity-80 hover:tw-bg-gray-600'
                      >
                        <FaChevronRight className='tw-text-gray-300' />
                      </button>
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
                        <button
                          onClick={() => {
                            console.log('Current difficulty:', difficulty)
                            setDifficulty(difficulty === 'all' ? 'sc' : 'all')
                            console.log('New difficulty:', difficulty === 'all' ? 'sc' : 'all')
                          }}
                          className={`tw-text-light tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 tw-transition-all ${
                            difficulty === 'sc'
                              ? 'tw-bg-blue-500 tw-bg-opacity-100 tw-text-white hover:tw-bg-blue-500'
                              : 'tw-bg-gray-900 tw-bg-opacity-50 hover:tw-bg-gray-800'
                          }`}
                        >
                          SC ONLY {difficulty === 'sc' ? 'ON' : 'OFF'}
                        </button>
                        <select
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          className='form-select tw-text-sm tw-bg-gray-900 tw-bg-opacity-80 tw-w-36 tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all'
                        >
                          <option value='all'>모든 난이도</option>
                          {Array.from({ length: 15 }, (_, i) => i + 1).map((level) => (
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
          {/* 메인 콘텐츠 영역 */}
          <div className='tw-flex-1 tw-overflow-hidden tw-transition-all tw-w-full duration-300'>
            <div className='tw-h-full tw-overflow-y-auto tw-scroll-smooth custom-scrollbar custom-scrollbar-always'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='tw-flex tw-mr-2 tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-p-4'
              >
                <div
                  className={`tw-w-full ${viewMode === 'grid' ? 'tw-flex tw-gap-3 tw-flex-wrap tw-justify-between' : 'tw-flex tw-flex-col'}`}
                >
                  {viewMode === 'list' && (
                    <div className='tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-600 tw-text-gray-400 tw-font-bold tw-text-sm'>
                      <div className='tw-w-[80px] tw-text-center'>곡 이미지</div>
                      <div className='tw-flex tw-flex-1'>
                        <div className='tw-flex-1'>곡 정보</div>
                        <div className='tw-w-96 tw-text-center'>난이도</div>
                      </div>
                    </div>
                  )}

                  {filteredSongData.map((songItem, songItemIndex) =>
                    viewMode === 'grid' ? (
                      <ScorePopupComponent
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
                          router.push(`/vArchive/db/title/${songItem.title}`)
                        }}
                      >
                        {/* 애니메이션 배경 레이어 */}
                        <div
                          className={`tw-absolute tw-inset-0 tw-opacity-0 tw-transition-opacity tw-duration-300 before:tw-content-[''] before:tw-absolute before:tw-inset-[-150%] before:tw-bg-[length:200%_200%] before:tw-animate-gradientSlide before:tw-bg-gradient-to-r before:tw-from-[#1d8975] before:tw-via-[#5276b4] before:tw-via-[#8432bd] before:tw-via-[#5276b4] before:tw-to-[#1d8975] ${(viewMode === 'list' && selectedSongIndex === songItemIndex) || hoveredTitle === songItem.title ? 'tw-opacity-20' : ''} `}
                        />

                        {/* 곡 정보 */}
                        <div className='tw-relative tw-z-10 tw-w-full tw-flex tw-items-center tw-gap-4'>
                          <ScorePopupComponent
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
                              {['NM', 'HD', 'MX', 'SC'].map((diff) => (
                                <div key={diff} className='tw-w-20 tw-text-center'>
                                  {songItem.patterns[`${keyMode.replace('P', '')}B`]?.[diff] ? (
                                    <div
                                      className={`tw-flex tw-justify-center tw-items-center tw-gap-1 tw-font-extrabold ${
                                        selectedLevel === 'all' ||
                                        (difficulty === 'all'
                                          ? Math.floor(
                                              songItem.patterns[`${keyMode.replace('P', '')}B`][
                                                diff
                                              ].level,
                                            ) == Number(selectedLevel)
                                          : diff === 'SC' &&
                                            Math.floor(
                                              songItem.patterns[`${keyMode.replace('P', '')}B`][
                                                'SC'
                                              ]?.level,
                                            ) == Number(selectedLevel))
                                          ? ''
                                          : 'tw-opacity-30'
                                      } ${diff === 'NM' && 'tw-text-respect-nm-5'} ${diff === 'HD' && 'tw-text-respect-nm-10'} ${diff === 'MX' && 'tw-text-respect-nm-15'} ${diff === 'SC' && 'tw-text-respect-sc-15'} `}
                                    >
                                      <Image
                                        src={`/images/djmax_respect_v/nm_${diff}_star.png`}
                                        width={16}
                                        height={16}
                                        alt={diff}
                                      />
                                      <div className='tw-text-base'>
                                        {
                                          songItem.patterns[`${keyMode.replace('P', '')}B`][diff]
                                            .level
                                        }
                                      </div>
                                    </div>
                                  ) : (
                                    <div key={diff} className='tw-opacity-30 tw-text-center'>
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
                  {viewMode == 'grid' &&
                    Array.from(Array(20)).map((_, index) => (
                      <div key={index} className='tw-w-[80px] tw-h-[80px]' />
                    ))}
                </div>
              </motion.div>
            </div>
          </div>

          <button
            onClick={() => dispatch(setIsDjCommentOpen(!isDjCommentOpen))}
            className='tw-fixed tw-right-0 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-bg-gray-600 tw-bg-opacity-50 tw-p-2 tw-h-8 tw-w-7 tw-rounded-l-md tw-z-50'
          >
            <FaChevronLeft
              className={`tw-transition-transform ${isDjCommentOpen ? 'tw-rotate-180' : ''}`}
            />
          </button>

          {/* DJ 코멘트 패널 */}
          <div
            className={`tw-fixed tw-z-[49] tw-top-12 tw-bottom-8 tw-p-4 tw-rounded-l-md tw-w-[calc(33.3%-6rem)] tw-transition-transform tw-duration-300 tw-ease-in-out tw-min-w-[30rem] tw-bg-gray-950 tw-bg-opacity-50 tw-backdrop-blur-xl tw-transform ${isDjCommentOpen ? 'tw-translate-x-0 tw-right-0' : 'tw-translate-x-full tw-right-0'}`}
          >
            <div
              className={
                'tw-flex tw-flex-col tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg ' +
                (vArchiveUserData.userName !== '' ? 'tw-h-full' : 'tw-h-full')
              }
            >
              <div className='tw-flex tw-items-center tw-justify-between tw-p-6 tw-pb-0'>
                <span className='tw-text-lg tw-font-bold tw-text-white'>💬 DJ 코멘트</span>
              </div>

              <div className='tw-flex tw-flex-col tw-gap-4 tw-p-6 tw-overflow-y-auto'>
                {commentData.length > 0 ? (
                  commentData
                    .filter((commentItem) => commentItem.nickname !== vArchiveUserData.userName)
                    .map((commentItem) => (
                      <div
                        key={commentItem.cmtNo}
                        className='tw-flex tw-w-full tw-gap-1 tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-4 hover:tw-bg-opacity-40 tw-transition-all'
                        onMouseEnter={() => {
                          setHoveredTitle(String(commentItem.title))
                          setSongItemData(null)
                        }}
                        onMouseLeave={() => {
                          setHoveredTitle(null)
                          dispatch(setBackgroundBgaName(''))
                        }}
                      >
                        <ScorePopupComponent
                          songItemTitle={commentItem.title}
                          keyMode={keyMode}
                          rivalName={commentItem.nickname}
                          delay={{ show: vArchiveUserData.userName !== '' ? 500 : 500, hide: 0 }}
                        />
                        <div className='tw-flex tw-flex-col tw-gap-2 flex-equal'>
                          <div className='tw-flex tw-gap-2 tw-items-center tw-animate-fadeInOnly'>
                            <span className='tw-font-extrabold tw-text-base'>
                              {commentItem.nickname}
                            </span>
                            <span className='tw-font-light tw-text-xs tw-text-gray-400'>
                              {moment(commentItem.ymdt).locale('ko').format('LL')}
                            </span>
                          </div>
                          <span
                            className='tw-animate-fadeInDown'
                            dangerouslySetInnerHTML={{
                              __html: `
                                        ${parseText(commentItem.comment)}
                                        `,
                            }}
                          />
                          <div
                            className={`tw-flex tw-items-center tw-justify-end tw-gap-2 tw-mt-2 tw-transition-all ${
                              vArchiveUserData.userNo !== ''
                                ? 'tw-cursor-pointer hover:tw-text-red-400'
                                : ''
                            }`}
                            onClick={() => {
                              if (
                                vArchiveUserData.userNo !== '' &&
                                vArchiveUserData.userToken !== '' &&
                                vArchiveUserData.userName !== ''
                              ) {
                                if (commentItem.myVote === 1) {
                                  updateCommentVote(commentItem.title, commentItem.cmtNo, 'DELETE')
                                } else {
                                  updateCommentVote(commentItem.title, commentItem.cmtNo, 'POST')
                                }
                              } else {
                                showNotification(
                                  'DJ 코멘트 좋아요 기능은 로그인 또는 V-ARCHIVE 계정 연동이 필요합니다.',
                                  'tw-bg-red-600',
                                )
                              }
                            }}
                          >
                            <div
                              className={`tw-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-gray-800 tw-bg-opacity-50 ${commentItem.myVote === 1 ? 'tw-text-red-400 tw-border-red-400' : 'tw-text-gray-400 tw-border-gray-600'} tw-border tw-border-opacity-30 tw-transition-all ${vArchiveUserData.userNo !== '' ? 'hover:tw-border-opacity-50' : ''}`}
                            >
                              <span>
                                <IconContext.Provider
                                  value={{
                                    className: `tw-text-sm ${
                                      voteComment === commentItem.cmtNo && commentItem.myVote === 1
                                        ? 'tw-animate-scaleUpAndScaleDown'
                                        : voteComment === commentItem.cmtNo &&
                                            commentItem.myVote === 0
                                          ? 'tw-animate-scaleDownAndScaleUp'
                                          : ''
                                    }`,
                                  }}
                                >
                                  {commentItem.myVote === 1 ? <FaHeart /> : <FaRegHeart />}
                                </IconContext.Provider>
                              </span>
                              <span
                                className={`tw-text-sm tw-font-medium ${commentItem.myVote === 1 ? 'tw-text-red-400' : 'tw-text-gray-400'}`}
                              >
                                {commentItem.vote}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : isFetchingCommentData ? (
                  <div className='tw-flex tw-justify-center tw-items-center tw-py-8'>
                    <SyncLoader color='#ffffff' size={8} />
                  </div>
                ) : !hasNextCommentData ? (
                  <div className='tw-flex tw-justify-center tw-items-center tw-py-8 tw-text-gray-400'>
                    등록된 DJ 코멘트가 없습니다.
                  </div>
                ) : null}

                {commentData.length > 0 && hasNextCommentData && (
                  <button
                    onClick={() => fetchCommentData()}
                    className='tw-mt-2 tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-3 tw-font-bold hover:tw-bg-opacity-40 tw-transition-all'
                  >
                    더보기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  )
}
