import React, { useEffect, useRef, useState, useMemo } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import * as R from 'ramda'
import { FaCircleCheck, FaLink } from 'react-icons/fa6'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { SyncLoader } from 'react-spinners'
import { BsList, BsGrid } from 'react-icons/bs'

import 'moment/locale/ko'
import axios from 'axios'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'store'
import { setBackgroundBgaName, setIsDjCommentOpen } from 'store/slices/uiSlice'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import { useInView } from 'react-intersection-observer'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import VirtualizedRaSongList from '@/components/songList/VirtualizedRaSongList'

// 동적 임포트로 ScorePopupComponent 지연 로딩
const RaScorePopupComponent = dynamic(() => import('@/components/score/RaScorePopupComponent'), {
  loading: () => <div className="tw-w-[80px] tw-h-[80px] tw-bg-gray-600 tw-bg-opacity-10" />,
})

export default function VArchiveDbPage() {
  const { showNotification } = useNotificationSystem()
  const dispatch = useDispatch()
  const { wjmaxSongData, userData, vArchiveUserData } = useSelector((state: RootState) => state.app)
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
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [selectedDlcCode, setSelectedDlcCode] = useState<string>('이세돌')

  const [commentRivalName, setCommentRivalName] = useState<string>('')
  const [commentRivalSongItemData, setCommentRivalSongItemData] = useState<any>(null)

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
        const response = wjmaxSongData.filter((wjmaxSongData) => String(wjmaxSongData.title) == String(title))
        const result = response.length > 0 ? response[0] : []
        setSongItemData(result)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchCommentRivalSongItemData = async (title) => {
    try {
      if (commentRivalName !== '') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${commentRivalName}/title/${hoveredTitle}`)
        const result = await response.json()
        setCommentRivalSongItemData(result)
      } else {
        const response = wjmaxSongData.filter((wjmaxSongData) => String(wjmaxSongData.title) == String(title))
        const result = response.length > 0 ? response[0] : []
        setCommentRivalSongItemData(result)
      }
    } catch (error) {
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
          // console.log(error)
        })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // DJ 코멘트 데이터 가져오기 함수
  const fetchCommentData = async () => {
    if (isFetchingCommentData) return // 이미 데이터를 가져오는 중이면 종료
    setIsFetchingCommentData(true)

    try {
      const response = await axios
        .get(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/db/comments?page=${commentPage}&order=ymdt`, {
          headers: {
            Authorization: `${vArchiveUserData.userNo}|${vArchiveUserData.userToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        })
        .then((result) => {
          if (result.data.success) {
            // console.log(result.data.commentList)
            setCommentData((prevData) => [...prevData, ...result.data.commentList])
            setCommentPage((prevPage) => prevPage + 1)
            setHasNextCommentData(result.data.hasNext)
          }
        })
    } catch (error) {
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
        // fetchSongItemData(hoveredTitle)
        // fetchCommentRivalSongItemData(hoveredTitle)
        dispatch(setBackgroundBgaName(String(wjmaxSongData.filter((song) => song.title === hoveredTitle)[0].folderName) + '_preview'))
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
    const chosung = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

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

    const codes = [...new Set(wjmaxSongData.map((song) => song.dlc || '기본'))]
      .filter((code) => code !== '전체') // '전체'는 따로 처리
      .sort((a, b) => {
        const orderA = dlcOrder[a] || 100 // 정의되지 않은 DLC는 중간 순서로
        const orderB = dlcOrder[b] || 100
        return orderA - orderB
      })

    return ['전체', ...codes] // '전체'를 마지막에 추가
  }, [wjmaxSongData])

  // 키보드 네비게이션을 위한 함수
  const handleDlcNavigation = (direction: 'left' | 'right') => {
    const currentIndex = dlcCodeList.indexOf(selectedDlcCode)
    if (direction === 'left') {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : dlcCodeList.length - 1
      setSelectedDlcCode(dlcCodeList[newIndex])
    } else {
      const newIndex = currentIndex < dlcCodeList.length - 1 ? currentIndex + 1 : 0
      setSelectedDlcCode(dlcCodeList[newIndex])
    }
  }

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // 키재 선택된 곡의 인덱스를 추적하기 위한 state 추가
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(-1)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // 필터링된 곡 데이터 계산 (DLC 필터 추가)
  const filteredSongData = useMemo(() => {
    const filtered = wjmaxSongData.filter((songItem) => {
      // 검색어 필터
      const searchFilter = searchName === '' || searchSong(songItem, searchName)

      // DLC 필터
      const dlcFilter = selectedDlcCode === '전체' || (songItem.dlc || '기본') === selectedDlcCode

      // 난이도 필터
      const levelFilter =
        selectedLevel === 'all' ||
        ['NM', 'HD', 'MX', 'SC'].some(
          (difficulty) => Math.floor(songItem.patterns[`${keyMode.replace('P', '')}B`]?.[difficulty]?.level ?? 0) === parseInt(selectedLevel),
        )

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
  }, [wjmaxSongData, searchName, selectedDlcCode, selectedLevel, keyMode, sortOrder])

  // 선택된 곡의 ref를 저장하기 위한 ref 추가
  const selectedSongRef = useRef<HTMLDivElement>(null)

  // 검색 input ref 추가
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 키보드 이벤트 리스너 수정
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

      // 일반 입력 필드에서는 키보드 단축키를 무시 (검색창 제외)
      if ((e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && e.target !== searchInputRef.current) {
        return
      }

      // 메타키(Cmd/Ctrl)나 Alt가 눌려있으면 무시
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return
      }

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleDlcNavigation('left')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleDlcNavigation('right')
      } else if (e.key === '1') {
        e.preventDefault()
        setKeyMode((prev) => {
          if (prev === '4') return '4P'
          else if (prev === '4P') return '6'
          else if (prev === '6') return '6P'
          else return '4'
        })
      } else if (e.key === 'a') {
        e.preventDefault()
        setSortOrder('asc')
      } else if (e.key === 'd') {
        e.preventDefault()
        setSortOrder('desc')
      } else if (e.key === 'v') {
        e.preventDefault()
        setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))
      } else if (e.key === 'q') {
        e.preventDefault()
        setSelectedLevel((prev) => {
          if (Number(prev) - 1 < 1) return 'all'
          else if (prev === 'all') return '20'
          else return String(Number(prev) - 1)
        })
      } else if (e.key === 'e') {
        e.preventDefault()
        setSelectedLevel((prev) => {
          if (Number(prev) + 1 > 20) return 'all'
          else if (prev === 'all') return '1'
          else return String(Number(prev) + 1)
        })
      } else if (viewMode === 'list' && !searchInputRef.current?.contains(document.activeElement)) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedSongIndex((prev) => {
            const newIndex = prev <= 0 ? filteredSongData.length - 1 : prev - 1
            return newIndex
          })
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedSongIndex((prev) => {
            const newIndex = prev >= filteredSongData.length - 1 ? 0 : prev + 1
            return newIndex
          })
        } else if (e.key === 'Enter' && selectedSongIndex >= 0) {
          e.preventDefault()
          const selectedSong = filteredSongData[selectedSongIndex]
          router.push(`/projectRa/wjmax/db/title/${selectedSong.title}`)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [selectedDlcCode, dlcCodeList, viewMode, filteredSongData.length, selectedSongIndex])

  // 초기 선택 인덱스 설정
  useEffect(() => {
    if (viewMode === 'list' && filteredSongData.length > 0 && selectedSongIndex === -1) {
      setSelectedSongIndex(0)
    }
  }, [viewMode, filteredSongData.length])

  // 선택된 곡이 변경될 때 스크롤 처리 추가
  useEffect(() => {
    if (selectedSongIndex >= 0 && viewMode === 'list' && selectedSongRef.current) {
      selectedSongRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })

      const selectedSong = filteredSongData[selectedSongIndex]
      setHoveredTitle(selectedSong.title)
    }
  }, [selectedSongIndex, viewMode])

  const isDjCommentOpen = useSelector((state: RootState) => state.ui.isDjCommentOpen)

  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)

  return (
    selectedGame === 'wjmax' && (
      <React.Fragment>
        <Head>
          <title>
            {String(keyMode).replace('PLUS', '').replace('P', '').replace('B', '').replace('_', '')}B{keyMode.includes('P') ? '+' : ''} 데이터베이스 - R-ARCHIVE
          </title>
        </Head>
        <div className="tw-flex tw-flex-col tw-gap-4 vh-screen tw-relative">
          {/* 상단 영역 */}
          <div className={`tw-flex tw-flex-col tw-gap-4 tw-transition-all duration-300 w-w-full'}`}>
            <div className="tw-flex tw-w-full tw-gap-4">
              <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-4">
                {/* 헤더 */}

                <div className="tw-flex tw-w-full tw-bg-gray-700 tw-bg-opacity-30 tw-rounded tw-overflow-x-auto tw-scroll-smooth">
                  <div className="tw-flex tw-items-center tw-w-full">
                    {dlcCodeList.map((dlcCode, index) => (
                      <button
                        key={dlcCode}
                        ref={(el: HTMLButtonElement | null) => {
                          buttonRefs.current[index] = el
                        }}
                        onClick={() => setSelectedDlcCode(dlcCode)}
                        className={`
                            tw-py-2
                            tw-flex-1
                            tw-min-w-0
                            tw-text-sm tw-font-medium 
                            tw-whitespace-nowrap
                            tw-relative
                            tw-transition-all tw-duration-300
                            ${
                              selectedDlcCode === dlcCode
                                ? 'tw-text-white tw-bg-blue-500'
                                : 'tw-text-gray-400 hover:tw-text-gray-200 hover:tw-bg-gray-600 hover:tw-bg-opacity-30'
                            }
                          `}
                      >
                        {dlcCode}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 설명 내용 */}
                <div className="tw-flex tw-flex-col tw-gap-2">
                  <div className="tw-flex tw-justify-between tw-items-center tw-gap-2">
                    <div className="tw-flex tw-gap-2">
                      {globalDictionary.wjmax.keyModeList.map((value) => (
                        <button
                          key={`keyModeSelector_${value}`}
                          onClick={() => setKeyMode(String(value))}
                          className={`tw-p-2 tw-rounded-md tw-transition-all tw-w-12 ${
                            keyMode === String(value)
                              ? `wjmax_bg_b${value.replace('P', '')} tw-opacity-100`
                              : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                          }`}
                          disabled={keyMode === String(value) || !isScoredBaseSongData}
                        >
                          <span className="tw-text-sm tw-font-bold">{`${value.replace('P', '')}B${value.includes('P') ? '+' : ''}`}</span>
                        </button>
                      ))}
                    </div>
                    <div className="tw-flex tw-flex-1 tw-gap-2">
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="tw-bg-gray-900 tw-bg-opacity-50 tw-text-light tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 hover:tw-bg-gray-800 tw-transition-all"
                      >
                        {sortOrder === 'asc' ? '이름 ↑' : '이름 ↓'}
                      </button>
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="form-select tw-text-sm tw-bg-gray-900 tw-bg-opacity-80 tw-w-36 tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all"
                      >
                        <option value="all">모든 난이도</option>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => (
                          <option key={level} value={level.toString()}>
                            Lv.{level}
                          </option>
                        ))}
                      </select>

                      <div className="tw-relative tw-flex-1">
                        <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
                          <svg className="tw-h-5 tw-w-5 tw-text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>

                        <input
                          ref={searchInputRef}
                          className="tw-w-full tw-bg-gray-900 tw-bg-opacity-50 tw-text-light tw-pl-10 tw-pr-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all"
                          onChange={(e) => setSearchName(e.currentTarget.value)}
                          type="text"
                          placeholder="제목, 제작자명 또는 DLC명으로 검색..."
                        />
                      </div>
                    </div>
                    <div className="tw-flex tw-gap-2 tw-items-center">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`tw-p-2 tw-rounded-md tw-transition-all ${
                          viewMode === 'list' ? 'tw-bg-blue-500 tw-text-white' : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                        }`}
                      >
                        <BsList size={20} />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`tw-p-2 tw-rounded-md tw-transition-all ${
                          viewMode === 'grid' ? 'tw-bg-blue-500 tw-text-white' : 'tw-bg-gray-700 tw-text-gray-300 hover:tw-bg-gray-600'
                        }`}
                      >
                        <BsGrid size={20} />
                      </button>
                    </div>
                  </div>
                </div>
                {/* 하단 정보 */}
                <div className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold">
                  <FaCircleCheck className=" tw-text-green-500" />
                  <div className="tw-flex tw-items-center tw-gap-1 tw-text-gray-300">WJMAX 3.6.1 버전 데이터로 동기화됨</div>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 - 상단 고정 영역만큼 여백 추가 */}
          {/* 상단 고정 영역의 높이에 맞게 조정 필요 */}
          <div className={`tw-flex-1 tw-overflow-hidden tw-transition-all duration-300 tw-w-full'}`}>
            <div className="tw-h-full tw-overflow-y-auto tw-scroll-smooth">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDlcCode} // 키가 변경될 때마다 애니메이션 트리거
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-p-4"
                >
                  <div className={`tw-w-full ${viewMode === 'grid' ? 'tw-flex tw-gap-3 tw-flex-wrap tw-justify-between' : 'tw-flex tw-flex-col'}`}>
                    {viewMode === 'list' && (
                      <div className="tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-600 tw-text-gray-400 tw-font-bold tw-text-sm">
                        <div className="tw-w-[130px] tw-text-center">앨범</div>
                        <div className="tw-flex tw-flex-1">
                          <div className="tw-flex-1">곡 정보</div>
                          <div className="tw-w-96 tw-text-center">난이도</div>
                        </div>
                      </div>
                    )}

                    {filteredSongData.map((songItem, songItemIndex) =>
                      viewMode === 'grid' ? (
                        <RaScorePopupComponent
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
                          ref={songItemIndex === selectedSongIndex ? selectedSongRef : null}
                          onClick={() => router.push(`/projectRa/wjmax/db/title/${songItem.title}`)}
                          className={`
                            tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-700 
                            tw-relative tw-overflow-hidden
                            tw-cursor-pointer
                            hover:tw-bg-transparent
                            ${viewMode === 'list' && selectedSongIndex === songItemIndex ? 'tw-bg-transparent' : 'hover:tw-bg-transparent'}
                          `}
                          onMouseEnter={() => setHoveredTitle(songItem.title)}
                          onMouseLeave={() => setHoveredTitle(null)}
                        >
                          {/* 애니메이션 배경 레이어 */}
                          <div
                            className={`
                              tw-absolute tw-inset-0 tw-opacity-0 tw-transition-opacity tw-duration-300
                              before:tw-content-[''] 
                              before:tw-absolute 
                              before:tw-inset-[-150%]
                              before:tw-bg-[length:200%_200%]
                              before:tw-animate-gradientSlide
                              before:tw-bg-gradient-to-r before:tw-from-[#1d8975] before:tw-via-[#5276b4] before:tw-via-[#8432bd] before:tw-via-[#5276b4] before:tw-to-[#1d8975]
                              ${(viewMode === 'list' && selectedSongIndex === songItemIndex) || hoveredTitle === songItem.title ? 'tw-opacity-20' : ''}
                            `}
                          />

                          {/* 기존 콘텐츠 */}
                          <div className="tw-relative tw-z-10 tw-w-full tw-flex tw-items-center tw-gap-4">
                            <div className="tw-w-auto">
                              <RaScorePopupComponent
                                songItem={songItem}
                                songItemTitle={songItem.title}
                                keyMode={keyMode.replace('P', '')}
                                isVisibleCode={true}
                                isScored={false}
                                judgementType={keyMode.includes('P') ? 'HARD' : 'NORMAL'}
                              />
                            </div>
                            <div className="tw-flex tw-flex-1">
                              <div className="tw-flex-1">
                                <div className="tw-font-bold">{songItem.name}</div>
                                <div className="tw-flex tw-gap-2 tw-mt-1">
                                  <div className="tw-text-gray-400">{songItem.composer}</div>
                                  <div className="tw-text-blue-400">{songItem.dlc || ''}</div>
                                </div>
                              </div>

                              {/* 난이도별 고정 칸 */}
                              <div className="tw-flex tw-gap-4 tw-items-center justify-center">
                                {['NM', 'HD', 'MX', 'SC'].map((diff) => (
                                  <div key={diff} className="tw-w-20 tw-text-center">
                                    {songItem.patterns[`${keyMode.replace('P', '')}B`]?.[diff] ? (
                                      <div
                                        className={`
                                          tw-flex justify-center tw-items-center tw-gap-1 tw-font-extrabold
                                          ${
                                            selectedLevel === 'all' ||
                                            Math.floor(songItem.patterns[`${keyMode.replace('P', '')}B`][diff].level) == Number(selectedLevel)
                                              ? ''
                                              : 'tw-opacity-30'
                                          }
                                          ${diff === 'NM' && 'tw-text-wjmax-nm'}
                                          ${diff === 'HD' && 'tw-text-wjmax-hd'}
                                          ${diff === 'MX' && 'tw-text-wjmax-mx'}
                                          ${diff === 'SC' && 'tw-text-wjmax-sc'}
                                        `}
                                      >
                                        <Image src={`/images/wjmax/nm_${diff.toLowerCase()}.png`} width={24} height={24} alt={diff} />
                                        <div className="tw-text-base">{songItem.patterns[`${keyMode.replace('P', '')}B`][diff].level.toFixed(1)}</div>
                                      </div>
                                    ) : (
                                      <div className="tw-opacity-30">
                                        <div className="tw-text-base tw-font-extrabold">-</div>
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

                    {viewMode === 'grid' && Array.from(Array(20)).map((_, index) => <div key={index} className="tw-w-[130px] tw-h-[74px]" />)}
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
