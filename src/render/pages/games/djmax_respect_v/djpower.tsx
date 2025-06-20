import ScorePopupComponent from '@render/components/score/ScorePopup'
import { globalDictionary } from '@render/constants/globalDictionary'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import * as R from 'ramda'
import apiClient from '../../../../libs/apiClient'

import { SongData } from '@src/types/games/SongData'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { PuffLoader } from 'react-spinners'

const DmrvDjpowerPage = () => {
  const { t } = useTranslation(['grade'])
  const [keyMode, setKeyMode] = useState<string>('4')
  const { language } = useSelector((state: RootState) => state.app.settingData)
  const [baseSongData, setBaseSongData] = useState<SongData[]>([])
  const [newSongData, setNewSongData] = useState<SongData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)
  const [isScoredNewSongData, setIsScoredNewSongData] = useState<boolean>(true)

  const { songData, userData, selectedGame } = useSelector((state: RootState) => state.app)

  useEffect(() => {
    setBaseSongData([])
    setNewSongData([])
    if (songData[selectedGame].length > 0) {
      // SC 레벨과 MX 레벨을 동일하게 취급하는 함수
      const adjustLevels = (item: SongData) => {
        const scLevel = R.path(['patterns', `${keyMode}B`, 'SC', 'level'], item)
        const mxLevel = R.path(['patterns', `${keyMode}B`, 'MX', 'level'], item)

        let adjustedItems = [item]

        // MX 레벨에 따라 SC 레벨 재매핑
        if (mxLevel === 14 && (!scLevel || scLevel > 6)) {
          const adjustedItem = R.assocPath(['patterns', `${keyMode}B`, 'SC', 'level'], 6.5, item)
          adjustedItems.push(adjustedItem)
        }
        if (mxLevel === 15 && (!scLevel || scLevel > 8)) {
          const adjustedItem = R.assocPath(['patterns', `${keyMode}B`, 'SC', 'level'], 8.5, item)
          adjustedItems.push(adjustedItem)
        }

        return adjustedItems
      }

      // SC 레벨을 추출하는 함수
      const getSCLevel = R.path(['patterns', `${keyMode}B`, 'SC', 'level']) as (
        obj: SongData,
      ) => number | undefined

      // dlcCode가 FAL, VL, CP인 항목과 name이 Kamui, BlueWhite인 항목을 필터링
      const filterExcludedItems = R.filter(
        R.pipe((item: SongData) => {
          const dlcCode = R.path(['dlcCode'], item)
          const name = R.path(['name'], item)
          return (
            !['VL3', 'PLI1', 'BA'].includes(dlcCode) &&
            !['Diomedes ~Extended Mix~', 'Kill Trap', 'alliance', 'Phoenix Virus'].includes(name)
            // (!['FAL', 'VL', 'CP', 'TEK'].includes(dlcCode) && !['Kamui', 'BlueWhite'].includes(name))
          )
        }),
      )

      // 대소문자 구분 없이 오름차순으로 정렬하고 한글이 먼저 오도록 하는 함수
      const sortByName = R.ascend(
        R.pipe(R.path(['name']), (name: string) => {
          // 문자열을 정규화
          const normalized = name.normalize('NFC').toLowerCase()

          // 한글이 앞에 오도록 하기 위한 처리
          return /^[\uac00-\ud7a3]/.test(normalized) ? `0${normalized}` : `1${normalized}`
        }),
      )

      // SC 레벨과 name을 기준으로 정렬
      const sortByLevelsAndName = R.sortWith([
        R.descend(R.pipe(getSCLevel, R.defaultTo(0))), // SC 레벨을 내림차순으로 정렬
        sortByName, // name을 대소문자 구분 없이 오름차순으로 정렬하고 한글이 먼저 오도록
      ])

      // dlcCode가 FAL, VL, CP인 경우와 name이 Kamui, BlueWhite인 경우를 별도로 처리
      const getSpecialItems = (data: SongData[], maxItems: number) => {
        const specialItems = R.filter(
          R.pipe((item: SongData) => {
            const dlcCode = R.path(['dlcCode'], item)
            const name = R.path(['name'], item)
            // return (['FAL', 'VL', 'CP', 'TEK'].includes(dlcCode) || ['Kamui', 'BlueWhite'].includes(name)) && !['From Hell to Breakfast', 'SURVIVOR'].includes(name)
            return (
              ['VL3', 'PLI1', 'BA'].includes(dlcCode) ||
              ['Diomedes ~Extended Mix~', 'Kill Trap', 'alliance', 'Phoenix Virus'].includes(name)
            )
          }),
          data,
        )

        // 필터링 및 정렬
        const sortedSpecialItems = R.pipe(
          R.chain(adjustLevels), // SC와 MX 레벨을 조정
          R.filter(
            R.pipe(
              getSCLevel,
              (scLevel) => scLevel !== undefined && scLevel >= 0 && scLevel <= 15, // SC 레벨이 15부터 0까지인 항목 필터링
            ),
          ),
          sortByLevelsAndName, // SC 레벨 및 name에 따라 정렬
        )(specialItems)

        // 30개까지 선택
        const topItems = R.take(maxItems, sortedSpecialItems)

        // SC 레벨이 동일하거나 높은 모든 항목 포함
        const lastItem = R.last(topItems)
        if (!lastItem) return topItems // 데이터가 비어 있는 경우

        const lastSCLevel = getSCLevel(lastItem)
        if (lastSCLevel === undefined) return topItems // SC 레벨이 없는 경우

        const finalItems = R.filter(
          R.pipe(
            getSCLevel,
            (scLevel) => scLevel !== undefined && scLevel >= lastSCLevel, // SC 레벨이 마지막 항목의 SC 레벨 이상인 항목 포함
          ),
          sortedSpecialItems,
        )

        return finalItems
      }

      // SC 레벨이 특정 값까지의 항목을 포함하는 함수
      const getFilteredData = (data: SongData[], maxItems: number) => {
        // 필터링 및 정렬
        const sortedData = R.pipe(
          filterExcludedItems, // dlcCode와 name에 따라 필터링
          R.chain(adjustLevels), // SC와 MX 레벨을 조정
          R.filter(
            R.pipe(
              getSCLevel,
              (scLevel) => scLevel !== undefined && scLevel >= 0 && scLevel <= 15, // SC 레벨이 15부터 0까지인 항목 필터링
            ),
          ),
          sortByLevelsAndName, // SC 레벨 및 name에 따라 정렬
        )(data)

        // 70개까지 선택
        const topItems = R.take(maxItems, sortedData)

        // SC 레벨이 동일하거나 높은 모든 항목 포함
        const lastItem = R.last(topItems)
        if (!lastItem) return topItems // 데이터가 비어 있는 경우

        const lastSCLevel = getSCLevel(lastItem)
        if (lastSCLevel === undefined) return topItems // SC 레벨이 없는 경우

        const finalItems = R.filter(
          R.pipe(
            getSCLevel,
            (scLevel) => scLevel !== undefined && scLevel >= lastSCLevel, // SC 레벨이 마지막 항목의 SC 레벨 이상인 항목 포함
          ),
          sortedData,
        )

        return finalItems
      }

      // 필터링된 결과
      const filteredData = getFilteredData(songData[selectedGame], 70)
      setBaseSongData(filteredData)

      const specialData = getSpecialItems(songData[selectedGame], 30)
      setNewSongData(specialData)

      if (userData.varchiveUserInfo.nickname !== '') {
        setIsScoredBaseSongData(false)
        setIsScoredNewSongData(false)
      }

      setIsLoading(false)
    }
  }, [keyMode])

  const loadDataWithScore = async (title) => {
    try {
      const response = await apiClient.getProxy<SongData>(
        `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/title/${title}`,
      )
      return response.data.data
    } catch (error) {
      createLog('error', 'Error in loadDataWithScore', { ...userData })
      return null
    }
  }

  // 스코어 갱신
  useEffect(() => {
    if (baseSongData.length > 0 && !isScoredBaseSongData) {
      const updateArrayWithAPIData = async () => {
        await Promise.all(
          baseSongData.map(async (item) => {
            const data = await loadDataWithScore(item.title)

            // 기존 아이템의 레벨 정보는 유지하면서 스코어 데이터만 병합
            return {
              ...item,
              patterns: {
                ...item.patterns,
                [`${keyMode}B`]: {
                  ...item.patterns[`${keyMode}B`],
                  SC: {
                    ...item.patterns[`${keyMode}B`].SC,
                    score: data?.patterns?.[`${keyMode}B`]?.SC?.score,
                    rating: data?.patterns?.[`${keyMode}B`]?.SC?.rating,
                  },
                  MX: {
                    ...item.patterns[`${keyMode}B`].MX,
                    score: data?.patterns?.[`${keyMode}B`]?.MX?.score,
                    rating: data?.patterns?.[`${keyMode}B`]?.MX?.rating,
                  },
                },
              },
            }
          }),
        )
          .then((value) => {
            setBaseSongData(value)
          })
          .finally(() => {
            setIsScoredBaseSongData(true)
          })
      }

      void updateArrayWithAPIData()
    }
  }, [baseSongData, isScoredBaseSongData])

  useEffect(() => {
    if (newSongData.length > 0 && !isScoredNewSongData) {
      const updateArrayWithAPIData = async () => {
        await Promise.all(
          newSongData.map(async (item) => {
            const data = await loadDataWithScore(item.title)

            // 기존 아이템의 레벨 정보는 유지하면서 스코어 데이터만 병합
            return {
              ...item,
              patterns: {
                ...item.patterns,
                [`${keyMode}B`]: {
                  ...item.patterns[`${keyMode}B`],
                  SC: {
                    ...item.patterns[`${keyMode}B`].SC,
                    score: data?.patterns?.[`${keyMode}B`]?.SC?.score,
                    rating: data?.patterns?.[`${keyMode}B`]?.SC?.rating,
                    maxCombo: data?.patterns?.[`${keyMode}B`]?.SC?.maxCombo,
                  },
                  MX: {
                    ...item.patterns[`${keyMode}B`].MX,
                    score: data?.patterns?.[`${keyMode}B`]?.MX?.score,
                    rating: data?.patterns?.[`${keyMode}B`]?.MX?.rating,
                    maxCombo: data?.patterns?.[`${keyMode}B`]?.MX?.maxCombo,
                  },
                },
              },
            }
          }),
        )
          .then((value) => {
            setNewSongData(value)
          })
          .finally(() => {
            setIsScoredNewSongData(true)
          })
      }

      void updateArrayWithAPIData()
    }
  }, [newSongData, isScoredNewSongData])

  return (
    <React.Fragment>
      <div id='ContentHeader' />
      {/* 상단 설명 섹션 */}
      <div className='tw:flex tw:gap-4'>
        {/* 메인 설명 섹션 */}
        <div className='tw:flex tw:flex-col tw:gap-4 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-6 tw:mb-4 tw:flex-1 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
          {/* 헤더 */}
          <div className='tw:flex tw:w-full tw:items-end tw:justify-between'>
            <span className='tw:text-xl tw:font-bold tw:text-slate-900 tw:dark:text-white'>
              MAX DJ POWER
            </span>
            <div className='tw:flex tw:items-center tw:gap-2'>
              {globalDictionary.gameDictionary[selectedGame].keyModeList.map((mode) => (
                <button
                  key={`mode_${mode}`}
                  onClick={() => {
                    setKeyMode(String(mode))
                  }}
                  className={`tw:flex tw:items-center tw:justify-center tw:relative tw:px-4 tw:py-0.5 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-md tw:flex-1 ${
                    String(mode) === keyMode
                      ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
                      : 'tw:border-slate-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100'
                  }`}
                >
                  <div
                    className={`tw:absolute tw:w-full tw:h-full tw:opacity-30 respect_bg_b${mode}`}
                  />
                  <span className='tw:relative tw:text-base tw:font-bold'>{mode}B</span>
                </button>
              ))}
            </div>
          </div>

          {/* 설명 내용 */}
          <div className='tw:bg-slate-100 tw:dark:bg-slate-700/50 tw:p-4 tw:rounded tw:space-y-2 tw:text-sm tw:mb-auto'>
            <p className='tw:leading-relaxed tw:text-slate-700 tw:dark:text-slate-300'>
              {t('djpowerDescription1')}
            </p>
            <p className='tw:leading-relaxed tw:text-slate-700 tw:dark:text-slate-300'>
              {t('djpowerDescription2')}
            </p>
          </div>
        </div>
      </div>

      <div className='tw:flex tw:flex-col tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-md tw:p-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
        {songData[selectedGame].length > 0 &&
        !isLoading &&
        isScoredBaseSongData &&
        isScoredNewSongData ? (
          [
            ...new Set(
              [
                ...new Set(
                  R.map(R.path(['patterns', `${keyMode}B`, 'SC', 'level']))([
                    ...baseSongData,
                    ...newSongData,
                  ]),
                ),
              ].map((levelValue) =>
                String(levelValue).includes('.5')
                  ? String(levelValue).replace('.5', '')
                  : String(levelValue),
              ),
            ),
          ].map((levelValue) => (
            <div
              key={'DifficultyBody' + levelValue}
              className='tw:flex tw:flex-col tw:animate-fadeInLeft'
            >
              <span className='tw:text-2xl tw:py-2 tw:mb-3 tw:w-full tw:font-bold tw:text-slate-900 tw:dark:text-white tw:border-b tw:border-slate-300 tw:dark:border-slate-600 tw:border-opacity-50 me-auto'>
                SC{' '}
                {Number(levelValue) == 8
                  ? String(levelValue) + ' + MX 15'
                  : Number(levelValue) == 6
                    ? String(levelValue) + ' + MX 14'
                    : String(levelValue)}
              </span>
              <div className='tw:flex'>
                {[baseSongData, newSongData].map((songDataPack, songDataPackIndex) =>
                  songDataPack.length > 0 ? (
                    <div
                      key={'songDataPack' + songDataPackIndex}
                      className={
                        `tw:flex tw:flex-wrap tw:gap-3 tw:content-start` +
                        (songDataPackIndex == 0 ? ' tw:w-8/12' : ' tw:w-4/12')
                      }
                      style={{ flex: '0 0 auto' }}
                    >
                      {songDataPack
                        .filter(
                          (songItem) =>
                            songItem.patterns[`${keyMode}B`].SC !== undefined &&
                            String(songItem.patterns[`${keyMode}B`].SC.level).startsWith(
                              String(levelValue),
                            ),
                        )
                        .map((songItem) => (
                          <div
                            key={`pattern_${songItem.title}_${songItem.patterns[`${keyMode}B`].SC.level}`}
                            className='tw:transition-opacity tw:duration-300 tw:w-60 tw:max-w-60 tw:flex tw:flex-col tw:flex-grow-0 tw:shrink-0 tw:bg-slate-100 tw:dark:bg-slate-700/50 tw:rounded-md tw:bg-opacity-50 tw:gap-2 tw:p-2'
                          >
                            <div className='tw:flex tw:gap-2'>
                              <ScorePopupComponent
                                songTitle={songItem.title}
                                keyMode={keyMode}
                                isVisibleCode={true}
                              />
                              <div className='tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:items-end tw:justify-center tw:bg-slate-200 tw:dark:bg-slate-700 tw:bg-opacity-25 tw:rounded-md tw:py-2 tw:px-3'>
                                {(songItem.patterns[`${keyMode}B`].SC?.score &&
                                  parseFloat(songItem.patterns[`${keyMode}B`].SC?.score) > 0) ||
                                (songItem.patterns[`${keyMode}B`].MX?.score &&
                                  parseFloat(songItem.patterns[`${keyMode}B`].MX?.score) > 0) ? (
                                  <>
                                    <span>
                                      {String(songItem.patterns[`${keyMode}B`].SC.level).includes(
                                        '.5',
                                      ) ? (
                                        songItem.patterns[`${keyMode}B`].MX.score &&
                                        parseFloat(songItem.patterns[`${keyMode}B`].MX.score) >
                                          0 ? (
                                          <span
                                            className={`tw:text-xs tw:font-extrabold ${
                                              songItem.patterns[`${keyMode}B`].MX.maxCombo
                                                ? 'tw:text-indigo-500 tw:dark:text-yellow-500'
                                                : 'tw:text-slate-700 tw:dark:text-slate-200'
                                            }`}
                                          >
                                            <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200 tw:font-normal'>
                                              SCORE :
                                            </span>{' '}
                                            {songItem.patterns[`${keyMode}B`].MX.score}%
                                          </span>
                                        ) : (
                                          <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                            {t('noRecord')}
                                          </span>
                                        )
                                      ) : songItem.patterns[`${keyMode}B`].SC.score &&
                                        parseFloat(songItem.patterns[`${keyMode}B`].SC.score) >
                                          0 ? (
                                        <span
                                          className={`tw:text-xs tw:font-extrabold ${
                                            songItem.patterns[`${keyMode}B`].SC.maxCombo
                                              ? 'tw:text-indigo-500 tw:dark:text-yellow-500'
                                              : 'tw:text-slate-700 tw:dark:text-slate-200'
                                          }`}
                                        >
                                          <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200 tw:font-normal'>
                                            SCORE :
                                          </span>{' '}
                                          {songItem.patterns[`${keyMode}B`].SC.score}%
                                        </span>
                                      ) : (
                                        <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                          {t('noRecord')}
                                        </span>
                                      )}
                                    </span>

                                    {String(songItem.patterns[`${keyMode}B`].SC.level).includes(
                                      '.5',
                                    ) ? (
                                      songItem.patterns[`${keyMode}B`].MX.rating ? (
                                        <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200'>
                                          TP : {songItem.patterns[`${keyMode}B`].MX.rating}
                                        </span>
                                      ) : null
                                    ) : songItem.patterns[`${keyMode}B`].SC.rating ? (
                                      <span className='tw:text-xs tw:text-slate-700 tw:dark:text-slate-200'>
                                        TP : {songItem.patterns[`${keyMode}B`].SC.rating}
                                      </span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400'>
                                    {t('noRecord')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`tw:flex tw:bg-slate-200 tw:dark:bg-slate-700 tw:bg-opacity-25 tw:px-2 tw:py-1 tw:rounded-md ${
                                language !== 'ja_JP' ? 'tw:break-keep' : ''
                              } tw:justify-center tw:items-center tw:text-center tw:text-xs tw:text-slate-700 tw:dark:text-slate-300`}
                            >
                              {songItem.name}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          ))
        ) : (
          <div className='tw:flex tw:justify-center tw:h-[calc(100vh-338px)] tw:items-center'>
            <PuffLoader color='#6366f1' size={32} />
          </div>
        )}
      </div>
      <div id='ContentFooter' />
    </React.Fragment>
  )
}

export default DmrvDjpowerPage
