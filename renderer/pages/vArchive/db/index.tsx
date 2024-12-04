import React, { useEffect, useRef, useState, useMemo } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import * as R from 'ramda'
import { FaChevronLeft, FaCircleCheck, FaCircleInfo, FaHeart, FaLink, FaRegHeart, FaRotate, FaTriangleExclamation } from 'react-icons/fa6'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'
import moment from 'moment'
import { randomUUID } from 'crypto'
import { SyncLoader } from 'react-spinners'

import 'moment/locale/ko'
import axios from 'axios'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'store'
import { getDifficultyClassName, getDifficultyScoreBarClassName, getDifficultyStarImage, getDifficultyTextClassName } from '@/libs/client/respectUtils'
import { setBackgroundBgaName, setIsDjCommentOpen } from 'store/slices/uiSlice'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import { useInView } from 'react-intersection-observer'
import dynamic from 'next/dynamic'

// 동적 임포트로 ScorePopupComponent 지연 로딩
const ScorePopupComponent = dynamic(() => import('@/components/score/ScorePopupComponent'), {
  loading: () => <div className="tw-w-[80px] tw-h-[80px] tw-bg-gray-600 tw-bg-opacity-10" />,
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
        const response = songData.filter((songData) => String(songData.title) == String(title))
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

  const [visibleItems, setVisibleItems] = useState<number>(20) // 초기에 보여줄 아이템 수
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '400px 0px',
  })

  // 필터링된 곡 데이터 계산
  const filteredSongData = useMemo(() => {
    return songData.filter((songItem) => {
      if (searchName !== '') {
        return searchSong(songItem, searchName)
      }
      return true
    })
  }, [songData, searchName])

  // 스크롤 시 더 많은 아이템 로드
  useEffect(() => {
    if (inView && visibleItems < filteredSongData.length) {
      setVisibleItems((prev) => Math.min(prev + 20, filteredSongData.length))
    }
  }, [inView, filteredSongData.length, visibleItems])

  const isDjCommentOpen = useSelector((state: RootState) => state.ui.isDjCommentOpen)

  const { selectedGame } = useSelector((state: RootState) => state.app)

  return (
    selectedGame == 'djmax_respect_v' && (
      <React.Fragment>
        <Head>
          <title>데이터베이스({keyMode}B) - 프로젝트 RA</title>
        </Head>
        <div className="tw-flex tw-gap-4 vh-screen tw-relative">
          {/* 곡 데이터 */}
          <div className={`tw-flex tw-flex-col tw-transition-all duration-300 tw-w-full`}>
            <div className="tw-flex tw-w-full tw-gap-4">
              {/* 상단 설명 섹션 */}
              <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-4">
                {/* 헤더 */}
                <div className="tw-flex tw-w-full tw-items-end tw-justify-between">
                  <span className="tw-text-xl tw-font-bold tw-text-white">💿 데이터베이스</span>
                  <div className="tw-flex tw-items-center tw-gap-2">
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
                        <div className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b${mode}`} />
                        <span className="tw-relative tw-text-base tw-font-bold">{mode}B</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 설명 내용 */}
                <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2">
                  <p className="tw-leading-relaxed">DJMAX RESPECT V의 모든 수록곡 정보와 V-ARCHIVE에 등록된 DJ 코멘트를 확인할 수 있습니다.</p>
                  <div className="tw-flex tw-flex-col tw-gap-2">
                    <div className="tw-relative">
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
                        className="tw-w-full tw-bg-gray-900 tw-bg-opacity-50 tw-text-light tw-pl-10 tw-pr-4 tw-py-3 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all"
                        onChange={(e) => setSearchName(e.currentTarget.value)}
                        type="text"
                        placeholder="제목, 제작자명 또는 DLC명으로 검색..."
                      />
                    </div>
                  </div>
                </div>

                {/* 하단 정보 */}
                <div className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold">
                  <FaCircleCheck className=" tw-text-green-500" />
                  <div className="tw-flex tw-items-center tw-gap-1 tw-text-gray-300">
                    V-ARCHIVE와 실시간으로 동기화됨 (
                    <span
                      className="tw-inline-flex tw-items-center tw-gap-1 tw-text-blue-400 hover:tw-text-blue-300 tw-cursor-pointer tw-transition-colors"
                      onClick={() => window.ipc.send('openBrowser', 'https://v-archive.net/db')}
                    >
                      <FaLink className="tw-text-sm" />
                      V-ARCHIVE 데이터베이스 바로가기
                    </span>
                    )
                  </div>
                </div>
              </div>
            </div>

            <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-h-full tw-overflow-y-auto tw-scroll-smooth">
              <div className="tw-flex">
                <div className={`tw-text-center tw-w-full tw-flex tw-gap-3 tw-flex-wrap tw-justify-between`}>
                  {filteredSongData.slice(0, visibleItems).map((songItem, songItemIndex) => (
                    <ScorePopupComponent key={songItem.title} songItem={songItem} keyMode={keyMode} isScored={false} isVisibleCode={true} />
                  ))}
                  {Array.from(Array(20)).map((_, index) => (
                    <div key={index} className="tw-w-[80px] tw-h-[80px]" />
                  ))}
                  {visibleItems < filteredSongData.length && (
                    <div ref={ref} className="tw-w-full tw-h-20 tw-flex tw-items-center tw-justify-center">
                      <SyncLoader color="#ffffff" size={8} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DJ 코멘트 토글 버튼 */}
          <button
            onClick={() => dispatch(setIsDjCommentOpen(!isDjCommentOpen))}
            className="tw-fixed tw-right-0 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-bg-gray-600 tw-bg-opacity-50 tw-p-2 tw-h-8 tw-w-7 tw-rounded-l-md tw-z-50"
          >
            <FaChevronLeft className={`tw-transition-transform ${isDjCommentOpen ? 'tw-rotate-180' : ''}`} />
          </button>

          {/* DJ 코멘트 패널 */}
          <div
            className={`tw-fixed tw-top-12 tw-bottom-8 tw-p-4 tw-rounded-l-md tw-w-[calc(33.3%-6rem)] tw-transition-transform tw-duration-300 tw-ease-in-out tw-min-w-[30rem] tw-bg-gray-950 tw-bg-opacity-50 tw-backdrop-blur-xl tw-transform
            ${isDjCommentOpen ? 'tw-translate-x-0 tw-right-0 ' : 'tw-translate-x-full tw-right-0'}`}
          >
            <div
              className={
                'tw-flex tw-flex-col tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg ' +
                (vArchiveUserData.userName !== '' ? 'tw-h-full' : 'tw-h-full')
              }
            >
              <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-pb-0">
                <span className="tw-text-lg tw-font-bold tw-text-white">💬 DJ 코멘트</span>
              </div>

              <div className="tw-flex tw-flex-col tw-gap-4 tw-p-6 tw-overflow-y-auto">
                {commentData.length > 0 ? (
                  commentData
                    .filter((commentItem) => commentItem.nickname !== vArchiveUserData.userName)
                    .map((commentItem) => (
                      <div
                        key={commentItem.cmtNo}
                        className="tw-flex tw-w-full tw-gap-1 tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-4 hover:tw-bg-opacity-40 tw-transition-all"
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
                        <div className="tw-flex tw-flex-col tw-gap-2 flex-equal">
                          <div className="tw-flex tw-gap-2 tw-items-center tw-animate-fadeInOnly">
                            <span className="tw-font-extrabold tw-text-base">{commentItem.nickname}</span>
                            <span className="tw-font-light tw-text-xs tw-text-gray-400">{moment(commentItem.ymdt).locale('ko').format('LL')}</span>
                          </div>
                          <span
                            className="tw-animate-fadeInDown"
                            dangerouslySetInnerHTML={{
                              __html: `
                                        ${parseText(commentItem.comment)}
                                        `,
                            }}
                          />
                          <div
                            className={`tw-flex tw-items-center tw-justify-end tw-gap-2 tw-mt-2 tw-transition-all ${
                              vArchiveUserData.userNo !== '' ? 'tw-cursor-pointer hover:tw-text-red-400' : ''
                            }`}
                            onClick={() => {
                              if (vArchiveUserData.userNo !== '' && vArchiveUserData.userToken !== '' && vArchiveUserData.userName !== '') {
                                if (commentItem.myVote === 1) {
                                  updateCommentVote(commentItem.title, commentItem.cmtNo, 'DELETE')
                                } else {
                                  updateCommentVote(commentItem.title, commentItem.cmtNo, 'POST')
                                }
                              } else {
                                showNotification('DJ 코멘트 좋아요 기능은 로그인 또는 V-ARCHIVE 계정 연동이 필요합니다.', 'tw-bg-red-600')
                              }
                            }}
                          >
                            <div
                              className={`tw-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-gray-800 tw-bg-opacity-50 
                                    ${commentItem.myVote === 1 ? 'tw-text-red-400 tw-border-red-400' : 'tw-text-gray-400 tw-border-gray-600'} 
                                    tw-border tw-border-opacity-30 tw-transition-all
                                    ${vArchiveUserData.userNo !== '' ? 'hover:tw-border-opacity-50' : ''}`}
                            >
                              <span>
                                <IconContext.Provider
                                  value={{
                                    className: `tw-text-sm ${
                                      voteComment === commentItem.cmtNo && commentItem.myVote === 1
                                        ? 'tw-animate-scaleUpAndScaleDown'
                                        : voteComment === commentItem.cmtNo && commentItem.myVote === 0
                                        ? 'tw-animate-scaleDownAndScaleUp'
                                        : ''
                                    }`,
                                  }}
                                >
                                  {commentItem.myVote === 1 ? <FaHeart /> : <FaRegHeart />}
                                </IconContext.Provider>
                              </span>
                              <span className={`tw-text-sm tw-font-medium ${commentItem.myVote === 1 ? 'tw-text-red-400' : 'tw-text-gray-400'}`}>
                                {commentItem.vote}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : isFetchingCommentData ? (
                  <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
                    <SyncLoader color="#ffffff" size={8} />
                  </div>
                ) : !hasNextCommentData ? (
                  <div className="tw-flex tw-justify-center tw-items-center tw-py-8 tw-text-gray-400">등록된 DJ 코멘트가 없습니다.</div>
                ) : null}

                {commentData.length > 0 && hasNextCommentData && (
                  <button
                    onClick={() => fetchCommentData()}
                    className="tw-mt-2 tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-3 tw-font-bold hover:tw-bg-opacity-40 tw-transition-all"
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
