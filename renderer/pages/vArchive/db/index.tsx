import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import * as R from 'ramda'
import { FaCircleInfo, FaHeart, FaRegHeart, FaRotate, FaTriangleExclamation } from 'react-icons/fa6'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'
import moment from 'moment'
import { randomUUID } from 'crypto'

import 'moment/locale/ko'
import axios from 'axios'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

export default function VArchiveDbPage({ userData, songData, addNotificationCallback, setBackgroundBgaName }) {
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
      if (userData.userName !== '') {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${userData.userName}/title/${hoveredTitle}`,
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
              Authorization: `${userData.userNo}|${userData.userToken}`,
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
            Authorization: `${userData.userNo}|${userData.userToken}`,
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
        setBackgroundBgaName(String(hoveredTitle))
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

  return (
    <React.Fragment>
      <Head>
        <title>데이터베이스({keyMode}B) - 프로젝트 RA</title>
      </Head>
      <div className="tw-flex tw-gap-4 vh-screen">
        {/* 곡 데이터 */}
        <div className="tw-flex tw-flex-col tw-w-8/12 tw-relative">
          <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-mb-4">
            {/* 상단 */}
            <div className="tw-flex tw-w-full">
              {/* 제목 */}
              <span className="tw-text-lg tw-font-bold me-auto">데이터베이스</span>
              {/* keyMode 선택 */}
              <div className="tw-flex tw-gap-2"></div>
            </div>

            {/* 내용 */}
            <input
              className="form-control tw-mt-2 tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-light"
              onChange={(e) => setSearchName(e.currentTarget.value)}
              type="text"
              placeholder="제목, 제작자명 또는 DLC명을 입력해주세요."
            />
            {/* <span>전 패턴을 퍼펙트플레이를 하면 DJ CLASS 만점(이론치)을 달성할 수 있는 리스트입니다.</span>
        <span>DJ CLASS 최상위 랭커를 노린다면 최소 BASIC 70패턴, NEW 30패턴을 플레이 해야합니다.</span> */}
            <span className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold tw-mt-4">
              <FaCircleInfo />
              <div className="tw-flex tw-flex-col">
                <span>수록곡 데이터가 많은 관계로 마우스 커서를 수록곡(자켓) 이미지에 올려둔 경우에만 성과 기록이 제공됩니다.</span>
                <span>추후 도입될 라이벌 시스템의 일부 기능은 로그인 후 사용하실 수 있습니다.</span>
              </div>
            </span>
          </div>

          <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-h-full tw-overflow-y-auto tw-scroll-smooth">
            <div className="tw-flex">
              <div className={`tw-text-center tw-w-full tw-flex tw-gap-3 tw-flex-wrap tw-justify-center`}>
                {console.log(songData)}
                {songData
                  .filter((songItem) => {
                    if (searchName !== '') {
                      return searchSong(songItem, searchName)
                    } else {
                      return true
                    }
                  })
                  .map((songItem, songItemIndex) => (
                    <OverlayTrigger
                      key={'songDataPack_item' + songItem.title}
                      placement="auto"
                      delay={{ show: userData.userName !== '' ? 500 : 500, hide: 0 }}
                      overlay={
                        <Tooltip id="btn-nav-home" className={`tw-text-xs tw-min-h-48 ${fontFamily}`}>
                          {songItem !== null ? (
                            <div className="tw-flex tw-flex-col">
                              <div
                                className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-mb-2 tw-mt-1  tw-bg-gray-900 tw-bg-opacity-100 tw-overflow-hidden tw-rounded-md "
                                style={{ opacity: 1 }}
                              >
                                <Image
                                  src={`/images/djmax_respect_v/jackets/${songItem.title}.jpg`}
                                  className="tw-absolute tw-animate-fadeInLeft tw-rounded-md tw-blur tw-brightness-50 tw-bg-opacity-90"
                                  fill
                                  alt=""
                                  style={{ objectFit: 'cover' }}
                                />
                                <span className="tw-absolute tw-left-0 tw-bottom-0 tw-px-2 tw-font-bold tw-text-left tw-break-keep">
                                  <span className="tw-font-medium tw-text-md">{songItem.composer}</span>
                                  <br />
                                  <span className=" tw-text-xl">{songItem.name}</span>
                                </span>
                                <span className="tw-absolute tw-top-1 tw-right-1 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950">
                                  <span className={`respect_dlc_code respect_dlc_code_${songItem.dlcCode}`}>{songItem.dlc}</span>
                                </span>
                              </div>
                              <div className="tw-flex tw-flex-col tw-gap-2 tw-w-80 tw-p-2 tw-rounded-md tw-mb-1 tw-bg-gray-700 tw-bg-opacity-20">
                                {['NM', 'HD', 'MX', 'SC'].map((value, difficultyIndex) =>
                                  songItem.patterns[`${keyMode}B`][value] !== undefined && songItem.patterns[`${keyMode}B`][value] !== null ? (
                                    <div className="tw-flex tw-flex-col tw-gap-2" key={'songDataPack_item' + songItem.title + '_hover' + value}>
                                      <div className="tw-flex tw-items-center tw-gap-1">
                                        <span
                                          className={
                                            `tw-text-base tw-font-extrabold tw-text-left tw-z-50 text-stroke-100 tw-me-auto ` +
                                            (value === 'NM'
                                              ? 'tw-text-respect-nm-5'
                                              : value === 'HD'
                                              ? 'tw-text-respect-nm-10'
                                              : value === 'MX'
                                              ? 'tw-text-respect-nm-15'
                                              : 'tw-text-respect-sc-15')
                                          }
                                        >
                                          {globalDictionary.respect.difficulty[value].fullName}
                                        </span>
                                        <Image
                                          src={
                                            songItem.patterns[`${keyMode}B`][value].level <= 5
                                              ? `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_5_star.png`
                                              : songItem.patterns[`${keyMode}B`][value].level <= 10
                                              ? `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_10_star.png`
                                              : `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_15_star.png`
                                          }
                                          height={14}
                                          width={14}
                                          alt=""
                                        />
                                        <span
                                          className={
                                            songItem.patterns[`${keyMode}B`][value].level <= 5
                                              ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                (value === 'SC' ? ' tw-text-respect-sc-5' : ' tw-text-respect-nm-5')
                                              : songItem.patterns[`${keyMode}B`][value].level <= 10
                                              ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                (value === 'SC' ? ' tw-text-respect-sc-10' : ' tw-text-respect-nm-10')
                                              : 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                (value === 'SC' ? ' tw-text-respect-sc-15' : ' tw-text-respect-nm-15')
                                          }
                                        >
                                          {songItem.patterns[`${keyMode}B`][value].level}{' '}
                                          <sup className="tw-text-xs">
                                            {songItem.patterns[`${keyMode}B`][value].floor !== undefined &&
                                            songItem.patterns[`${keyMode}B`][value].floor !== null
                                              ? `(${songItem.patterns[`${keyMode}B`][value].floor}F)`
                                              : null}
                                          </sup>
                                        </span>
                                      </div>
                                      {userData.userName !== '' && songItemData ? (
                                        <div className="tw-relative tw-w-full tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden tw-animate-fadeInDown">
                                          <div
                                            className={
                                              `tw-h-6 tw-transition-all tw-duration-500 tw-ease-in-out ` +
                                              (value === 'NM'
                                                ? 'tw-bg-respect-nm-5'
                                                : value === 'HD'
                                                ? 'tw-bg-respect-nm-10'
                                                : value === 'MX'
                                                ? 'tw-bg-respect-nm-15'
                                                : 'tw-bg-respect-sc-15')
                                            }
                                            style={{
                                              width: `${
                                                songItem.patterns[`${keyMode}B`][value].score !== undefined &&
                                                songItem.patterns[`${keyMode}B`][value].score !== null
                                                  ? String(Math.floor(Number(songItem.patterns[`${keyMode}B`][value].score)))
                                                  : '0'
                                              }%`,
                                            }}
                                          />
                                          <div className={'tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-extrabold tw-text-white'}>
                                            {songItem.patterns[`${keyMode}B`][value].score !== undefined &&
                                            songItem.patterns[`${keyMode}B`][value].score !== null
                                              ? songItem.patterns[`${keyMode}B`][value].score === '100.00'
                                                ? `PERFECT`
                                                : `${songItem.patterns[`${keyMode}B`][value].score}%${
                                                    songItem.patterns[`${keyMode}B`][value].maxCombo ? `(MAX COMBO)` : ''
                                                  }`
                                              : '0%(기록 미존재)'}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null,
                                )}
                              </div>
                            </div>
                          ) : null}
                        </Tooltip>
                      }
                    >
                      <div
                        className="tw-inline-flex tw-flex-col tw-h-26 tw-w-20 tw-transition-all"
                        onMouseEnter={() => {
                          setHoveredTitle(String(songItem.title))
                          setSongItemData(null)
                        }}
                        onMouseLeave={() => {
                          setHoveredTitle(null)
                          setSongItemData(null)
                          setBackgroundBgaName('')
                        }}
                      >
                        <Link
                          href={`/vArchive/db/title/${songItem.title}`}
                          className="tw-relative tw-h-20 tw-w-20 tw-rounded-md hover-scale-110 respect_record tw-shadow-lg tw-cursor-pointer"
                        >
                          <Image
                            src={`/images/djmax_respect_v/jackets/${songItem.title}.jpg`}
                            className="tw-absolute tw-animate-fadeInLeft tw-rounded-md"
                            height={80}
                            width={80}
                            alt=""
                          />
                          <span className="tw-absolute tw-top-0 tw-left-0 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-tl-md">
                            <span className={`respect_dlc_code respect_dlc_code_${songItem.dlcCode}`}>{songItem.dlcCode}</span>
                          </span>
                          {/* <span
                      className={`tw-absolute tw-right-0 tw-bottom-0 pattern tw-animate-fadeInLeft tw-rounded-br-md ${
                        String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5') ? 'MX' : 'SC'
                      }`}
                    >
                      <span className={`tw-text-white`}>{String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5') ? 'MX' : 'SC'}</span>
                    </span> */}
                        </Link>
                        {/* {userData.userName !== '' && isScoredBaseSongData ? (
                    <span className={'mt-2 tw-w-full tw-bg-gray-950 tw-text-center tw-rounded-md tw-text-sm tw-font-bold tw-animate-fadeInDown'}>
                      {String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5')
                        ? songItem.patterns[`${keyMode}B`].MX.score
                          ? songItem.patterns[`${keyMode}B`].MX.score === '100.00'
                            ? 'PERFECT'
                            : songItem.patterns[`${keyMode}B`].MX.score
                          : 0
                        : songItem.patterns[`${keyMode}B`].SC.score
                        ? songItem.patterns[`${keyMode}B`].SC.score === '100.00'
                          ? 'PERFECT'
                          : songItem.patterns[`${keyMode}B`].SC.score
                        : 0}
                    </span>
                  ) : null} */}
                      </div>
                    </OverlayTrigger>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* DJ 코멘트, 팁 */}
        <div className="tw-flex tw-w-4/12 tw-flex-col">
          <div className="tw-flex tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-t-md pt-4 pb-2 px-4 tw-items-center">
            <span className="tw-text-lg tw-font-bold tw-me-auto">DJ 코멘트</span>
            <div className="tw-flex tw-gap-2">
              {globalDictionary.respect.keyModeList.map((value) => (
                <button
                  key={`keyModeSelector_${value}`}
                  onClick={() => {
                    setKeyMode(String(value))
                    setIsLoading(true)
                  }}
                  className={
                    'tw-flex tw-items-center tw-justify-center tw-relative tw-px-6 tw-py-3 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-border-gray-600 tw-rounded-sm' +
                    (keyMode === String(value) ? ' tw-brightness-200' : '')
                  }
                  disabled={keyMode === String(value) || !isScoredBaseSongData}
                >
                  <div className={`tw-absolute tw-w-full tw-h-full respect_bg_b` + String(value)} />
                  <span className="tw-absolute tw-text-lg tw-font-bold">{String(value)}B</span>
                </button>
              ))}
            </div>
          </div>
          <div className="tw-flex tw-flex-col flex-equal tw-overflow-y-auto tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-b-md pt-2 pb-4 px-4 tw-scroll-smooth">
            <div className="tw-flex tw-flex-col tw-w-full tw-gap-3 flex-equal">
              {commentData.length > 0 ? (
                commentData.map((commentItem, index) => (
                  <OverlayTrigger
                    key={'baseSongDataPack_item' + commentItem.title + '_cmtNo' + commentItem.cmtNo}
                    placement="auto-start"
                    delay={{ show: userData.userName !== '' ? 500 : 500, hide: 0 }}
                    overlay={
                      <Tooltip id="btn-nav-home" className={`tw-text-xs tw-min-h-48 ${fontFamily}`}>
                        {songItemData !== null && commentRivalSongItemData !== null ? (
                          <div className="tw-flex tw-gap-2">
                            <div className="tw-flex tw-flex-col">
                              <div
                                className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-mb-2 tw-mt-1  tw-bg-gray-900 tw-bg-opacity-100 tw-overflow-hidden tw-rounded-md "
                                style={{ opacity: 1 }}
                              >
                                <Image
                                  src={`/images/djmax_respect_v/jackets/${songItemData.title}.jpg`}
                                  className="tw-absolute tw-animate-fadeInLeft tw-rounded-md tw-blur tw-brightness-50 tw-bg-opacity-90"
                                  fill
                                  alt=""
                                  style={{ objectFit: 'cover' }}
                                />
                                <span className="tw-absolute tw-left-0 tw-bottom-0 tw-px-2 tw-font-bold tw-text-left tw-break-keep">
                                  <span className="tw-font-medium tw-text-md">{songItemData.composer}</span>
                                  <br />
                                  <span className=" tw-text-xl">{songItemData.name}</span>
                                </span>
                                <span className="tw-absolute tw-top-1 tw-right-1 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950">
                                  <span className={`respect_dlc_code respect_dlc_code_${songItemData.dlcCode}`}>{songItemData.dlc}</span>
                                </span>
                              </div>
                              <div className="tw-flex tw-flex-col tw-gap-2 tw-w-80 tw-p-2 tw-rounded-md tw-mb-1 tw-bg-gray-700 tw-bg-opacity-20">
                                {['NM', 'HD', 'MX', 'SC'].map((value, difficultyIndex) =>
                                  songItemData.patterns[`${keyMode}B`][value] !== undefined && songItemData.patterns[`${keyMode}B`][value] !== null ? (
                                    <div
                                      className="tw-flex tw-flex-col tw-gap-2"
                                      key={'baseSongDataPack_item' + songItemData.title + '_hover' + value + '_cmtNo' + commentItem.cmtNo}
                                    >
                                      <div className="tw-flex tw-items-center tw-gap-1">
                                        <span
                                          className={
                                            `tw-text-base tw-font-extrabold tw-text-left tw-z-50 text-stroke-100 tw-me-auto ` +
                                            (value === 'NM'
                                              ? 'tw-text-respect-nm-5'
                                              : value === 'HD'
                                              ? 'tw-text-respect-nm-10'
                                              : value === 'MX'
                                              ? 'tw-text-respect-nm-15'
                                              : 'tw-text-respect-sc-15')
                                          }
                                        >
                                          {globalDictionary.respect.difficulty[value].fullName}
                                        </span>
                                        <Image
                                          src={
                                            songItemData.patterns[`${keyMode}B`][value].level <= 5
                                              ? `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_5_star.png`
                                              : songItemData.patterns[`${keyMode}B`][value].level <= 10
                                              ? `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_10_star.png`
                                              : `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_15_star.png`
                                          }
                                          height={14}
                                          width={14}
                                          alt=""
                                        />
                                        <span
                                          className={
                                            songItemData.patterns[`${keyMode}B`][value].level <= 5
                                              ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                (value === 'SC' ? ' tw-text-respect-sc-5' : ' tw-text-respect-nm-5')
                                              : songItemData.patterns[`${keyMode}B`][value].level <= 10
                                              ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                (value === 'SC' ? ' tw-text-respect-sc-10' : ' tw-text-respect-nm-10')
                                              : 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                (value === 'SC' ? ' tw-text-respect-sc-15' : ' tw-text-respect-nm-15')
                                          }
                                        >
                                          {songItemData.patterns[`${keyMode}B`][value].level}{' '}
                                          <sup className="tw-text-xs">
                                            {songItemData.patterns[`${keyMode}B`][value].floor !== undefined &&
                                            songItemData.patterns[`${keyMode}B`][value].floor !== null
                                              ? `(${songItemData.patterns[`${keyMode}B`][value].floor}F)`
                                              : null}
                                          </sup>
                                        </span>
                                      </div>
                                      {userData.userName !== '' && songItemData ? (
                                        <div className="tw-relative tw-w-full tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden tw-animate-fadeInDown">
                                          <div
                                            className={
                                              `tw-h-6 tw-transition-all tw-duration-500 tw-ease-in-out ` +
                                              (value === 'NM'
                                                ? 'tw-bg-respect-nm-5'
                                                : value === 'HD'
                                                ? 'tw-bg-respect-nm-10'
                                                : value === 'MX'
                                                ? 'tw-bg-respect-nm-15'
                                                : 'tw-bg-respect-sc-15')
                                            }
                                            style={{
                                              width: `${
                                                songItemData.patterns[`${keyMode}B`][value].score !== undefined &&
                                                songItemData.patterns[`${keyMode}B`][value].score !== null
                                                  ? String(Math.floor(Number(songItemData.patterns[`${keyMode}B`][value].score)))
                                                  : '0'
                                              }%`,
                                            }}
                                          />
                                          <div className={'tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-extrabold tw-text-white'}>
                                            {songItemData.patterns[`${keyMode}B`][value].score !== undefined &&
                                            songItemData.patterns[`${keyMode}B`][value].score !== null
                                              ? songItemData.patterns[`${keyMode}B`][value].score === '100.00'
                                                ? `PERFECT`
                                                : `${songItemData.patterns[`${keyMode}B`][value].score}%${
                                                    songItemData.patterns[`${keyMode}B`][value].maxCombo ? `(MAX COMBO)` : ''
                                                  }`
                                              : '0%(기록 미존재)'}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null,
                                )}
                                {userData.userName !== '' ? (
                                  <span className="tw-text-xs tw-font-light tw-text-gray-300">로그인 사용자({userData.userName})의 성과 기록입니다.</span>
                                ) : null}
                              </div>
                            </div>

                            {commentRivalName !== '' && userData.userName !== '' && commentRivalSongItemData && commentRivalName !== userData.userName ? (
                              <>
                                <div className="tw-flex tw-flex-col">
                                  <div
                                    className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-mb-2 tw-mt-1  tw-bg-gray-900 tw-bg-opacity-100 tw-overflow-hidden tw-rounded-md "
                                    style={{ opacity: 1 }}
                                  >
                                    <Image
                                      src={`/images/djmax_respect_v/jackets/${commentRivalSongItemData.title}.jpg`}
                                      className="tw-absolute tw-animate-fadeInLeft tw-rounded-md tw-blur tw-brightness-50 tw-bg-opacity-90"
                                      fill
                                      alt=""
                                      style={{ objectFit: 'cover' }}
                                    />
                                    <span className="tw-absolute tw-left-0 tw-bottom-0 tw-px-2 tw-font-bold tw-text-left tw-break-keep">
                                      <span className="tw-font-medium tw-text-md">{commentRivalSongItemData.composer}</span>
                                      <br />
                                      <span className=" tw-text-xl">{commentRivalSongItemData.name}</span>
                                    </span>
                                    <span className="tw-absolute tw-top-1 tw-right-1 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950">
                                      <span className={`respect_dlc_code respect_dlc_code_${commentRivalSongItemData.dlcCode}`}>
                                        {commentRivalSongItemData.dlc}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="tw-flex tw-flex-col tw-gap-2 tw-w-80 tw-p-2 tw-rounded-md tw-mb-1 tw-bg-gray-700 tw-bg-opacity-20">
                                    {['NM', 'HD', 'MX', 'SC'].map((value, difficultyIndex) =>
                                      commentRivalSongItemData.patterns[`${keyMode}B`][value] !== undefined &&
                                      commentRivalSongItemData.patterns[`${keyMode}B`][value] !== null ? (
                                        <div
                                          className="tw-flex tw-flex-col tw-gap-2"
                                          key={'baseSongDataPack_item' + commentRivalSongItemData.title + '_hover' + value + '_cmtNo' + commentItem.cmtNo}
                                        >
                                          <div className="tw-flex tw-items-center tw-gap-1">
                                            <span
                                              className={
                                                `tw-text-base tw-font-extrabold tw-text-left tw-z-50 text-stroke-100 tw-me-auto ` +
                                                (value === 'NM'
                                                  ? 'tw-text-respect-nm-5'
                                                  : value === 'HD'
                                                  ? 'tw-text-respect-nm-10'
                                                  : value === 'MX'
                                                  ? 'tw-text-respect-nm-15'
                                                  : 'tw-text-respect-sc-15')
                                              }
                                            >
                                              {globalDictionary.respect.difficulty[value].fullName}
                                            </span>
                                            <Image
                                              src={
                                                commentRivalSongItemData.patterns[`${keyMode}B`][value].level <= 5
                                                  ? `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_5_star.png`
                                                  : commentRivalSongItemData.patterns[`${keyMode}B`][value].level <= 10
                                                  ? `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_10_star.png`
                                                  : `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_15_star.png`
                                              }
                                              height={14}
                                              width={14}
                                              alt=""
                                            />
                                            <span
                                              className={
                                                commentRivalSongItemData.patterns[`${keyMode}B`][value].level <= 5
                                                  ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                    (value === 'SC' ? ' tw-text-respect-sc-5' : ' tw-text-respect-nm-5')
                                                  : commentRivalSongItemData.patterns[`${keyMode}B`][value].level <= 10
                                                  ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                    (value === 'SC' ? ' tw-text-respect-sc-10' : ' tw-text-respect-nm-10')
                                                  : 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                                    (value === 'SC' ? ' tw-text-respect-sc-15' : ' tw-text-respect-nm-15')
                                              }
                                            >
                                              {commentRivalSongItemData.patterns[`${keyMode}B`][value].level}{' '}
                                              <sup className="tw-text-xs">
                                                {commentRivalSongItemData.patterns[`${keyMode}B`][value].floor !== undefined &&
                                                commentRivalSongItemData.patterns[`${keyMode}B`][value].floor !== null
                                                  ? `(${commentRivalSongItemData.patterns[`${keyMode}B`][value].floor}F)`
                                                  : null}
                                              </sup>
                                            </span>
                                          </div>
                                          {userData.userName !== '' && commentRivalSongItemData ? (
                                            <div className="tw-relative tw-w-full tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden tw-animate-fadeInDown">
                                              <div
                                                className={
                                                  `tw-h-6 tw-transition-all tw-duration-500 tw-ease-in-out ` +
                                                  (value === 'NM'
                                                    ? 'tw-bg-respect-nm-5'
                                                    : value === 'HD'
                                                    ? 'tw-bg-respect-nm-10'
                                                    : value === 'MX'
                                                    ? 'tw-bg-respect-nm-15'
                                                    : 'tw-bg-respect-sc-15')
                                                }
                                                style={{
                                                  width: `${
                                                    commentRivalSongItemData.patterns[`${keyMode}B`][value].score !== undefined &&
                                                    commentRivalSongItemData.patterns[`${keyMode}B`][value].score !== null
                                                      ? String(Math.floor(Number(commentRivalSongItemData.patterns[`${keyMode}B`][value].score)))
                                                      : '0'
                                                  }%`,
                                                }}
                                              />
                                              <div
                                                className={'tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-extrabold tw-text-white'}
                                              >
                                                {commentRivalSongItemData.patterns[`${keyMode}B`][value].score !== undefined &&
                                                commentRivalSongItemData.patterns[`${keyMode}B`][value].score !== null
                                                  ? commentRivalSongItemData.patterns[`${keyMode}B`][value].score === '100.00'
                                                    ? `PERFECT`
                                                    : `${commentRivalSongItemData.patterns[`${keyMode}B`][value].score}%${
                                                        commentRivalSongItemData.patterns[`${keyMode}B`][value].maxCombo ? `(MAX COMBO)` : ''
                                                      }`
                                                  : '0%(기록 미존재)'}
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : null,
                                    )}
                                    {userData.userName !== '' ? (
                                      <span className="tw-text-xs tw-font-light tw-text-gray-300">
                                        코멘트 작성자(<span className="">{commentRivalName}</span>)의 성과 기록입니다.
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </>
                            ) : null}
                          </div>
                        ) : (
                          <div className="tw-flex tw-flex-col">
                            <div
                              className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-items-center tw-content-center tw-mb-2 tw-mt-1 tw-bg-gray-900"
                              style={{ opacity: 1 }}
                            >
                              <div className="tw-flex flex-equal tw-items-center tw-justify-center">
                                <div className="tw-relative tw-text-center tw-animate-spin">
                                  <IconContext.Provider value={{ className: '' }}>
                                    <FaRotate />
                                  </IconContext.Provider>
                                </div>
                              </div>
                            </div>
                            <div
                              className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-items-center tw-content-center mb-1 tw-bg-gray-900 tw-bg-opacity-40"
                              style={{ opacity: 1 }}
                            >
                              <div className="tw-flex flex-equal tw-items-center tw-justify-center">
                                <div className="tw-relative tw-text-center tw-animate-spin">
                                  <IconContext.Provider value={{ className: '' }}>
                                    <FaRotate />
                                  </IconContext.Provider>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Tooltip>
                    }
                  >
                    <div
                      key={commentItem.cmtNo}
                      className="tw-flex tw-w-full tw-gap-3"
                      onMouseEnter={() => {
                        setHoveredTitle(String(commentItem.title))
                        setSongItemData(null)
                        if (userData.userName !== '') {
                          setCommentRivalName(String(commentItem.nickname))
                          setCommentRivalSongItemData(null)
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredTitle(null)
                        setCommentRivalName('')
                        setSongItemData(null)
                        setCommentRivalSongItemData(null)
                        setBackgroundBgaName('')
                      }}
                    >
                      <Link
                        href={`/vArchive/db/title/${commentItem.title}`}
                        className="tw-min-h-16 tw-h-16 tw-min-w-16 tw-w-16 tw-relative hover-scale-110 tw-cursor-pointer"
                      >
                        <Image
                          src={`/images/djmax_respect_v/jackets/${commentItem.title}.jpg`}
                          height={80}
                          width={80}
                          alt=""
                          className="tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm"
                        />
                      </Link>
                      <div className="tw-flex tw-flex-col tw-gap-2 flex-equal">
                        <div className="tw-flex tw-gap-2 tw-items-center tw-animate-fadeInOnly">
                          <span className="tw-font-extrabold">{commentItem.nickname}</span>
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
                          className={'tw-flex tw-justify-end tw-items-center gap-2 tw-cursor-pointer'}
                          onClick={() => {
                            if (userData.userNo !== '' && userData.userToken !== '' && userData.userName !== '') {
                              if (commentItem.myVote === 1) {
                                updateCommentVote(commentItem.title, commentItem.cmtNo, 'DELETE')
                              } else {
                                updateCommentVote(commentItem.title, commentItem.cmtNo, 'POST')
                              }
                            } else {
                              addNotificationCallback('DJ 코멘트 좋아요 기능은 로그인이 필요합니다.', 'tw-bg-red-600')
                            }
                          }}
                        >
                          <span className={`${commentItem.myVote === 1 ? 'tw-text-red-600' : ''}`}>
                            <IconContext.Provider
                              value={{
                                className:
                                  voteComment === commentItem.cmtNo && commentItem.myVote === 1
                                    ? ' tw-animate-scaleUpAndScaleDown'
                                    : voteComment === commentItem.cmtNo && commentItem.myVote === 0
                                    ? ' tw-animate-scaleDownAndScaleUp'
                                    : '',
                              }}
                            >
                              <FaHeart />
                            </IconContext.Provider>
                          </span>
                          <span className="tw-font-light tw-text-xs">{commentItem.vote}</span>
                        </div>
                      </div>
                    </div>
                  </OverlayTrigger>
                ))
              ) : isFetchingCommentData && commentData.length == 0 ? (
                <div className="tw-flex tw-justify-center flex-equal tw-items-center">
                  <div className="tw-relative tw-text-center tw-animate-spin">
                    <IconContext.Provider value={{ className: '' }}>
                      <FaRotate />
                    </IconContext.Provider>
                  </div>
                </div>
              ) : !hasNextCommentData ? (
                <div className="tw-flex tw-justify-center flex-equal tw-items-center">
                  <span className="tw-w-full tw-flex tw-justify-center">등록된 DJ 코멘트가 없습니다.</span>
                </div>
              ) : (
                <></>
              )}
            </div>
            {commentData.length > 0 && hasNextCommentData ? (
              <button onClick={() => fetchCommentData()} className="tw-mt-2 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-md tw-w-full tw-p-2 tw-font-bold">
                더보기
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
