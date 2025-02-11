import * as R from 'ramda'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Head from 'next/head'
import { RootState } from 'store'
import ScorePopupComponent from '@/components/score/popup/ScorePopupDjmax'
import { SyncLoader } from 'react-spinners'
import { globalDictionary } from '@constants/globalDictionary'
import { logRendererError } from '@utils/rendererLoggerUtils'
import { setBackgroundBgaName } from 'store/slices/uiSlice'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'

interface SongItem {
  title: number
  name: string
  composer: string
  dlcCode: string
  dlc: string
  pattern: string
  level: number
  floor: number | null
  rating: number | null
}

export default function VArchiveDbPage() {
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)

  const router = useRouter()
  const params = useParams()
  const dispatch = useDispatch()
  const { songData, userData, vArchiveUserData } = useSelector((state: RootState) => state.app)

  const [keyMode, setKeyMode] = useState<string>('4')
  const [keyPattern, setKeyPattern] = useState<string>('SC')
  const [keyDjPower, setKeyDjPower] = useState<boolean>(false)
  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [songItemData, setSongItemData] = useState<any>(null)

  const [commentRivalName, setCommentRivalName] = useState<string>('')
  const [commentRivalSongItemData, setCommentRivalSongItemData] = useState<any>(null)

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

  const descendWithNull = R.descend((SongItem: SongItem) =>
    SongItem.floor === null ? -Infinity : SongItem.floor,
  )
  const sortedData = (originalData) => R.sortWith([descendWithNull], originalData)

  // 대소문자 구분 없이 오름차순으로 정렬하고 한글이 먼저 오도록 하는 함수
  const sortByName = R.sortWith([
    R.ascend((item: SongItem) => R.indexOf(item.pattern, ['NM', 'HD', 'MX', 'SC'])),
    R.ascend(
      R.pipe(R.path(['name']), (name: string) => {
        // 문자열을 정규화
        const normalized = name.normalize('NFC').toLowerCase()

        // 한글이 앞에 오도록 하기 위한 처리
        return /^[\uac00-\ud7a3]/.test(normalized) ? `0${normalized}` : `1${normalized}`
      }),
    ),
  ])

  const LevelDictionary = {
    level2: 12,
    level4: 13,
    level6: 14,
    level8: 15,
  }

  const sortedDjPowerData = (originalData: SongItem[], mode, pattern) => {
    if (originalData.length > 0) {
      const sortedData = originalData.filter(
        (songItem) =>
          songItem.pattern === 'SC' ||
          (pattern === 'ALL' &&
            ['NM', 'HD', 'MX'].includes(songItem.pattern) &&
            songItem.level >= 12),
      )

      return [...new Set([...sortedData.map((songItem) => songItem.level)])].map((level) => {
        const sortedDataWithLevel = sortedData.filter((songItem: SongItem) =>
          pattern === 'ALL'
            ? ![2, 4, 6, 8].includes(level)
              ? songItem.level === level && songItem.pattern === 'SC'
              : (songItem.level === level && songItem.pattern === 'SC') ||
                (['NM', 'HD', 'MX'].includes(songItem.pattern) &&
                  songItem.level === LevelDictionary[`level${level}`])
            : songItem.level === level && songItem.pattern === 'SC',
        )

        return {
          level,
          floorItems: [...new Set([...sortedDataWithLevel.map((songItem) => songItem.floor)])].map(
            (floor) => {
              return {
                floor,
                songItems: sortByName(
                  sortedDataWithLevel.filter((songItem) => songItem.floor === floor),
                ),
              }
            },
          ),
        }
      })
    }
  }

  const sortData = () => {
    if (songData.length > 0) {
      let processedData = []

      songData.forEach((track) => {
        const { title, name, composer, dlcCode, dlc, patterns } = track
        const patternButton = patterns[keyMode + 'B']

        for (let key in patternButton) {
          if (patternButton.hasOwnProperty(key)) {
            const newTrack = {
              title,
              name,
              composer,
              dlcCode,
              dlc,
              pattern: key, // NM, HD, MX, SC
              level: patternButton[key].level,
              floor: patternButton[key].floor || null, // Optional, defaults to null if not present
              rating: patternButton[key].rating || null, // Optional, defaults to null if not present
              patterns,
            }
            processedData = [...processedData, newTrack]
          }
        }
      })
      sortedData(processedData)

      setBaseSongData(
        !keyDjPower
          ? // 패턴 또는 난이도
            keyPattern !== 'SC'
            ? [
                {
                  level: 0,
                  floorItems: [
                    ...new Set([
                      ...sortedData(processedData)
                        .filter((songItem) =>
                          keyPattern == 'ALL'
                            ? true
                            : songItem.level === Number(keyPattern) && songItem.pattern !== 'SC',
                        )
                        .map((item) => item.floor),
                    ]),
                  ].map((floor) => {
                    return {
                      floor,
                      songItems: sortByName(
                        processedData
                          .filter((songItem) =>
                            keyPattern == 'ALL'
                              ? true
                              : songItem.level === Number(keyPattern) && songItem.pattern !== 'SC',
                          )
                          .filter((songItem) => songItem.floor === floor),
                      ),
                    }
                  }),
                },
              ]
            : [
                {
                  level: 0,
                  floorItems: [
                    ...new Set([
                      ...sortedData(processedData)
                        .filter((songItem) => songItem.pattern === 'SC')
                        .map((item) => item.floor),
                    ]),
                  ].map((floor) => {
                    return {
                      floor,
                      songItems: sortByName(
                        processedData
                          .filter((songItem) => songItem.pattern === 'SC')
                          .filter((songItem) => songItem.floor === floor),
                      ),
                    }
                  }),
                },
              ]
          : // DJ POWER
            sortedDjPowerData(sortedData(processedData), keyMode, keyPattern),
      )
      setIsLoading(false)
    }
  }

  useEffect(() => {
    sortData()
  }, [])

  useEffect(() => {
    sortData()
  }, [keyMode, keyPattern, keyDjPower])

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

  const { selectedGame } = useSelector((state: RootState) => state.app)

  return (
    <React.Fragment>
      <Head>
        <title>
          {String(keyMode) !== 'DJPOWER' ? String(keyMode) + 'B' : 'DJ POWER'}{' '}
          {isNaN(Number(String(keyPattern))) ? String(keyPattern) : `Lv.${String(keyPattern)}`}{' '}
          서열표 - RACLA
        </title>
      </Head>

      <div id='ContentHeader' />
      <div className='tw-flex tw-gap-4'>
        {/* 곡 데이터 */}
        <div className='tw-flex tw-flex-col tw-w-full tw-relative'>
          {/* 상단 설명 섹션 */}
          <div className='tw-flex tw-gap-4'>
            <div className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-4 tw-flex-1'>
              {/* 헤더 */}
              <div className='tw-flex tw-w-full tw-items-end tw-justify-between'>
                <span className='tw-text-xl tw-font-bold tw-text-white'>🛝 서열표</span>
              </div>

              {/* 설명 내용 */}
              <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2 tw-mb-auto'>
                <p className='tw-leading-relaxed'>
                  V-ARCHIVE의 서열표는 디제이맥스 리스펙트 V 마이너 갤러리에서 투표로 만들어지는
                  비공식 난이도표(서열표)를 그대로 차용하고 있습니다. (SC 패턴과 12렙 이상의
                  NM/HD/MX 패턴만)
                </p>
              </div>
            </div>

            {/* 필터 섹션 */}
            <div
              className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-4'
              style={{ width: '520px' }}
            >
              {/* 헤더 */}
              <div className='tw-flex tw-w-full tw-items-end tw-mb-2'>
                <span className='tw-text-xl tw-font-bold tw-text-white'>필터</span>
              </div>

              {/* keyMode 선택 */}
              <div className='tw-grid tw-grid-cols-5 tw-gap-3'>
                <button
                  key={`keyModeSelector_DJPOWER`}
                  onClick={() => {
                    setKeyDjPower(!keyDjPower)
                    setKeyPattern(String('ALL'))
                    setBaseSongData([])
                    setIsLoading(true)
                  }}
                  className={
                    'tw-flex tw-items-center tw-justify-center tw-relative tw-h-16 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-border-gray-600 tw-rounded-sm hover:tw-border-purple-400 ' +
                    (keyDjPower
                      ? 'tw-brightness-150 tw-border-purple-500 tw-bg-purple-900 tw-bg-opacity-20'
                      : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100')
                  }
                  disabled={isLoading}
                >
                  <div
                    className={
                      `tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b` +
                      String('DJPOWER')
                    }
                  />
                  <div className='tw-relative tw-flex tw-flex-col tw-items-center tw-gap-1'>
                    <span className='tw-text-sm tw-font-extrabold'>DJ POWER</span>
                    <span className='tw-text-sm tw-text-gray-300'>{keyDjPower ? 'ON' : 'OFF'}</span>
                  </div>
                </button>
                {globalDictionary[selectedGame].keyModeList.map((value) => (
                  <button
                    key={`keyModeSelector_${value}`}
                    onClick={() => {
                      setKeyMode(String(value))
                      setKeyPattern(String('SC'))
                      setBaseSongData([])
                      setIsLoading(true)
                    }}
                    className={
                      'tw-flex tw-items-center tw-justify-center tw-relative tw-h-16 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-border-gray-600 tw-rounded-sm hover:tw-border-blue-400 ' +
                      (keyMode === String(value)
                        ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                        : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100')
                    }
                    disabled={isLoading || keyMode === String(value)}
                  >
                    <div
                      className={
                        `tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b` + String(value)
                      }
                    />
                    <div className='tw-relative tw-flex tw-flex-col tw-items-center tw-gap-1'>
                      <span className='tw-text-lg tw-font-bold'>{String(value)}B</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 패턴/레벨 선택 */}
              <div className='tw-flex tw-gap-2 tw-mt-2'>
                {['ALL', 'SC', '15', '14', '13', '12'].map((value) => (
                  <button
                    key={`keyModeSelector_${value}`}
                    onClick={() => {
                      setKeyPattern(String(value))
                    }}
                    className={
                      'tw-flex tw-flex-1 tw-items-center tw-justify-center tw-relative tw-h-12 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-border-gray-600 tw-rounded-sm hover:tw-border-blue-400 ' +
                      (keyPattern === String(value)
                        ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                        : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100') +
                      (keyDjPower && !isNaN(Number(String(value))) ? ' tw-opacity-0 tw-hidden' : '')
                    }
                    disabled={
                      isLoading ||
                      keyPattern === String(value) ||
                      (keyDjPower && !isNaN(Number(String(value))))
                    }
                  >
                    <div
                      className={
                        `tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b` + String(value)
                      }
                    />
                    <span className='tw-text-sm tw-font-bold'>
                      {isNaN(Number(String(value))) ? String(value) : `Lv.${String(value)}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 기존 필터 버튼들 */}
          <div className='tw-flex tw-flex-col tw-gap-1 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md p-4'>
            {baseSongData.length > 0 && !isLoading ? (
              baseSongData.map((levelData) => (
                <div
                  key={'DifficultyBody' + levelData.level}
                  className='tw-flex tw-flex-col tw-animate-fadeInLeft'
                >
                  <span className='tw-text-2xl tw-py-2 tw-mb-3 tw-w-full tw-font-bold tw-border-b tw-border-gray-600 tw-border-opacity-50 me-auto'>
                    {baseSongData.length === 1
                      ? (String(keyMode) !== 'DJPOWER' ? String(keyMode) + 'B' : 'DJ POWER') +
                        ' ' +
                        (isNaN(Number(String(keyPattern)))
                          ? String(keyPattern)
                          : `Lv.${String(keyPattern)}`)
                      : 'SC ' +
                        levelData.level +
                        ([2, 4, 6, 8].includes(levelData.level) && keyPattern === 'ALL'
                          ? ` + Lv.${LevelDictionary[`level${levelData.level}`]}`
                          : '')}
                  </span>
                  <div className='tw-flex tw-flex-col tw-gap-6'>
                    {levelData.floorItems
                      ? levelData.floorItems.map((floorItem) =>
                          floorItem.floor ? (
                            <div
                              key={
                                'FloorItemsPack' +
                                levelData.level +
                                '_' +
                                String(floorItem.floor).replace('.', '_')
                              }
                              className='tw-flex tw-gap-3'
                            >
                              <span className='tw-font-bold tw-text-base tw-min-w-12 tw-text-right'>
                                {floorItem.floor}
                              </span>
                              <div className='tw-flex tw-flex-wrap tw-gap-3'>
                                {floorItem.songItems.map((songItem) => (
                                  <ScorePopupComponent
                                    songItem={songItem}
                                    keyMode={keyMode}
                                    isScored={false}
                                    isVisibleCode={true}
                                    isFlatten={true}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : null,
                        )
                      : null}
                  </div>
                </div>
              ))
            ) : (
              <div className='tw-flex tw-justify-center tw-h-[calc(100vh-400px)] tw-items-center'>
                <SyncLoader color='#ffffff' size={8} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div id='ContentFooter' />
    </React.Fragment>
  )
}
