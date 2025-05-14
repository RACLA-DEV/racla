import 'dayjs/locale/ko'

import * as R from 'ramda'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

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
import { FaRankingStar } from 'react-icons/fa6'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

dayjs.locale('ko')
dayjs.extend(utc)

const PlatinaLabDbDetailPage = () => {
  const { showNotification } = useNotificationSystem()
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)

  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch()
  const { platinaLabSongData, userData } = useSelector((state: RootState) => state.app)

  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [songItemData, setSongItemData] = useState<any>(null)

  const [commentData, setCommentData] = useState<any[]>([])

  useEffect(() => {
    const initializeData = async () => {
      const filteredData = platinaLabSongData.filter(
        (value) => String(value.title) == params?.titleNo,
      )

      if (filteredData.length === 0) {
        router.push(`/projectRa/${selectedGame}/db`)
        return
      }

      // 로그인한 사용자의 경우 rating 정보를 포함한 데이터 가져오기
      if (userData.userName) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/racla/songs/${selectedGame}/${params?.titleNo}/user/${userData.userNo}`,
            {
              headers: {
                Authorization: `${userData.userNo}|${userData.userToken}`,
              },
              withCredentials: true,
            },
          )
          const { data } = response
          const { patterns } = data
          setBaseSongData([
            {
              ...data,
              patterns,
            },
          ])
          console.log({
            ...data,
            patterns,
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
      dispatch(
        setBackgroundBgaName(
          'resources/music' + String(baseSongData[0].bgaPreviewFileName).replace('.mp4', ''),
        ),
      )
    }
  }, [baseSongData])

  useEffect(() => {
    if (backgroundBgaName !== '' && baseSongData.length > 0) {
      dispatch(
        setBackgroundBgaName(
          'resources/music' + String(baseSongData[0].bgaPreviewFileName).replace('.mp4', ''),
        ),
      )
    }
  }, [backgroundBgaName])

  const [patternCode, setPatternCode] = useState<string>('')
  const [patternButton, setPatternButton] = useState<string>('')
  const [isPlusPattern, setIsPlusPattern] = useState<boolean>(false)
  const [patternDificulty, setPatternDificulty] = useState<string>('')
  const [patternMaxCombo, setPatternMaxCombo] = useState<boolean>(false)
  const [updateScore, setUpdateScore] = useState<number>(0)
  const [updateMax, setUpdateMax] = useState<number>(0)
  const [fetchingUpdateScore, setFetchingUpdateScore] = useState<boolean>(false)

  const fetchUpdateScore = async () => {
    if (updateScore <= 100 && updateMax <= 3000) {
      try {
        const response = await axios
          .post(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/racla/play/${selectedGame}/update`,
            {
              button: Number(String(patternButton).replace('B', '').replace('_PLUS', '')),
              pattern: patternDificulty,
              force: true,
              maxCombo: patternMaxCombo || updateScore == 100 ? Number(1) : Number(0),
              score: updateScore,
              max: updateMax,
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
                `${process.env.NEXT_PUBLIC_API_URL}/v2/racla/songs/${selectedGame}/${baseSongData[0].title}/user/${userData.userNo}`,
                {
                  headers: {
                    Authorization: `${userData.userNo}|${userData.userToken}`,
                  },
                  withCredentials: true,
                },
              )
              const { data } = response
              const { patterns } = data
              setBaseSongData([
                {
                  ...data,
                  patterns,
                },
              ])
              setFetchingUpdateScore(false)
              setPatternCode('')
              showNotification('성과 기록을 정상적으로 저장하였습니다.', 'tw-bg-lime-600')
            }
          })
          .catch((error) => {
            logRendererError(error, { message: 'Error in fetchUpdateScore', ...userData })
            console.log(error)
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
        'PLATiNA :: LAB 데이터베이스에 기록할 수 있는 최대 점수는 100점입니다. 입력한 값을 다시 한번 확인해주세요.',
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
          `${process.env.NEXT_PUBLIC_API_URL}/v2/racla/songs/${selectedGame}/${title}/user/${userData.userNo}`,
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
          `${process.env.NEXT_PUBLIC_API_URL}/v2/racla/songs/${selectedGame}/${title}/user/${userData.userNo}`,
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
                  src={`https://cdn.racla.app/${selectedGame}/jackets/cropped/${String(baseSongData[0].title)}.jpg`}
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
                    src={`https://cdn.racla.app/${selectedGame}/jackets/resized/${String(baseSongData[0].title)}.jpg`}
                    height={80}
                    width={80}
                    alt=''
                    className='tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm'
                  />
                  <div className='tw-flex tw-flex-col tw-w-full'>
                    {/* 제목 */}
                    <span className='tw-flex tw-font-light tw-text-gray-300'>
                      {baseSongData[0].artist +
                        ' / ' +
                        (baseSongData[0].bpm == baseSongData[0].bpmLow
                          ? baseSongData[0].bpm
                          : baseSongData[0].bpmLow + '~' + baseSongData[0].bpm) +
                        ' BPM'}
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
                    {String(baseSongData[0]?.officialCode).trim() !== '' &&
                      String(baseSongData[0]?.officialCode) !== 'null' && (
                        <button
                          className='tw-inline-flex tw-items-center tw-gap-2 tw-animate-fadeInLeft tw-bg-gray-950 tw-bg-opacity-75 tw-rounded-md hover:tw-bg-gray-700 tw-transition-colors tw-text-sm p-1 px-2'
                          onClick={() =>
                            window.ipc.openBrowser(
                              `https://platinalab.net/ranking/${baseSongData[0].officialCode}`,
                            )
                          }
                        >
                          <FaRankingStar className='tw-text-gray-300' />
                          <span className='tw-text-gray-300'>랭킹(공식 홈페이지)</span>
                        </button>
                      )}
                    <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-950 tw-bg-opacity-75 p-1'>
                      <span className='platina_lab_dlc_code_wrap'>
                        <span
                          className={`platina_lab_dlc_code platina_lab_dlc_code_${baseSongData[0].dlcCode}`}
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
                                  className={`tw-absolute tw-inset-0 platina_lab_db_button platina_lab_bg_b${String(
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

                            <div className='tw-flex-1 tw-flex tw-flex-col tw-gap-2'>
                              {/* 상단 행: EASY, HD, OVER */}
                              <div className='tw-flex-1 tw-grid tw-grid-cols-3 tw-gap-2'>
                                {['EASY', 'HD', 'OVER'].map((difficultyCode: string) =>
                                  baseSongData[0].patterns[patternName][difficultyCode] !==
                                    undefined &&
                                  baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                                    <div className='tw-relative tw-h-full'>
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
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score !== undefined &&
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
                                            setUpdateMax(
                                              Number(
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].max !== undefined &&
                                                  baseSongData[0].patterns[patternName][
                                                    difficultyCode
                                                  ].max !== null
                                                  ? Number(
                                                      baseSongData[0].patterns[patternName][
                                                        difficultyCode
                                                      ].max,
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
                                                difficultyCode === 'EASY'
                                                  ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-platina-lab-easy'
                                                  : difficultyCode === 'HD'
                                                    ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-platina-lab-hd'
                                                    : difficultyCode === 'OVER'
                                                      ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-platina-lab-over'
                                                      : 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-platina-lab-plus'
                                              }
                                            >
                                              Lv.
                                              {baseSongData[0].patterns[patternName][
                                                difficultyCode
                                              ].level.toFixed(0)}
                                            </span>
                                            {baseSongData[0].patterns[patternName][difficultyCode]
                                              .floor &&
                                              Number(
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].floor,
                                              ) > 0 && (
                                                <span
                                                  className={
                                                    difficultyCode === 'EASY'
                                                      ? 'tw-font-light tw-text-sm tw-text-platina-lab-easy'
                                                      : difficultyCode === 'HD'
                                                        ? 'tw-font-light tw-text-sm tw-text-platina-lab-hd'
                                                        : difficultyCode === 'OVER'
                                                          ? 'tw-font-light tw-text-sm tw-text-platina-lab-over'
                                                          : 'tw-font-light tw-text-sm tw-text-platina-lab-plus'
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
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score,
                                              ) > 0 ? (
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score === '100.00' ? (
                                                  <>
                                                    {/* <span className="tw-font-bold tw-text-sm tw-text-yellow-400 tw-drop-shadow-lg">PERFECT</span> */}
                                                    <span className='tw-font-light tw-text-sm tw-text-gray-300'>
                                                      {
                                                        baseSongData[0].patterns[patternName][
                                                          difficultyCode
                                                        ].score
                                                      }
                                                      %{' '}
                                                      {Number(
                                                        baseSongData[0].patterns[patternName][
                                                          difficultyCode
                                                        ]?.score,
                                                      ) == 100 ? (
                                                        <sup>
                                                          MAX
                                                          {baseSongData[0].patterns[patternName][
                                                            difficultyCode
                                                          ]?.max != 0
                                                            ? ' - ' +
                                                              baseSongData[0].patterns[patternName][
                                                                difficultyCode
                                                              ]?.max
                                                            : null}
                                                        </sup>
                                                      ) : null}
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

                              {/* 하단 행: PLUS_1, PLUS_2, PLUS_3 */}
                              <div className='tw-grid tw-flex-1 tw-grid-cols-3 tw-gap-2'>
                                {['PLUS_1', 'PLUS_2', 'PLUS_3'].map((difficultyCode: string) =>
                                  baseSongData[0].patterns[patternName][difficultyCode] !==
                                    undefined &&
                                  baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                                    <div className='tw-relative tw-h-full'>
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
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score !== undefined &&
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
                                            setUpdateMax(
                                              Number(
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].max !== undefined &&
                                                  baseSongData[0].patterns[patternName][
                                                    difficultyCode
                                                  ].max !== null
                                                  ? Number(
                                                      baseSongData[0].patterns[patternName][
                                                        difficultyCode
                                                      ].max,
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
                                                difficultyCode === 'EASY'
                                                  ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-platina-lab-easy'
                                                  : difficultyCode === 'HD'
                                                    ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-platina-lab-hd'
                                                    : difficultyCode === 'OVER'
                                                      ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-platina-lab-over'
                                                      : 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-platina-lab-plus'
                                              }
                                            >
                                              Lv.
                                              {baseSongData[0].patterns[patternName][
                                                difficultyCode
                                              ].level.toFixed(0)}
                                            </span>
                                            {baseSongData[0].patterns[patternName][difficultyCode]
                                              .floor &&
                                              Number(
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].floor,
                                              ) > 0 && (
                                                <span
                                                  className={
                                                    difficultyCode === 'EASY'
                                                      ? 'tw-font-light tw-text-sm tw-text-platina-lab-easy'
                                                      : difficultyCode === 'HD'
                                                        ? 'tw-font-light tw-text-sm tw-text-platina-lab-hd'
                                                        : difficultyCode === 'OVER'
                                                          ? 'tw-font-light tw-text-sm tw-text-platina-lab-over'
                                                          : 'tw-font-light tw-text-sm tw-text-platina-lab-plus'
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
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score,
                                              ) > 0 ? (
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score === '100.00' ? (
                                                  <>
                                                    {/* <span className="tw-font-bold tw-text-sm tw-text-yellow-400 tw-drop-shadow-lg">PERFECT</span> */}
                                                    <span className='tw-font-light tw-text-sm tw-text-gray-300'>
                                                      {
                                                        baseSongData[0].patterns[patternName][
                                                          difficultyCode
                                                        ].score
                                                      }
                                                      %{' '}
                                                      {Number(
                                                        baseSongData[0].patterns[patternName][
                                                          difficultyCode
                                                        ]?.score,
                                                      ) == 100 ? (
                                                        <sup>
                                                          MAX
                                                          {baseSongData[0].patterns[patternName][
                                                            difficultyCode
                                                          ]?.max != 0
                                                            ? ' - ' +
                                                              baseSongData[0].patterns[patternName][
                                                                difficultyCode
                                                              ]?.max
                                                            : null}
                                                        </sup>
                                                      ) : null}
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
            gameCode={'platina_lab'}
            show={showScoreModal}
            onHide={() => {
              setShowScoreModal(false)
              setPatternCode('')
            }}
            patternMaxCombo={patternMaxCombo}
            setPatternMaxCombo={setPatternMaxCombo}
            updateMax={updateMax}
            setUpdateMax={setUpdateMax}
            updateScore={updateScore}
            setUpdateScore={setUpdateScore}
            onSave={() => {
              setFetchingUpdateScore(true)
              setShowScoreModal(false)
            }}
          />
        </div>
      </React.Fragment>
    )
  } else {
    return <></>
  }
}

export default PlatinaLabDbDetailPage
