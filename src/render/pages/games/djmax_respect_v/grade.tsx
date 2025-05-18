import ScorePopupComponent from '@render/components/score/ScorePopup'
import { globalDictionary } from '@render/constants/globalDictionary'
import { RootState } from '@render/store'
import type { PlayBoardPatternInfo } from '@src/types/dto/playBoard/PlayBoardPatternInfo'
import { SongData } from '@src/types/games/SongData'
import * as R from 'ramda'

import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'
import { PuffLoader } from 'react-spinners'

// 지연 로딩되는 FloorItem 컴포넌트
const LazyFloorItem = ({ floorItem, keyMode, levelData }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '100px',
  })

  return (
    <div
      ref={ref}
      key={`FloorItemsPack${levelData.level}_${String(floorItem.floor).replace('.', '_')}`}
      className='tw:flex tw:gap-3 tw:mb-6'
    >
      <span className='tw:font-bold tw:text-base tw:min-w-12 tw:text-right tw:text-slate-700 tw:dark:text-slate-300'>
        {floorItem.floor}
      </span>
      <div className='tw:flex tw:flex-wrap tw:gap-3'>
        {inView &&
          floorItem.songItems.map((songItem) => (
            <ScorePopupComponent
              key={`song_${songItem.title}_${floorItem.floor}`}
              songTitle={songItem.title}
              keyMode={keyMode}
              isVisibleCode={true}
              floor={Number(floorItem.floor)}
            />
          ))}
      </div>
    </div>
  )
}

interface FloorItem {
  floor: number
  songItems: SongData[]
}

interface BaseSongData {
  level: number
  floorItems: FloorItem[]
}

