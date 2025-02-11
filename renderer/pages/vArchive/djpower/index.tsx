import * as R from 'ramda'

import React, { useEffect, useState } from 'react'

import Head from 'next/head'
import { RootState } from 'store'
import ScorePopupComponent from '@/components/score/popup/ScorePopupDjmax'
import { SyncLoader } from 'react-spinners'
import { globalDictionary } from '@constants/globalDictionary'
import { logRendererError } from '@utils/rendererLoggerUtils'
import { useSelector } from 'react-redux'

export default function VArchiveDjPowerPage() {
  const [keyMode, setKeyMode] = useState<string>('4')
  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [newSongData, setNewSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)
  const [isScoredNewSongData, setIsScoredNewSongData] = useState<boolean>(true)

  const { songData, userData, vArchiveUserData } = useSelector((state: RootState) => state.app)

  useEffect(() => {
    setBaseSongData([])
    setNewSongData([])
    if (songData.length > 0) {
      // SC 레벨과 MX 레벨을 동일하게 취급하는 함수
      const adjustLevels = (item: any) => {
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
        obj: any,
      ) => number | undefined

      // dlcCode가 FAL, VL, CP인 항목과 name이 Kamui, BlueWhite인 항목을 필터링
      const filterExcludedItems = R.filter(
        R.pipe((item: any) => {
          const dlcCode = R.path(['dlcCode'], item)
          const name = R.path(['name'], item)
          return (
            !['VL2', 'TEK'].includes(dlcCode) &&
            !['Diomedes ~Extended Mix~', 'Kill Trap'].includes(name)
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
      const getSpecialItems = (data: any[], maxItems: number) => {
        const specialItems = R.filter(
          R.pipe((item: any) => {
            const dlcCode = R.path(['dlcCode'], item)
            const name = R.path(['name'], item)
            // return (['FAL', 'VL', 'CP', 'TEK'].includes(dlcCode) || ['Kamui', 'BlueWhite'].includes(name)) && !['From Hell to Breakfast', 'SURVIVOR'].includes(name)
            return (
              ['VL2', 'TEK'].includes(dlcCode) ||
              ['Diomedes ~Extended Mix~', 'Kill Trap'].includes(name)
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
      const getFilteredData = (data: any[], maxItems: number) => {
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
      const filteredData = getFilteredData(songData, 70)
      setBaseSongData(filteredData)

      const specialData = getSpecialItems(songData, 30)
      setNewSongData(specialData)

      if (vArchiveUserData.userName !== '') {
        setIsScoredBaseSongData(false)
        setIsScoredNewSongData(false)
      }

      setIsLoading(false)
    }
  }, [songData, keyMode])

  const loadDataWithScore = async (title) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/title/${title}`,
      )
      if (!response) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      return data
    } catch (error) {
      logRendererError(error, { message: 'Error in loadDataWithScore', ...userData })
      console.error('There has been a problem with your fetch operation:', error)
      return null
    }
  }

  // 스코어 갱신
  useEffect(() => {
    if (baseSongData.length > 0 && !isScoredBaseSongData) {
      const updateArrayWithAPIData = async () => {
        const updatedArray = await Promise.all(
          baseSongData.map(async (item) => {
            const data = await loadDataWithScore(item.title)

            console.log(data)
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
          .then((value) => setBaseSongData(value))
          .finally(() => {
            setIsScoredBaseSongData(true)
          })
      }

      updateArrayWithAPIData()
    }
  }, [baseSongData, isScoredBaseSongData])

  useEffect(() => {
    if (newSongData.length > 0 && !isScoredNewSongData) {
      const updateArrayWithAPIData = async () => {
        const updatedArray = await Promise.all(
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
          .then((value) => setNewSongData(value))
          .finally(() => {
            setIsScoredNewSongData(true)
          })
      }

      updateArrayWithAPIData()
    }
  }, [newSongData, isScoredNewSongData])

  const { selectedGame } = useSelector((state: RootState) => state.app)

  return (
    <React.Fragment>
      <Head>
        <title>{keyMode}B MAX DJ POWER - RACLA</title>
      </Head>

      <div id='ContentHeader' />
      {/* 상단 설명 섹션 */}
      <div className='tw-flex tw-gap-4'>
        {/* 메인 설명 섹션 */}
        <div className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-4 tw-flex-1'>
          {/* 헤더 */}
          <div className='tw-flex tw-w-full tw-items-end tw-justify-between'>
            <span className='tw-text-xl tw-font-bold tw-text-white'>🙋‍♂️ MAX DJ POWER</span>
            <div className='tw-flex tw-items-center tw-gap-2'>
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
                    className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b${mode}`}
                  />
                  <span className='tw-relative tw-text-base tw-font-bold'>{mode}B</span>
                </button>
              ))}
            </div>
          </div>

          {/* 설명 내용 */}
          <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2 tw-mb-auto'>
            <p className='tw-leading-relaxed'>
              전 패턴을 퍼펙트 플레이를 하면 DJ CLASS 만점(이론치)을 달성할 수 있는 리스트입니다.
            </p>
            <p className='tw-leading-relaxed'>
              DJ CLASS 최상위 랭커를 노린다면 최소 BASIC 70패턴, NEW 30패턴을 플레이 해야합니다.
            </p>
          </div>
        </div>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md p-4'>
        {songData.length > 0 && !isLoading && isScoredBaseSongData && isScoredNewSongData ? (
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
          ].map((levelValue, index) => (
            <div
              key={'DifficultyBody' + levelValue}
              className='tw-flex tw-flex-col tw-animate-fadeInLeft'
            >
              <span className='tw-text-2xl tw-py-2 tw-mb-3 tw-w-full tw-font-bold tw-border-b tw-border-gray-600 tw-border-opacity-50 me-auto'>
                SC{' '}
                {Number(levelValue) == 8
                  ? String(levelValue) + ' + MX 15'
                  : Number(levelValue) == 6
                    ? String(levelValue) + ' + MX 14'
                    : String(levelValue)}
              </span>
              <div className='tw-flex'>
                {[baseSongData, newSongData].map((songDataPack, songDataPackIndex) =>
                  songDataPack.length > 0 ? (
                    <div
                      key={'songDataPack' + songDataPackIndex}
                      className={
                        `tw-flex tw-flex-wrap tw-gap-3 tw-content-start` +
                        (songDataPackIndex == 0 ? ' tw-w-8/12' : ' tw-w-4/12')
                      }
                      style={{ flex: '0 0 auto' }}
                    >
                      {songDataPack
                        .filter(
                          (songItem) =>
                            !isLoading &&
                            songItem.patterns[`${keyMode}B`].SC !== undefined &&
                            String(songItem.patterns[`${keyMode}B`].SC.level).startsWith(
                              String(levelValue),
                            ),
                        )
                        .map((songItem, songItemIndex) => (
                          <div
                            key={`pattern_${songItem.title}_${songItem.patterns[`${keyMode}B`].SC.level}`}
                            className='tw-transition-opacity tw-duration-300 tw-w-60 tw-max-w-60 tw-flex tw-flex-col tw-flex-grow-0 tw-shrink-0 tw-bg-gray-700 tw-rounded-md tw-bg-opacity-50 tw-gap-2 tw-p-2'
                          >
                            <div className='tw-flex tw-gap-2'>
                              <ScorePopupComponent
                                songItem={songItem}
                                keyMode={keyMode}
                                songDataPackIndex={songDataPackIndex}
                                isVisibleCode={true}
                                isFlatten={true}
                              />
                              <div className='tw-flex tw-flex-1 tw-flex-col tw-gap-2 tw-items-end tw-justify-center tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-md tw-py-2 tw-px-3'>
                                {songItem.patterns[`${keyMode}B`].SC?.score ||
                                songItem.patterns[`${keyMode}B`].MX?.score ? (
                                  <>
                                    <span className='tw-text-xs tw-text-gray-400'>
                                      SCORE :{' '}
                                      {String(songItem.patterns[`${keyMode}B`].SC.level).includes(
                                        '.5',
                                      )
                                        ? songItem.patterns[`${keyMode}B`].MX.score || '0'
                                        : songItem.patterns[`${keyMode}B`].SC.score || '0'}
                                      %
                                    </span>
                                    <span className='tw-text-xs tw-text-gray-400'>
                                      TP :{' '}
                                      {String(songItem.patterns[`${keyMode}B`].SC.level).includes(
                                        '.5',
                                      )
                                        ? songItem.patterns[`${keyMode}B`].MX.rating || '0'
                                        : songItem.patterns[`${keyMode}B`].SC.rating || '0'}
                                    </span>
                                  </>
                                ) : (
                                  <span className='tw-text-xs tw-text-gray-400'>기록 미존재</span>
                                )}
                              </div>
                            </div>
                            <span className='tw-flex tw-bg-gray-500 tw-bg-opacity-25 tw-px-2 tw-py-1 tw-rounded-md tw-break-keep tw-justify-center tw-items-center tw-text-center tw-text-xs'>
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
          <div className='tw-flex tw-justify-center tw-h-[calc(100vh-388px)] tw-items-center'>
            <SyncLoader color='#ffffff' size={8} />
          </div>
        )}
      </div>
      <div id='ContentFooter' />
    </React.Fragment>
  )
}
