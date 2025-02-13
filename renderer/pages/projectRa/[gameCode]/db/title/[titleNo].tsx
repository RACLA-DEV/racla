import 'dayjs/locale/ko'

import * as R from 'ramda'

import React, { useEffect, useState } from 'react'
import { FaTable, FaYoutube } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'

import WjmaxChartComponent from '@/components/common/PatternViewer'
import ScoreEditComponent from '@/components/score/ScoreEditModal'
import { globalDictionary } from '@constants/globalDictionary'
import { useNotificationSystem } from '@hooks/useNotifications'
import { logRendererError } from '@utils/rendererLoggerUtils'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Head from 'next/head'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

dayjs.locale('ko')
dayjs.extend(utc)

export default function VArchiveDbTitlePage() {
  const { showNotification } = useNotificationSystem()
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)

  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch()
  const { wjmaxSongData, userData } = useSelector((state: RootState) => state.app)

  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [songItemData, setSongItemData] = useState<any>(null)

  const [commentData, setCommentData] = useState<any[]>([])

  useEffect(() => {
    const initializeData = async () => {
      const filteredData = wjmaxSongData.filter((value) => String(value.title) == params?.titleNo)

      if (filteredData.length === 0) {
        router.push(`/projectRa/${selectedGame}/db`)
        return
      }

      // 로그인한 사용자의 경우 rating 정보를 포함한 데이터 가져오기
      if (userData.userName) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/songs/${selectedGame}/${params?.titleNo}/user/${userData.userNo}`,
            {
              headers: {
                Authorization: `${userData.userNo}|${userData.userToken}`,
              },
              withCredentials: true,
            },
          )
          const { data } = response
          const { patterns, plusPatterns } = data
          const newPatterns = Object.fromEntries(
            Object.entries({
              ...patterns,
              ...Object.fromEntries(
                Object.keys(plusPatterns).map((key) => [`${key}_PLUS`, plusPatterns[key]]),
              ),
            }).sort(([keyA], [keyB]) => {
              const numA = parseInt(keyA)
              const numB = parseInt(keyB)
              if (numA !== numB) return numA - numB
              return keyA.includes('_PLUS') ? 1 : -1
            }),
          )
          setBaseSongData([
            {
              ...data,
              patterns: newPatterns,
            },
          ])
          console.log({
            ...data,
            patterns: newPatterns,
          })
        } catch (error) {
          logRendererError(error, { message: 'Error in fetchUserSongData', ...userData })
          console.error('Error fetching user song data:', error)
          setBaseSongData(filteredData)
        }
      } else {
        setBaseSongData(filteredData)
      }

      setIsScoredBaseSongData(false)
    }

    initializeData()
  }, [userData])

  useEffect(() => {
    if (baseSongData.length > 0) {
      dispatch(setBackgroundBgaName(String(baseSongData[0].folderName) + '_preview'))
    }
  }, [baseSongData])

  useEffect(() => {
    if (backgroundBgaName !== '' && baseSongData.length > 0) {
      dispatch(setBackgroundBgaName(String(baseSongData[0].folderName) + '_preview'))
    }
  }, [backgroundBgaName])

  const [patternCode, setPatternCode] = useState<string>('')
  const [patternButton, setPatternButton] = useState<string>('')
  const [isPlusPattern, setIsPlusPattern] = useState<boolean>(false)
  const [patternDificulty, setPatternDificulty] = useState<string>('')
  const [patternMaxCombo, setPatternMaxCombo] = useState<boolean>(false)
  const [updateScore, setUpdateScore] = useState<number>(0)
  const [fetchingUpdateScore, setFetchingUpdateScore] = useState<boolean>(false)

  const fetchUpdateScore = async () => {
    if (updateScore <= 100) {
      try {
        const response = await axios
          .post(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/play/${selectedGame}/update`,
            {
              button: Number(String(patternButton).replace('B', '').replace('_PLUS', '')),
              pattern: patternDificulty,
              force: true,
              maxCombo: patternMaxCombo ? Number(1) : Number(0),
              score: updateScore,
              title: Number(baseSongData[0].title),
              judgementType: isPlusPattern ? 1 : 0,
            },
            {
              headers: {
                Authorization: `${userData.userNo}|${userData.userToken}`,
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            },
          )
          .then(async (data) => {
            if (data.data.success) {
              // 곡 데이터를 다시 불러옴
              const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/v2/songs/${selectedGame}/${baseSongData[0].title}/user/${userData.userNo}`,
                {
                  headers: {
                    Authorization: `${userData.userNo}|${userData.userToken}`,
                  },
                  withCredentials: true,
                },
              )
              const { data } = response
              const { patterns, plusPatterns } = data
              const newPatterns = Object.fromEntries(
                Object.entries({
                  ...patterns,
                  ...Object.fromEntries(
                    Object.keys(plusPatterns).map((key) => [`${key}_PLUS`, plusPatterns[key]]),
                  ),
                }).sort(([keyA], [keyB]) => {
                  const numA = parseInt(keyA)
                  const numB = parseInt(keyB)
                  if (numA !== numB) return numA - numB
                  return keyA.includes('_PLUS') ? 1 : -1
                }),
              )
              setBaseSongData([
                {
                  ...data,
                  patterns: newPatterns,
                },
              ])
              setFetchingUpdateScore(false)
              setPatternCode('')
              showNotification('성과 기록을 정상적으로 저장하였습니다.', 'tw-bg-lime-600')
            }
          })
          .catch((error) => {
            logRendererError(error, { message: 'Error in fetchUpdateScore', ...userData })
            showNotification(
              '성과 기록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
              'tw-bg-red-600',
            )
          })
      } catch (error) {
        logRendererError(error, { message: 'Error in fetchUpdateScore', ...userData })
        console.error('Error fetching data:', error)
      }
    } else {
      setFetchingUpdateScore(false)
      showNotification(
        'WJMAX 데이터베이스에 기록할 수 있는 최대 점수는 100점입니다. 입력한 값을 다시 한번 확인해주세요.',
        'tw-bg-red-600',
      )
    }
  }

  useEffect(() => {
    if (fetchingUpdateScore) {
      fetchUpdateScore()
    }
  }, [fetchingUpdateScore])

  useEffect(() => {
    dispatch(setBackgroundBgaName(''))
  }, [])

  const fetchSongItemData = async (title) => {
    try {
      if (userData.userName !== '') {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/songs/${selectedGame}/${title}/user/${userData.userNo}`,
          {
            headers: {
              Authorization: `${userData.userNo}|${userData.userToken}`,
            },
            withCredentials: true,
          },
        )
        const { data } = response
        setSongItemData(data)
      } else {
        const response = baseSongData.filter(
          (baseSongData) => String(baseSongData.title) == String(title),
        )
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
      }, 500)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [hoveredTitle])

  const loadDataWithScore = async (title) => {
    if (userData.userName !== '') {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/songs/${selectedGame}/${title}/user/${userData.userNo}`,
          {
            headers: {
              Authorization: `${userData.userNo}|${userData.userToken}`,
            },
            withCredentials: true,
          },
        )
        if (!response) {
          throw new Error('Network response was not ok')
        }
        const { data } = response
        return data
      } catch (error) {
        logRendererError(error, { message: 'Error in loadDataWithScore', ...userData })
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
            const keysToRemove2 = ['DPC', 'SC', 'MX', 'HD', 'NM']
            const pathsToRemove = keysToRemove1.map((key1) =>
              keysToRemove2.map((key2) => ['patterns', key1, key2, 'level']),
            )
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

  // 모달 상태 추가
  const [showScoreModal, setShowScoreModal] = useState(false)

  const isDjCommentOpen = useSelector((state: RootState) => state.ui.isDjCommentOpen)

  const [patternViewerData, setPatternViewerData] = useState<any>(null)
  const [showPatternViewer, setShowPatternViewer] = useState<boolean>(false)

  // 패턴 데이터를 불러오는 함수
  const fetchPatternData = async (folderName: string, patternName: any, isKey6: boolean) => {
    try {
      const response = await fetch(
        `https://ribbon.r-archive.zip/${selectedGame}/music/${folderName}/${folderName} ${patternName?.en}${isKey6 ? ' Key6' : ''}.txt`,
      )

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const textData = await response.text()
      const jsonData = JSON.parse(textData)
      setPatternViewerData(jsonData)
      setShowPatternViewer(true)
    } catch (error) {
      logRendererError(error, { message: 'Error in fetchPatternData', ...userData })
      console.error('Error fetching pattern data:', error)
      showNotification(
        '해당 수록곡은 패턴 데이터가 존재하지 않습니다. 피드백 센터를 통해 패턴 데이터 추가 요청을 해주세요.',
        'tw-bg-red-600',
      )
    }
  }

  if (baseSongData.length > 0 && params?.titleNo) {
    return (
      <React.Fragment>
        <Head>
          <title>
            {baseSongData.length !== 0 ? baseSongData[0].name : '로딩중'} - 데이터베이스 - RACLA
          </title>
        </Head>
        <div className='tw-flex tw-gap-4 vh-screen'>
          {/* 곡 데이터 */}
          <div
            className={`tw-flex tw-flex-col tw-transition-all duration-300 ${isDjCommentOpen ? 'tw-w-8/12' : 'tw-w-full'}`}
          >
            <div
              className={
                'tw-flex tw-flex-col tw-gap-4 tw-bg-opacity-10 tw-rounded-md tw-mb-4 tw-h-auto tw-relative p-0'
              }
              onClick={() => {
                setPatternCode('')
              }}
            >
              {/* 배경 이미지 추가 */}
              <div className='tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md'>
                <Image
                  src={`https://ribbon.r-archive.zip/${selectedGame}/jackets/${baseSongData[0].folderName}.jpg`}
                  layout='fill'
                  objectFit='cover'
                  alt=''
                  className='tw-opacity-50 tw-blur-xl'
                />
                <div className='tw-absolute tw-inset-0 tw-bg-gray-800 tw-bg-opacity-75' />
              </div>

              <div className='tw-flex tw-justify-between tw-gap-4 tw-animate-fadeInLeft flex-equal tw-bg-gray-900 tw-bg-opacity-30 tw-rounded-md p-4'>
                {/* 하단 */}
                <div className='tw-flex tw-gap-3 tw-mt-auto tw-items-end'>
                  <Image
                    loading='lazy' // "lazy" | "eager"
                    blurDataURL={globalDictionary.blurDataURL}
                    src={`https://ribbon.r-archive.zip/${selectedGame}/jackets/${baseSongData[0].folderName}.jpg`}
                    height={74}
                    width={130}
                    alt=''
                    className='tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm'
                  />
                  <div className='tw-flex tw-flex-col tw-w-full'>
                    {/* 제목 */}
                    <span className='tw-flex tw-font-light tw-text-gray-300'>
                      {baseSongData[0].artist +
                        (baseSongData[0].composer !== '' ? ` / ${baseSongData[0].composer}` : '') +
                        ' / ' +
                        baseSongData[0].bpm +
                        ' BPM' +
                        ' / ' +
                        dayjs
                          .utc(baseSongData[0].time * 1000)
                          .locale('ko')
                          .format('m분 s초')}
                    </span>
                    <span className='tw-text-lg tw-font-bold me-auto'>
                      {baseSongData[0].name}

                      <sup className='tw-text-xs tw-font-light tw-text-gray-300'>
                        {' '}
                        (RACLA : {baseSongData[0].title})
                      </sup>
                    </span>
                  </div>
                </div>
                <div>
                  <div className='tw-flex tw-gap-2'>
                    {String(baseSongData[0].bgaUrl).trim() !== '' && (
                      <button
                        className='tw-inline-flex tw-items-center tw-gap-2 tw-animate-fadeInLeft tw-bg-gray-950 tw-bg-opacity-75 tw-rounded-md hover:tw-bg-gray-700 tw-transition-colors tw-text-sm p-1 px-2'
                        onClick={() => window.ipc.openBrowser(baseSongData[0].bgaUrl)}
                      >
                        <FaYoutube className='tw-text-red-500 tw-mt-0.5' />
                        <span className='tw-text-gray-300'>BGA 영상</span>
                      </button>
                    )}
                    <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-950 tw-bg-opacity-75 p-1'>
                      <span className='wjmax_dlc_code_wrap'>
                        <span
                          className={`wjmax_dlc_code wjmax_dlc_code_${baseSongData[0].dlcCode}`}
                        >
                          {baseSongData[0].dlc}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* <span>전 패턴을 퍼펙트플레이를 하면 DJ CLASS 만점(이론치)을 달성할 수 있는 리스트입니다.</span>
            <span>DJ CLASS 최상위 랭커를 노린다면 최소 BASIC 70패턴, NEW 30패턴을 플레이 해야합니다.</span> */}
            </div>

            {!isLoading && (
              <div className='tw-w-full tw-h-full tw-overflow-y-auto tw-p-4 tw-rounded-md tw-text-center tw-shadow-lg tw-bg-gray-800 tw-bg-opacity-75'>
                <div className='tw-flex tw-flex-col tw-gap-4 tw-h-full'>
                  {baseSongData.length !== 0 && !isLoading ? (
                    Object.keys(baseSongData[0].patterns)
                      .sort((a, b) => {
                        const numA = parseInt(a)
                        const numB = parseInt(b)
                        if (numA !== numB) return numA - numB
                        return a.includes('_PLUS') ? 1 : -1
                      })
                      .map((patternName) => (
                        <React.Fragment key={String(patternName)}>
                          {/* Button Column */}
                          <div className='tw-flex tw-flex-1 tw-gap-4'>
                            <div className='tw-min-w-20 tw-border-gray-600 tw-border-opacity-25 tw-flex tw-flex-col tw-justify-center tw-items-center tw-overflow-hidden tw-bg-gray-900 tw-bg-opacity-20 tw-rounded-lg'>
                              <div className='tw-relative tw-h-full tw-w-full tw-flex-1'>
                                <div
                                  className={`tw-absolute tw-inset-0 wjmax_db_button wjmax_bg_b${String(
                                    patternName,
                                  )
                                    .replace('B', '')
                                    .toLowerCase()} tw-rounded-lg`}
                                />
                                <span className='tw-aboslute tw-h-full tw-w-full tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-lg tw-font-extrabold tw-text-4xl tw-flex tw-items-center tw-justify-center'>
                                  <span className='tw-text-lg tw-font-bold tw-relative'>
                                    <span className='tw-text-2xl tw-font-bold'>
                                      {String(patternName).replace('B', '').replace('_PLUS', '')}B
                                      {String(patternName).includes('_PLUS') ? '+' : ''}
                                    </span>
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className='tw-flex-1 tw-grid tw-grid-cols-5 tw-gap-2'>
                              {/* Difficulty Columns */}
                              {['NM', 'HD', 'MX', 'SC', 'DPC'].map((difficultyCode: string) =>
                                baseSongData[0].patterns[patternName][difficultyCode] !==
                                  undefined &&
                                baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                                  <div className='tw-relative tw-h-full'>
                                    <button
                                      className='tw-absolute tw-right-2 tw-z-[100] tw-top-2 tw-flex-1 tw-px-2 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-500 tw-transition-all tw-text-sm'
                                      onClick={() =>
                                        fetchPatternData(
                                          baseSongData[0].folderName,
                                          baseSongData[0].patterns[patternName][difficultyCode]
                                            .patternName,
                                          String(patternName).includes('6B'),
                                        )
                                      }
                                    >
                                      <FaTable />
                                    </button>
                                    <div
                                      key={`${String(patternName)}_${difficultyCode}`}
                                      className={`tw-border-gray-600 tw-border-opacity-25 tw-flex tw-h-full tw-flex-col tw-justify-center tw-items-center tw-p-2 tw-bg-gray-700 tw-bg-opacity-20 tw-rounded-lg ${
                                        userData.userName !== ''
                                          ? 'tw-cursor-pointer hover:tw-bg-gray-600 hover:tw-bg-opacity-30'
                                          : ''
                                      } ${
                                        baseSongData[0].patterns[patternName][difficultyCode]
                                          .score !== undefined &&
                                        Number(
                                          baseSongData[0].patterns[patternName][difficultyCode]
                                            .score,
                                        ) <= 0
                                          ? 'tw-opacity-70 tw-bg-gray-950'
                                          : ''
                                      }`}
                                      onClick={() => {
                                        if (userData.userName !== '') {
                                          setPatternCode(
                                            `patterns${String(patternName)}${difficultyCode}`,
                                          )
                                          setPatternMaxCombo(
                                            baseSongData[0].patterns[patternName][difficultyCode]
                                              .maxCombo,
                                          )
                                          setPatternButton(String(patternName))
                                          setPatternDificulty(difficultyCode)
                                          setUpdateScore(
                                            Number(
                                              baseSongData[0].patterns[patternName][difficultyCode]
                                                .score !== undefined &&
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score !== null
                                                ? Number(
                                                    baseSongData[0].patterns[patternName][
                                                      difficultyCode
                                                    ].score,
                                                  )
                                                : 0,
                                            ),
                                          )
                                          setIsPlusPattern(String(patternName).includes('_PLUS'))
                                          setShowScoreModal(true)
                                        }
                                      }}
                                    >
                                      <div className='tw-flex tw-w-full tw-justify-center tw-items-center tw-rounded-lg tw-gap-4 tw-p-2'>
                                        {/* 난이도 표시 */}
                                        <div className='tw-w-flex tw-flex-col tw-justify-center tw-items-center'>
                                          <span
                                            className={
                                              difficultyCode === 'NM'
                                                ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-nm'
                                                : difficultyCode === 'HD'
                                                  ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-hd'
                                                  : difficultyCode === 'MX'
                                                    ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-mx'
                                                    : difficultyCode === 'SC'
                                                      ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-sc'
                                                      : 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-dpc'
                                            }
                                          >
                                            <Image
                                              loading='lazy'
                                              blurDataURL={globalDictionary.blurDataURL}
                                              src={
                                                difficultyCode === 'NM'
                                                  ? `https://ribbon.r-archive.zip/wjmax/nm_5_star.png`
                                                  : difficultyCode === 'HD'
                                                    ? `https://ribbon.r-archive.zip/wjmax/nm_10_star.png`
                                                    : difficultyCode === 'MX'
                                                      ? `https://ribbon.r-archive.zip/wjmax/nm_15_star.png`
                                                      : difficultyCode === 'SC'
                                                        ? `https://ribbon.r-archive.zip/wjmax/nm_20_star.png`
                                                        : `https://ribbon.r-archive.zip/wjmax/nm_25_star.png`
                                              }
                                              height={24}
                                              width={24}
                                              alt=''
                                              className='tw-drop-shadow-lg'
                                            />
                                            {baseSongData[0].patterns[patternName][
                                              difficultyCode
                                            ].level.toFixed(1)}
                                          </span>
                                          {baseSongData[0].patterns[patternName][difficultyCode]
                                            .floor &&
                                            Number(
                                              baseSongData[0].patterns[patternName][difficultyCode]
                                                .floor,
                                            ) > 0 && (
                                              <span
                                                className={
                                                  difficultyCode === 'NM'
                                                    ? 'tw-font-light tw-text-sm tw-text-wjmax-nm'
                                                    : difficultyCode === 'HD'
                                                      ? 'tw-font-light tw-text-sm tw-text-wjmax-hd'
                                                      : difficultyCode === 'MX'
                                                        ? 'tw-font-light tw-text-sm tw-text-wjmax-mx'
                                                        : difficultyCode === 'SC'
                                                          ? 'tw-font-light tw-text-sm tw-text-wjmax-sc'
                                                          : 'tw-font-light tw-text-sm tw-text-wjmax-dpc'
                                                }
                                              >
                                                (
                                                {
                                                  baseSongData[0].patterns[patternName][
                                                    difficultyCode
                                                  ].floor
                                                }
                                                F)
                                              </span>
                                            )}
                                        </div>

                                        {/* 점수 표시 (로그인한 경우에만) */}
                                        {userData.userName !== '' && (
                                          <div className='tw-flex tw-flex-col tw-items-start tw-justify-center tw-gap-1 tw-min-w-20'>
                                            {baseSongData[0].patterns[patternName][difficultyCode]
                                              .score &&
                                            Number(
                                              baseSongData[0].patterns[patternName][difficultyCode]
                                                .score,
                                            ) > 0 ? (
                                              baseSongData[0].patterns[patternName][difficultyCode]
                                                .score === '100.00' ? (
                                                <>
                                                  {/* <span className="tw-font-bold tw-text-sm tw-text-yellow-400 tw-drop-shadow-lg">PERFECT</span> */}
                                                  <span className='tw-font-light tw-text-sm tw-text-gray-300'>
                                                    {
                                                      baseSongData[0].patterns[patternName][
                                                        difficultyCode
                                                      ].score
                                                    }
                                                    %{' '}
                                                    {/* <sup>{baseSongData[0].patterns[patternName][difficultyCode].rating}TP</sup> */}
                                                  </span>
                                                </>
                                              ) : (
                                                <>
                                                  {/* <span className="tw-font-bold tw-text-3xl tw-drop-shadow-lg">
                                            {getGrade(baseSongData[0].patterns[patternName][difficultyCode].score)}
                                          </span> */}
                                                  <span className='tw-font-light tw-text-sm tw-text-gray-300'>
                                                    {
                                                      baseSongData[0].patterns[patternName][
                                                        difficultyCode
                                                      ].score
                                                    }
                                                    %{' '}
                                                    {/* <sup>{baseSongData[0].patterns[patternName][difficultyCode].rating}TP</sup> */}
                                                  </span>
                                                </>
                                              )
                                            ) : (
                                              <>
                                                <span className='tw-font-light tw-text-sm tw-text-gray-500'>
                                                  -
                                                </span>
                                                <span className='tw-font-light tw-text-xs tw-text-gray-400 tw-break-keep'>
                                                  (기록 미존재)
                                                </span>
                                              </>
                                            )}
                                            {baseSongData[0].patterns[patternName][difficultyCode]
                                              .score !== undefined &&
                                            baseSongData[0].patterns[patternName][difficultyCode]
                                              .score === '100.00' ? (
                                              <span className='tw-text-xs tw-font-light tw-text-yellow-400'>
                                                MAX COMBO
                                              </span>
                                            ) : baseSongData[0].patterns[patternName][
                                                difficultyCode
                                              ].maxCombo ? (
                                              <span className='tw-text-xs tw-font-light tw-text-yellow-400'>
                                                MAX COMBO
                                              </span>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div key={`${String(patternName)}_${difficultyCode}`}></div>
                                ),
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      ))
                  ) : (
                    <div className='tw-col-span-5'>
                      <SyncLoader color='#ffffff' size={8} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <ScoreEditComponent
            show={showScoreModal}
            onHide={() => {
              setShowScoreModal(false)
              setPatternCode('')
            }}
            patternMaxCombo={patternMaxCombo}
            setPatternMaxCombo={setPatternMaxCombo}
            updateScore={updateScore}
            setUpdateScore={setUpdateScore}
            onSave={() => {
              setFetchingUpdateScore(true)
              setShowScoreModal(false)
            }}
          />
        </div>
        {showPatternViewer && patternViewerData && (
          <WjmaxChartComponent
            chartData={patternViewerData}
            bpm={baseSongData[0].bpm}
            onClose={() => setShowPatternViewer(false)}
          />
        )}
      </React.Fragment>
    )
  } else {
    return <></>
  }
}
