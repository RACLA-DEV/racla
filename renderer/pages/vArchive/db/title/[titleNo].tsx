import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import * as R from 'ramda'
import { FaCircleInfo, FaHeart, FaPencil, FaRegHeart, FaRotate, FaTriangleExclamation } from 'react-icons/fa6'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'
import moment from 'moment'
import { randomUUID } from 'crypto'

import 'moment/locale/ko'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

export default function VArchiveDbTitlePage({ userData, songData, addNotificationCallback, setBackgroundBgaName }) {
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)

  const params = useParams()
  const router = useRouter()

  const [keyMode, setKeyMode] = useState<string>('4')
  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

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

  useEffect(() => {
    setBaseSongData(songData.filter((value) => String(value.title) == params.titleNo))
    setIsScoredBaseSongData(false)
    if (songData.filter((value) => String(value.title) == params.titleNo).length == 0) {
      router.push('/vArchive/db')
    }
  }, [])

  useEffect(() => {
    if (baseSongData.length > 0) {
      setBackgroundBgaName(String(baseSongData[0].title))
    }
  }, [baseSongData])

  const [patternCode, setPatternCode] = useState<string>('')
  const [patternButton, setPatternButton] = useState<string>('')
  const [patternDificulty, setPatternDificulty] = useState<string>('')
  const [patternMaxCombo, setPatternMaxCombo] = useState<boolean>(false)
  const [updateScore, setUpdateScore] = useState<number>(0)
  const [fetchingUpdateScore, setFetchingUpdateScore] = useState<boolean>(false)

  const fetchUpdateScore = async () => {
    if (updateScore <= 100) {
      try {
        const response = await axios
          .post(
            `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/userRecord`,
            {
              button: Number(String(patternButton).replace('B', '')),
              pattern: patternDificulty,
              force: true,
              maxCombo: patternMaxCombo ? Number(1) : Number(0),
              score: updateScore,
              title: Number(baseSongData[0].title),
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
              let songData = baseSongData[0]
              songData.patterns[patternButton][patternDificulty].maxCombo = patternMaxCombo ? Number(1) : Number(0)
              songData.patterns[patternButton][patternDificulty].score = String(updateScore).includes('.') ? String(updateScore) : String(updateScore) + '.00'

              setBaseSongData([songData])
              setFetchingUpdateScore(false)
              setPatternCode('')
              addNotificationCallback('성과 기록을 정상적으로 저장하였습니다.', 'tw-bg-lime-600')
            }
          })
          .catch((error) => {
            // console.log(error)
          })
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    } else {
      setFetchingUpdateScore(false)
      addNotificationCallback('DJMAX RESPECT V 데이터베이스에서 기록할 수 있는 최대 점수는 100점입니다. 입력한 값을 다시 한번 확인해주세요.', 'tw-bg-red-600')
    }
  }

  useEffect(() => {
    if (fetchingUpdateScore) {
      fetchUpdateScore()
    }
  }, [fetchingUpdateScore])

  const fetchSongItemData = async (title) => {
    try {
      if (userData.userName !== '') {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${userData.userName}/title/${hoveredTitle}`,
        )
        const result = await response.json()
        setSongItemData(result)
      } else {
        const response = baseSongData.filter((baseSongData) => String(baseSongData.title) == String(title))
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
        const response = baseSongData.filter((baseSongData) => String(baseSongData.title) == String(title))
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

  const [commentContent, setCommentContent] = useState<string>('')
  const [isCommentUpdateMode, setIsCommentUpdateMode] = useState<boolean>(false)

  const fetchCommentContent = async (comment, cmd) => {
    try {
      const response = await axios
        .post(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/db/title/${baseSongData[0].title}/comment`,
          cmd === 'POST'
            ? {
                cmd,
                comment,
              }
            : {
                cmd,
                comment: '',
                userNo: Number(userData.userNo),
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
          if (data.data.success && cmd === 'POST') {
            setCommentData([data.data.myComment, ...commentData.filter((commentItem) => commentItem.nickname !== userData.userName)])
            addNotificationCallback(isCommentUpdateMode ? '코멘트가 정상적으로 수정되었습니다.' : '코멘트가 정상적으로 등록되었습니다.', 'tw-bg-lime-600')
          } else {
            setCommentData(commentData.filter((commentItem) => commentItem.nickname !== userData.userName))
            addNotificationCallback('코멘트가 정상적으로 삭제되었습니다.', 'tw-bg-lime-600')
          }
        })
        .catch((error) => {
          // console.log(error)
        })
        .finally(() => {
          setIsCommentUpdateMode(false)
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
        .get(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/db/title/${params.titleNo}/comments?page=${commentPage}&order=ymdt`, {
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
      }, 500)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [hoveredTitle])

  function getGrade(scoreStr) {
    // 문자열을 숫자로 변환
    const score = parseFloat(scoreStr)

    // 조건에 따라 등급을 반환
    if (score < 80.0) {
      return 'C/'
    } else if (score < 90.0) {
      return 'B/'
    } else if (score < 97.0) {
      return 'A/'
    } else if (score < 99.0) {
      return 'S/'
    } else if (score < 99.9) {
      return 'SS/'
    } else if (score < 100.0) {
      return 'SSS/'
    } else {
      return '' // 100.00 이상의 점수를 처리
    }
  }

  const loadDataWithScore = async (title) => {
    if (userData.userName !== '') {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${userData.userName}/title/${title}`)
        if (!response) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        return data
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error)
        return null
      }
    }
  }

  //   스코어 갱신
  useEffect(() => {
    if (baseSongData.length > 0 && !isScoredBaseSongData) {
      const updateArrayWithAPIData = async () => {
        // 배열의 각 항목에 대해 API 호출 및 데이터 업데이트
        const updatedArray = await Promise.all(
          baseSongData.map(async (item) => {
            const data = await loadDataWithScore(item.title)
            const keysToRemove1 = ['4B', '5B', '6B', '8B']
            const keysToRemove2 = ['SC', 'MX', 'HD', 'NM']
            const pathsToRemove = keysToRemove1.map((key1) => keysToRemove2.map((key2) => ['patterns', key1, key2, 'level']))
            const removeLevels = (paths, obj) => {
              return paths.reduce((acc, path) => R.dissocPath(path, acc), obj)
            }

            const newItem = removeLevels(pathsToRemove, data)

            return R.mergeDeepRight(newItem, item)
          }),
        )
          .then((value) => setBaseSongData(value))
          .finally(() => {
            setIsScoredBaseSongData(true)
            setIsLoading(false)
          })
      }

      if (userData.userName !== '') {
        updateArrayWithAPIData()
      } else {
        setIsScoredBaseSongData(true)
        setIsLoading(false)
      }
    }
  }, [isScoredBaseSongData])

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
      String(songItem.dlc).toLowerCase().includes(searchNameLower)

    const isStringMatchBackspaced =
      String(songItem.composer).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.name).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(backspacedSearchNameLower)
    // 초성 검색
    // const isChosungMatch = isMatchingChosung(songItem.composer, searchName) || isMatchingChosung(songItem.name, searchName)

    return isStringMatch || isStringMatchBackspaced
  }

  if (baseSongData.length > 0 && params.titleNo) {
    return (
      <React.Fragment>
        <Head>
          <title>{baseSongData.length !== 0 ? baseSongData[0].name : '로딩중'} - 데이터베이스 - 프로젝트 RA</title>
        </Head>
        <div className="tw-flex tw-gap-4 vh-screen">
          {/* 곡 데이터 */}
          <div className="tw-flex tw-flex-col tw-w-8/12 tw-relative ">
            <div
              className={
                'tw-flex tw-flex-col tw-gap-1 tw-bg-opacity-10 tw-rounded-md p-0 tw-mb-4 tw-h-60 ' +
                ` respect_dlc_${baseSongData[0].dlcCode}} respect_dlc_logo_${baseSongData[0].dlcCode} respect_dlc_logo_BG_${baseSongData[0].dlcCode}`
              }
              onClick={() => {
                setPatternCode('')
              }}
            >
              <div className="tw-flex tw-flex-col tw-animate-fadeInLeft p-4 flex-equal tw-bg-gray-900 tw-bg-opacity-30 tw-rounded-md">
                <div className="tw-flex">
                  <div className="tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950 tw-bg-opacity-75 tw-me-auto">
                    <span className="respect_dlc_code_wrap ">
                      <span className={`respect_dlc_code respect_dlc_code_${baseSongData[0].dlcCode}`}>{baseSongData[0].dlc}</span>
                    </span>
                  </div>
                </div>

                {/* 하단 */}
                <div className="tw-flex tw-gap-3 tw-mt-auto tw-items-end">
                  <Image
                    src={`/images/djmax_respect_v/jackets/${baseSongData[0].title}.jpg`}
                    height={90}
                    width={90}
                    alt=""
                    className="tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm"
                  />
                  <div className="tw-flex tw-flex-col tw-w-full">
                    {/* 제목 */}
                    <span className="tw-flex tw-font-light tw-text-gray-300">{baseSongData[0].composer}</span>
                    <span className="tw-text-lg tw-font-bold me-auto">
                      {baseSongData[0].name}
                      <sup className="tw-text-xs tw-font-light tw-text-gray-300">
                        {' '}
                        (V-ARCHIVE : {baseSongData[0].title} / 프로젝트-RA : {baseSongData[0].title})
                      </sup>
                    </span>
                  </div>
                </div>
              </div>

              {/* <span>전 패턴을 퍼펙트플레이를 하면 DJ CLASS 만점(이론치)을 달성할 수 있는 리스트입니다.</span>
            <span>DJ CLASS 최상위 랭커를 노린다면 최소 BASIC 70패턴, NEW 30패턴을 플레이 해야합니다.</span> */}
            </div>

            {true ? (
              <table className="tw-w-full tw-h-full tw-overflow-hidden tw-rounded-md tw-text-center tw-border tw-border-gray-100 tw-shadow-lg tw-bg-gray-950 tw-bg-opacity-30">
                <thead className="tw-h-14 tw-animate-fadeInLeft">
                  <tr className="tw-h-full tw-bg-gray-950 tw-bg-opacity-25" onClick={() => setPatternCode('')}>
                    <th className="tw-w-1/12"></th>
                    <th className="tw-w-1/5 respect_db_pattern respect_db_pattern_NM">NORMAL</th>
                    <th className="tw-w-1/5 respect_db_pattern respect_db_pattern_HD">HARD</th>
                    <th className="tw-w-1/5 respect_db_pattern respect_db_pattern_MX">MAXIMUM</th>
                    <th className="tw-w-1/5 respect_db_pattern respect_db_pattern_SC">SC</th>
                  </tr>
                </thead>
                <tbody className="tw-h-5/6">
                  {baseSongData.length !== 0 && !isLoading ? (
                    R.keys(baseSongData[0].patterns).map((patternName, index) => (
                      <>
                        <tr className="tw-animate-fadeInDown">
                          <td rowSpan={2} className="tw-border tw-border-gray-600 tw-border-opacity-25 tw-overflow-hidden " onClick={() => setPatternCode('')}>
                            <div className="tw-h-full tw-w-full tw-relative">
                              <div className={`tw-absolute respect_db_button respect_bg_b${String(patternName).replace('B', '')} tw-h-full tw-w-full`} />
                              <div className={`tw-absolute tw-bg-gray-950 tw-opacity-30 tw-h-full tw-w-full`} />
                              <span className="tw-absolute tw-top-0 tw-left-0 tw-h-full tw-w-full tw-flex tw-items-center tw-justify-center tw-font-extrabold tw-text-2xl">
                                {String(patternName)}
                              </span>
                            </div>
                          </td>
                          {R.keys(globalDictionary.respect.difficulty).map((difficultyCode, value) =>
                            baseSongData[0].patterns[patternName][difficultyCode] !== undefined &&
                            baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                              <td className="tw-border tw-border-gray-600 tw-border-opacity-25 " onClick={() => setPatternCode('')}>
                                <span className="tw-flex tw-justify-center tw-items-center tw-gap-1">
                                  <Image
                                    src={
                                      baseSongData[0].patterns[patternName][difficultyCode].level <= 5
                                        ? `/images/djmax_respect_v/${difficultyCode === 'SC' ? 'sc' : 'nm'}_5_star.png`
                                        : baseSongData[0].patterns[patternName][difficultyCode].level <= 10
                                        ? `/images/djmax_respect_v/${difficultyCode === 'SC' ? 'sc' : 'nm'}_10_star.png`
                                        : `/images/djmax_respect_v/${difficultyCode === 'SC' ? 'sc' : 'nm'}_15_star.png`
                                    }
                                    height={20}
                                    width={20}
                                    alt=""
                                  />
                                  <span
                                    className={
                                      baseSongData[0].patterns[patternName][difficultyCode].level <= 5
                                        ? 'tw-text-base tw-font-extrabold text-stroke-100 ' +
                                          (difficultyCode === 'SC' ? ' tw-text-respect-sc-5' : ' tw-text-respect-nm-5')
                                        : baseSongData[0].patterns[patternName][difficultyCode].level <= 10
                                        ? 'tw-text-base tw-font-extrabold text-stroke-100 ' +
                                          (difficultyCode === 'SC' ? ' tw-text-respect-sc-10' : ' tw-text-respect-nm-10')
                                        : 'tw-text-base tw-font-extrabold text-stroke-100 ' +
                                          (difficultyCode === 'SC' ? ' tw-text-respect-sc-15' : ' tw-text-respect-nm-15')
                                    }
                                  >
                                    {baseSongData[0].patterns[patternName][difficultyCode].level}
                                    {baseSongData[0].patterns[patternName][difficultyCode].floor ? (
                                      <sup> ({baseSongData[0].patterns[patternName][difficultyCode].floor}F)</sup>
                                    ) : null}
                                  </span>
                                </span>
                              </td>
                            ) : (
                              <td className="tw-border tw-border-gray-600 tw-border-opacity-25" onClick={() => setPatternCode('')}></td>
                            ),
                          )}
                        </tr>
                        <tr className="tw-animate-fadeInDown">
                          {userData.userName !== '' ? (
                            R.keys(globalDictionary.respect.difficulty).map((difficultyCode, value) =>
                              baseSongData[0].patterns[patternName][difficultyCode] !== undefined &&
                              baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                                <td className="tw-border tw-border-gray-600 tw-border-opacity-25">
                                  <div className="tw-w-full tw-h-full tw-relative tw-flex tw-items-center tw-justify-center">
                                    <span className="tw-text-lg tw-font-extrabold tw-flex tw-justify-center item-center tw-gap-1">
                                      {baseSongData[0].patterns[patternName][difficultyCode].score
                                        ? baseSongData[0].patterns[patternName][difficultyCode].score === '100.00'
                                          ? 'PERFECT'
                                          : `${getGrade(baseSongData[0].patterns[patternName][difficultyCode].score)}${
                                              baseSongData[0].patterns[patternName][difficultyCode].score
                                            }%`
                                        : '0%'}
                                      {baseSongData[0].patterns[patternName][difficultyCode].score !== undefined &&
                                      baseSongData[0].patterns[patternName][difficultyCode].score === '100.00' ? (
                                        <Image src="/images/perfect.png" width={30} height={16} alt="" />
                                      ) : baseSongData[0].patterns[patternName][difficultyCode].maxCombo === 1 ? (
                                        <Image src="/images/maxcombo.png" width={30} height={24} alt="" />
                                      ) : null}
                                    </span>
                                    <button
                                      className={
                                        'tw-absolute tw-top-2 tw-right-2 tw-transition-all tw-duration-500 tw-text-gray-800 hover:tw-text-gray-300 ' +
                                        (patternCode !== `patterns${String(patternName)}${difficultyCode}` ? ' tw-z-50 opacity-100' : ' opacity-0 tw-hidden')
                                      }
                                      type="button"
                                      onClick={() => {
                                        setPatternCode(`patterns${String(patternName)}${difficultyCode}`)
                                        setPatternMaxCombo(baseSongData[0].patterns[patternName][difficultyCode].maxCombo === 1)
                                        setPatternButton(String(patternName))
                                        setPatternDificulty(difficultyCode)
                                        setUpdateScore(
                                          Number(
                                            baseSongData[0].patterns[patternName][difficultyCode].score !== undefined &&
                                              baseSongData[0].patterns[patternName][difficultyCode].score !== null
                                              ? Number(baseSongData[0].patterns[patternName][difficultyCode].score)
                                              : 0,
                                          ),
                                        )
                                      }}
                                    >
                                      <FaPencil />
                                    </button>
                                    <div
                                      className={
                                        'tw-absolute tw-w-full tw-h-full tw-bg-gray-900 ' +
                                        (patternCode === `patterns${String(patternName)}${difficultyCode}` ? 'tw-opacity-100' : 'tw-opacity-0 tw-hidden')
                                      }
                                      style={{
                                        width: 'calc(100% + 2px)',
                                        height: 'calc(200% - 9%)',
                                        top: 'calc(-100% + 9%)',
                                      }}
                                    />
                                    <div
                                      className={
                                        'tw-absolute tw-w-full tw-h-full tw-bg-gray-950 tw-opacity-50 ' +
                                        (patternCode === `patterns${String(patternName)}${difficultyCode}` ? 'tw-opacity-100' : 'tw-opacity-0 tw-hidden')
                                      }
                                      style={{
                                        width: 'calc(100% + 2px)',
                                        height: 'calc(200% - 9%)',
                                        top: 'calc(-100% + 9%)',
                                      }}
                                    />
                                    <div
                                      className={
                                        'tw-absolute tw-left-0 tw-flex tw-gap-2 tw-transition-all tw-items-center tw-p-2 ' +
                                        (patternCode === `patterns${String(patternName)}${difficultyCode}` ? 'tw-opacity-100' : 'tw-opacity-0 tw-hidden')
                                      }
                                      style={{
                                        width: 'calc(100% + 2px)',
                                        height: 'calc(200% - 9%)',
                                        top: 'calc(-100% + 9%)',
                                      }}
                                    >
                                      <div className="tw-flex tw-flex-col tw-justify-center tw-items-center">
                                        <div className="tw-flex tw-justify-center tw-items-center">
                                          <Image src="/images/maxcombo.png" width={30} height={24} alt="" />
                                          <button
                                            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                                              patternMaxCombo ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                                            }`}
                                            onClick={() => {
                                              setPatternMaxCombo(!patternMaxCombo)
                                            }}
                                          >
                                            <span
                                              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                                                patternMaxCombo ? 'tw-right-1' : 'tw-left-1'
                                              }`}
                                            />
                                          </button>
                                        </div>
                                        <input
                                          className="form-control tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-center tw-font-extrabold tw-ps-7"
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={updateScore !== undefined && updateScore !== null ? Number(updateScore) : 0}
                                          onChange={(e) => setUpdateScore(Number(e.currentTarget.value))}
                                        />
                                      </div>
                                      <button
                                        className="tw-bg-gray-800 tw-bg-opacity-50 btn-reg tw-w-20 tw-rounded-md tw-text-xs tw-h-16 tw-mt-2"
                                        onClick={() => {
                                          setFetchingUpdateScore(true)
                                        }}
                                      >
                                        저장
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              ) : (
                                <td className="tw-border tw-border-gray-600 tw-border-opacity-25 "></td>
                              ),
                            )
                          ) : (
                            <td className="tw-border tw-border-gray-600 tw-border-opacity-25 " colSpan={4}>
                              <span className="flex-equal tw-flex tw-w-full tw-h-full tw-items-center tw-justify-center">
                                성과 기록 조회는 로그인이 필요합니다.
                              </span>
                            </td>
                          )}
                        </tr>
                      </>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="tw-relative tw-text-center tw-animate-spin">
                          <IconContext.Provider value={{ className: '' }}>
                            <FaRotate />
                          </IconContext.Provider>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="tw-w-full tw-h-full tw-overflow-hidden tw-rounded-md tw-text-center tw-bg-gray-600 tw-bg-opacity-10">
                <span className="flex-equal tw-flex tw-w-full tw-h-full tw-items-center tw-justify-center">성과 기록 조회는 로그인이 필요합니다.</span>
              </div>
            )}
          </div>

          {/* DJ 코멘트, 팁 */}
          {!isLoading && !isFetchingCommentData ? (
            <div className="tw-flex tw-w-4/12 tw-flex-col">
              <div className="tw-flex tw-flex-col tw-flex-col tw-overflow-y-auto tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-t-md pt-4 px-4">
                {userData.userNo !== '' && userData.userToken !== '' && userData.userName !== '' && !isLoading && !isFetchingCommentData ? (
                  <>
                    <div className="tw-flex tw-items-center">
                      <span className="tw-text-lg tw-font-bold mb-2 tw-me-auto">내 코멘트</span>
                      {commentData.filter((commentItem) => commentItem.nickname === userData.userName).length === 1 ? (
                        <div className="tw-flex tw-gap-4">
                          <span
                            className="tw-cursor-pointer"
                            onClick={() => {
                              setIsCommentUpdateMode(!isCommentUpdateMode)
                              if (!isCommentUpdateMode) {
                                addNotificationCallback('참고 : 코멘트를 수정하면 추천수가 초기화됩니다.', 'tw-bg-orange-600')
                              } else {
                                addNotificationCallback('코멘트 수정을 취소하였습니다.', 'tw-bg-blue-600')
                              }
                            }}
                          >
                            {!isCommentUpdateMode ? '수정' : '수정 취소'}
                          </span>
                          <span
                            className="tw-cursor-pointer"
                            onClick={() => {
                              fetchCommentContent('', 'DELETE')
                            }}
                          >
                            삭제
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {commentData.filter((commentItem) => commentItem.nickname === userData.userName).length === 0 ? (
                      <div className="tw-flex tw-gap-2">
                        <textarea
                          rows={3}
                          className="form-control tw-resize-none tw-text-sm tw-font-light tw-bg-gray-900 tw-bg-opacity-20"
                          placeholder="감상, 팁, 남기고 싶은 말을 자유롭게 입력해주세요"
                          onChange={(e) => setCommentContent(e.currentTarget.value)}
                        />
                        <button
                          onClick={(e) => fetchCommentContent(commentContent, 'POST')}
                          className="tw-flex tw-justify-center tw-items-center tw-w-20 tw-gap-1 btn-reg tw-rounded-md tw-text-md tw-bg-gray-950 tw-bg-opacity-50"
                        >
                          등록
                        </button>
                      </div>
                    ) : !isCommentUpdateMode ? (
                      <div
                        key={commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].cmtNo}
                        className="tw-flex tw-w-full tw-gap-3"
                      >
                        <div className="tw-min-h-16 tw-h-16 tw-min-w-16 tw-w-16 tw-relative hover-scale-110 tw-cursor-pointer">
                          <Image
                            src={`/images/djmax_respect_v/jackets/${
                              commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].title
                            }.jpg`}
                            height={80}
                            width={80}
                            alt=""
                            className="tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm"
                          />
                        </div>
                        <div className="tw-flex tw-flex-col tw-gap-2 flex-equal">
                          <div className="tw-flex tw-gap-2 tw-items-center tw-animate-fadeInOnly">
                            <span className="tw-font-extrabold">
                              {commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].nickname}
                            </span>
                            <span className="tw-font-light tw-text-xs tw-text-gray-400">
                              {moment(commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].ymdt)
                                .locale('ko')
                                .format('LL')}
                            </span>
                          </div>
                          <span
                            className="tw-animate-fadeInDown"
                            dangerouslySetInnerHTML={{
                              __html: `
                            ${parseText(commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].comment)}
                            `,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="tw-flex tw-gap-2">
                        <textarea
                          rows={3}
                          className="form-control tw-resize-none tw-text-sm tw-font-light tw-bg-gray-900 tw-bg-opacity-20"
                          placeholder="감상, 팁, 남기고 싶은 말을 자유롭게 입력해주세요"
                          onChange={(e) => setCommentContent(e.currentTarget.value)}
                          value={commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].comment}
                        />
                        <button
                          onClick={(e) => fetchCommentContent(commentContent, 'POST')}
                          className="tw-flex tw-justify-center tw-items-center tw-w-20 tw-gap-1 btn-reg tw-rounded-md tw-text-md tw-bg-gray-950 tw-bg-opacity-50"
                        >
                          등록
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <span></span>
                )}
              </div>

              <div
                className={
                  'tw-flex tw-bg-gray-600 tw-bg-opacity-10 pt-4 pb-2 px-4 tw-items-center ' +
                  (userData.userNo !== '' && userData.userToken !== '' && userData.userName !== '' ? ' pt-4' : '')
                }
              >
                <span className="tw-text-lg tw-font-bold tw-me-auto">DJ 코멘트</span>
                <div className="tw-flex tw-gap-2">
                  {globalDictionary.respect.keyModeList.map((value) => (
                    <button
                      key={`keyModeSelector_${value}`}
                      onClick={() => {
                        setKeyMode(String(value))
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
              <div className="tw-flex tw-flex-col flex-equal tw-overflow-y-auto tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-b-md pt-2 px-4 pb-4 tw-scroll-smooth">
                <div className="tw-flex tw-flex-col tw-w-full tw-gap-3 flex-equal">
                  {commentData.length > 0 ? (
                    commentData
                      .filter((commentItem) => commentItem.nickname !== userData.userName)
                      .map((commentItem, index) => (
                        <OverlayTrigger
                          key={'baseSongDataPack_item' + commentItem.title + '_cmtNo' + commentItem.cmtNo}
                          placement="auto-start"
                          delay={{ show: userData.userName !== '' ? 500 : 500, hide: 0 }}
                          overlay={
                            <Tooltip id="btn-nav-home" className={`tw-text-xs tw-min-h-48 ${fontFamily}`}>
                              {songItemData !== null && commentRivalSongItemData !== null ? (
                                <div className="tw-flex tw-gap-2">
                                  <div className="tw-flex tw-flex-col ">
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
                                                <div
                                                  className={'tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-extrabold tw-text-white'}
                                                >
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
                                          className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-mb-2 tw-mt-1 tw-bg-gray-900 tw-bg-opacity-100 tw-overflow-hidden tw-rounded-md "
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
                                                      className={
                                                        'tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-extrabold tw-text-white'
                                                      }
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
                                  <div className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-items-center tw-content-center mb-1 tw-bg-gray-900 tw-opacity-40">
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
                            }}
                          >
                            <div className="tw-min-h-16 tw-h-16 tw-min-w-16 tw-w-16 tw-relative hover-scale-110 tw-cursor-pointer">
                              <Image
                                src={`/images/djmax_respect_v/jackets/${commentItem.title}.jpg`}
                                height={80}
                                width={80}
                                alt=""
                                className="tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm"
                              />
                            </div>
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
          ) : (
            <></>
          )}
        </div>
      </React.Fragment>
    )
  } else {
    return <></>
  }
}