const DmrvGradePage = () => {
  const { t } = useTranslation(['grade'])
  const { songData, selectedGame } = useSelector((state: RootState) => state.app)
  const [keyMode, setKeyMode] = useState<string>('4')
  const [keyPattern, setKeyPattern] = useState<string>('SC')
  const [keyDjPower, setKeyDjPower] = useState<boolean>(false)
  const [baseSongData, setBaseSongData] = useState<BaseSongData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const descendWithNull = R.descend((SongItem: PlayBoardPatternInfo) =>
    SongItem.floor === null ? -Infinity : SongItem.floor,
  )
  const sortedData = (originalData) => R.sortWith([descendWithNull], originalData)

  // 대소문자 구분 없이 오름차순으로 정렬하고 한글이 먼저 오도록 하는 함수
  const sortByName = R.sortWith([
    R.ascend((item: PlayBoardPatternInfo) => R.indexOf(item.pattern, ['NM', 'HD', 'MX', 'SC'])),
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

  const sortedDjPowerData = (
    originalData: PlayBoardPatternInfo[],
    pattern: string,
  ): BaseSongData[] => {
    if (originalData.length > 0) {
      const sortedData = originalData.filter(
        (songItem) =>
          songItem.pattern === 'SC' ||
          (pattern === 'ALL' &&
            ['NM', 'HD', 'MX'].includes(songItem.pattern) &&
            songItem.level >= 12),
      )

      return [...new Set([...sortedData.map((songItem) => songItem.level)])].map((level) => {
        const sortedDataWithLevel = sortedData.filter((songItem: PlayBoardPatternInfo) =>
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
                ) as unknown as SongData[],
              }
            },
          ),
        }
      })
    }
    return []
  }

  const sortData = useCallback(() => {
    if (songData[selectedGame].length > 0) {
      let processedData = []

      songData[selectedGame].forEach((track) => {
        const { title, name, composer, dlcCode, dlc, patterns } = track
        const patternButton = patterns[keyMode + 'B']

        for (let key in patternButton) {
          if (Object.prototype.hasOwnProperty.call(patternButton, key)) {
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
                      ) as unknown as SongData[],
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
                      ) as unknown as SongData[],
                    }
                  }),
                },
              ]
          : // DJ POWER
            sortedDjPowerData(sortedData(processedData), keyPattern),
      )
      setIsLoading(false)
    }
  }, [keyMode, keyPattern, keyDjPower, songData, selectedGame])

  useEffect(() => {
    sortData()
  }, [])

  useEffect(() => {
    sortData()
  }, [keyMode, keyPattern, keyDjPower])

  return (
    <React.Fragment>
      <div id='ContentHeader' />
      <div className='tw:flex tw:gap-4'>
        {/* 곡 데이터 */}
        <div className='tw:flex tw:flex-col tw:w-full tw:relative'>
          {/* 상단 설명 섹션 */}
          <div className='tw:flex tw:gap-4'>
            {/* 필터 섹션 */}
            <div className='tw:flex tw:flex-col tw:w-full tw:gap-4 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-6 tw:mb-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
              {/* 헤더 */}
              <div className='tw:flex tw:w-full tw:items-end tw:justify-between'>
                <span className='tw:text-xl tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                  {t('grade')}
                </span>
              </div>
              <div className='tw:flex tw:gap-4'>
                {/* keyMode 선택 */}
                <div className='tw:grid tw:grid-cols-5 tw:gap-3 tw:flex-1'>
                  <button
                    key={`keyModeSelector_DJPOWER`}
                    onClick={() => {
                      setKeyDjPower(!keyDjPower)
                      setKeyPattern(String('ALL'))
                      setBaseSongData([])
                      setIsLoading(true)
                    }}
                    className={
                      'tw:flex tw:items-center tw:justify-center tw:relative tw:h-12 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-sm ' +
                      (keyDjPower
                        ? 'tw:brightness-150 tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20'
                        : 'tw:border-slate-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100')
                    }
                    disabled={isLoading}
                  >
                    <div
                      className={
                        `tw:absolute tw:w-full tw:h-full tw:opacity-30 respect_bg_b` +
                        String('DJPOWER')
                      }
                    />
                    <div className='tw:relative tw:flex tw:flex-col tw:items-center tw:gap-0.5 tw:leading-none'>
                      <span className='tw:text-xs tw:font-extrabold tw:text-slate-900 tw:dark:text-white'>
                        DJ POWER
                      </span>
                      {/* <span className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-300'>
                        {keyDjPower ? 'ON' : 'OFF'}
                      </span> */}
                    </div>
                  </button>
                  {globalDictionary.gameDictionary[selectedGame].keyModeList.map((value) => (
                    <button
                      key={`keyModeSelector_${value}`}
                      onClick={() => {
                        setKeyMode(String(value))
                        setKeyPattern(String('SC'))
                        setBaseSongData([])
                        setIsLoading(true)
                      }}
                      className={
                        'tw:flex tw:items-center tw:justify-center tw:relative tw:h-12 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-sm ' +
                        (keyMode === String(value)
                          ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
                          : 'tw:border-slate-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100')
                      }
                      disabled={isLoading || keyMode === String(value)}
                    >
                      <div
                        className={
                          `tw:absolute tw:w-full tw:h-full tw:opacity-30 respect_bg_b` +
                          String(value)
                        }
                      />
                      <div className='tw:relative tw:flex tw:flex-col tw:items-center tw:gap-1'>
                        <span className='tw:text-lg tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                          {String(value)}B
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className='tw:h-full tw:w-[1px] tw:bg-slate-300 tw:dark:bg-slate-700' />

                {/* 패턴/레벨 선택 */}
                <div className='tw:flex tw:gap-2 tw:flex-1'>
                  {['ALL', 'SC', '15', '14', '13', '12'].map((value) => (
                    <button
                      key={`keyModeSelector_${value}`}
                      onClick={() => {
                        setKeyPattern(String(value))
                      }}
                      className={
                        'tw:flex tw:flex-1 tw:items-center tw:justify-center tw:relative tw:h-12 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-sm ' +
                        (keyPattern === String(value)
                          ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
                          : 'tw:border-slate-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100') +
                        (keyDjPower && !isNaN(Number(String(value)))
                          ? ' tw:opacity-0 tw:hidden'
                          : '')
                      }
                      disabled={
                        isLoading ||
                        keyPattern === String(value) ||
                        (keyDjPower && !isNaN(Number(String(value))))
                      }
                    >
                      <div
                        className={
                          `tw:absolute tw:w-full tw:h-full tw:opacity-30 respect_bg_b` +
                          String(value)
                        }
                      />
                      <span className='tw:text-sm tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                        {isNaN(Number(String(value))) ? String(value) : `Lv.${String(value)}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className='tw:flex tw:flex-col tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-md tw:p-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
            {baseSongData.length > 0 && !isLoading ? (
              baseSongData.map((levelData) => (
                <div
                  key={'DifficultyBody' + levelData.level}
                  className='tw:flex tw:flex-col tw:animate-fadeInLeft'
                >
                  <span className='tw:text-2xl tw:py-2 tw:mb-3 tw:w-full tw:font-bold tw:text-slate-900 tw:dark:text-white tw:border-b tw:border-slate-300 tw:dark:border-slate-600 tw:border-opacity-50 me-auto'>
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
                  <div className='tw:flex tw:flex-col tw:gap-6'>
                    {levelData.floorItems.length > 0
                      ? levelData.floorItems
                          .filter((item) => item.floor)
                          .map((floorItem) => (
                            <LazyFloorItem
                              key={`floorItem_${levelData.level}_${floorItem.floor}`}
                              floorItem={floorItem}
                              levelData={levelData}
                              keyMode={keyMode}
                            />
                          ))
                      : null}
                  </div>
                </div>
              ))
            ) : (
              <div className='tw:flex tw:justify-center tw:h-[calc(100vh-400px)] tw:items-center'>
                <PuffLoader color='#6366f1' size={32} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div id='ContentFooter' />
    </React.Fragment>
  )
}

export default DmrvGradePage
