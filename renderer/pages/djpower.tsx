import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import * as R from 'ramda'
import { FaTriangleExclamation } from 'react-icons/fa6'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { globalDictionary } from '@/libs/server/globalDictionary'

export default function DjpowerPage({ fontFamily, userData }) {
  const [keyMode, setKeyMode] = useState<string>('4')
  const [songData, setSongData] = useState<any[]>([])
  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [newSongData, setNewSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(false)
  const [isScoredNewSongData, setIsScoredNewSongData] = useState<boolean>(false)

  useEffect(() => {
    // Session.json 에 저장된 곡 불러오기
    window.ipc.getSongData().then((result: any[]) => setSongData(result))
  }, [])

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
      const getSCLevel = R.path(['patterns', `${keyMode}B`, 'SC', 'level']) as (obj: any) => number | undefined

      // dlcCode가 FAL, VL, CP인 항목과 name이 Kamui, BlueWhite인 항목을 필터링
      const filterExcludedItems = R.filter(
        R.pipe((item: any) => {
          const dlcCode = R.path(['dlcCode'], item)
          const name = R.path(['name'], item)
          return !['FAL', 'VL', 'CP'].includes(dlcCode) && !['Kamui', 'BlueWhite'].includes(name)
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
            return (['FAL', 'VL', 'CP'].includes(dlcCode) || ['Kamui', 'BlueWhite'].includes(name)) && !['From Hell to Breakfast', 'SURVIVOR'].includes(name)
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

      // dlcCode가 FAL, VL, CP이거나 name이 Kamui, BlueWhite인 경우의 결과
      const specialData = getSpecialItems(songData, 30)
      setNewSongData(specialData)

      if (userData.userName !== '') {
        setIsScoredBaseSongData(false)
        setIsScoredNewSongData(false)
      }

      setIsLoading(false)
    }
  }, [songData, keyMode])

  const loadDataWithScore = async (title) => {
    try {
      const response = await fetch(`https://cors.lunatica.kr/proxy?url=https://v-archive.net/api/archive/${userData.userName}/title/${title}`)
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

  // 스코어 갱신
  useEffect(() => {
    if (baseSongData.length > 0 && !isScoredBaseSongData) {
      const updateArrayWithAPIData = async () => {
        // 배열의 각 항목에 대해 API 호출 및 데이터 업데이트
        const updatedArray = await Promise.all(
          baseSongData.map(async (item) => {
            const data = await loadDataWithScore(item.title)
            const keysToRemove = ['SC', 'MX', 'HD', 'NM']
            const pathsToRemove = keysToRemove.map((key) => ['patterns', '4B', key, 'level'])
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
          })
      }

      updateArrayWithAPIData()
    }
  }, [baseSongData, isScoredBaseSongData])

  useEffect(() => {
    if (newSongData.length > 0 && !isScoredNewSongData) {
      const updateArrayWithAPIData = async () => {
        // 배열의 각 항목에 대해 API 호출 및 데이터 업데이트
        const updatedArray = await Promise.all(
          newSongData.map(async (item) => {
            const data = await loadDataWithScore(item.title)
            const keysToRemove = ['SC', 'MX', 'HD', 'NM']
            const pathsToRemove = keysToRemove.map((key) => ['patterns', '4B', key, 'level'])
            const removeLevels = (paths, obj) => {
              return paths.reduce((acc, path) => R.dissocPath(path, acc), obj)
            }

            const newItem = removeLevels(pathsToRemove, data)

            return R.mergeDeepRight(newItem, item)
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

  return (
    <React.Fragment>
      <Head>
        <title>DJMAX RESPECT V {keyMode}B MAX DJ POWER - 프로젝트 RA</title>
      </Head>
      <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-mb-4">
        {/* 상단 */}
        <div className="tw-flex tw-w-full">
          {/* 제목 */}
          <span className="tw-text-lg tw-font-bold me-auto">🙋‍♂️ MAX DJ POWER 란?</span>
          {/* keyMode 선택 */}
          <div className="tw-flex tw-gap-2">
            {globalDictionary.respect.keyModeList.map((value) => (
              <button
                key={`keyModeSelector_${value}`}
                onClick={() => {
                  setKeyMode(String(value))
                  setIsLoading(true)
                }}
                className={
                  'tw-flex tw-items-center tw-justify-center tw-relative tw-px-6 tw-py-3 tw-border tw-border-opacity-50 tw-border-gray-600 tw-rounded-sm' +
                  (keyMode === String(value) ? ' tw-brightness-200' : '')
                }
                disabled={keyMode === String(value) || (!isScoredBaseSongData && !isScoredNewSongData)}
              >
                <div className={`tw-absolute tw-w-full tw-h-full respect_bg_b` + String(value)} />
                <span className="tw-absolute tw-text-lg tw-font-bold">{String(value)}B</span>
              </button>
            ))}
          </div>
        </div>

        {/* 내용 */}
        <span>전 패턴을 퍼펙트플레이를 하면 DJ CLASS 만점(이론치)을 달성할 수 있는 리스트입니다.</span>
        <span>DJ CLASS 최상위 랭커를 노린다면 최소 BASIC 70패턴, NEW 30패턴을 플레이 해야합니다.</span>
        <span className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold tw-mt-4">
          <FaTriangleExclamation />
          <div className="tw-flex tw-flex-col">
            <span>
              V-ARCHIVE Open API 상 수록곡의 등록일자는 제공되지 않아 프로젝트 RA의 자체 알고리즘으로 정렬된 결과값으로 V-ARCHIVE와 일치하지 않을 수 있습니다.
            </span>
            <span>프로젝트 RA에 V-ARCHIVE 콘텐츠 컨버팅 작업이 완료된 이후 개편 예정입니다.</span>
          </div>
        </span>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4">
        {songData.length > 0 && !isLoading ? (
          [...new Set(R.map(R.path(['patterns', `${keyMode}B`, 'SC', 'level']))([...baseSongData, ...newSongData]))]
            .filter((levelValue) => !String(levelValue).includes('.5'))
            .map((levelValue, index) => (
              <div className="tw-flex tw-flex-col">
                <span className="tw-text-2xl tw-py-1 tw-mb-3 tw-w-full tw-font-bold me-auto tw-border-b tw-border-gray-600 tw-border-opacity-50">
                  SC{' '}
                  {Number(levelValue) == 8 ? String(levelValue) + ' + MX 15' : Number(levelValue) == 6 ? String(levelValue) + ' + MX 14' : String(levelValue)}
                </span>
                <div className="tw-flex">
                  {[baseSongData, newSongData].map((songDataPack, songDataPackIndex) =>
                    songDataPack.length > 0 ? (
                      <div className={`tw-flex tw-flex-wrap tw-gap-3 tw-w-${12 - (songDataPackIndex + 1) * 4}/12`}>
                        {songDataPack
                          .filter((songItem) => !isLoading && String(songItem.patterns[`${keyMode}B`].SC.level).startsWith(String(levelValue)))
                          .map((songItem, index2) => (
                            <OverlayTrigger
                              placement="auto"
                              overlay={
                                <Tooltip id="btn-nav-home" className={`tw-bg-gray-950 tw-text-xs tw-min-h-60 ${fontFamily}`}>
                                  {songItem !== null ? (
                                    <div className="tw-flex tw-flex-col tw-bg-gray-950">
                                      <div className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-mb-2 tw-mt-1 tw-bg-gray-900" style={{ opacity: 1 }}>
                                        <Image
                                          src={`https://v-archive.net/static/images/jackets/${songItem.title}.jpg`}
                                          className="tw-absolute tw-animate-fadeInLeft tw-rounded-md tw-blur tw-brightness-50 tw-bg-opacity-90"
                                          layout="fill"
                                          alt=""
                                          objectFit="cover"
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
                                        {['NM', 'HD', 'MX', 'SC'].map((value, index) =>
                                          songItem.patterns[`${keyMode}B`][value] !== undefined && songItem.patterns[`${keyMode}B`][value] !== null ? (
                                            <div className="tw-flex tw-flex-col tw-gap-2">
                                              <div className="tw-flex tw-items-center tw-gap-1">
                                                <span
                                                  className={`tw-text-respect-${value === 'SC' ? 'sc' : 'nm'}-${
                                                    (index + 1) * 5 <= 15 ? (index + 1) * 5 : 15
                                                  } tw-text-base tw-font-extrabold tw-text-left tw-z-50 text-stroke-100 tw-me-auto`}
                                                >
                                                  {globalDictionary.respect.difficulty[value].fullName}
                                                </span>
                                                <Image
                                                  src={
                                                    songItem.patterns[`${keyMode}B`][value].level <= 5
                                                      ? `/images/respect/${value === 'SC' ? 'sc' : 'nm'}_5_star.png`
                                                      : songItem.patterns[`${keyMode}B`][value].level <= 10
                                                      ? `/images/respect/${value === 'SC' ? 'sc' : 'nm'}_10_star.png`
                                                      : `/images/respect/${value === 'SC' ? 'sc' : 'nm'}_15_star.png`
                                                  }
                                                  height={14}
                                                  width={14}
                                                  alt=""
                                                />
                                                <span
                                                  className={
                                                    songItem.patterns[`${keyMode}B`][value].level <= 5
                                                      ? `tw-text-base text-stroke-100 tw-text-respect-${value === 'SC' ? 'sc' : 'nm'}-5`
                                                      : songItem.patterns[`${keyMode}B`][value].level <= 10
                                                      ? `tw-text-base text-stroke-100 tw-text-respect-${value === 'SC' ? 'sc' : 'nm'}-10`
                                                      : `tw-text-base text-stroke-100 tw-text-respect-${value === 'SC' ? 'sc' : 'nm'}-15`
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
                                              <div className="tw-relative tw-w-full tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden tw-animate-fadeInLeft">
                                                <div
                                                  className={`tw-h-6 tw-bg-respect-${value === 'SC' ? 'sc' : 'nm'}-${
                                                    (index + 1) * 5 <= 15 ? (index + 1) * 5 : 15
                                                  } tw-transition-all tw-duration-500 tw-ease-in-out`}
                                                  style={{
                                                    width: `${
                                                      songItem.patterns[`${keyMode}B`][value].score !== undefined &&
                                                      songItem.patterns[`${keyMode}B`][value].score !== null
                                                        ? songItem.patterns[`${keyMode}B`][value].score
                                                        : 0
                                                    }%`,
                                                  }}
                                                />
                                                <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-text-white tw-font-extrabold">
                                                  {songItem.patterns[`${keyMode}B`][value].score !== undefined &&
                                                  songItem.patterns[`${keyMode}B`][value].score !== null
                                                    ? `${songItem.patterns[`${keyMode}B`][value].score}%`
                                                    : '0%(기록 미존재)'}
                                                </div>
                                              </div>
                                            </div>
                                          ) : null,
                                        )}
                                      </div>
                                    </div>
                                  ) : null}
                                </Tooltip>
                              }
                            >
                              <div className="tw-flex tw-flex-col tw-h-26 tw-w-20 tw-transition-all">
                                <div className="tw-relative tw-h-20 tw-w-20 tw-rounded-md hover-scale-110 respect_record tw-shadow-lg tw-cursor-pointer">
                                  <Image
                                    src={`https://v-archive.net/static/images/jackets/${songItem.title}.jpg`}
                                    className="tw-absolute tw-animate-fadeInLeft tw-rounded-md"
                                    height={80}
                                    width={80}
                                    alt=""
                                  />
                                  <span className="tw-absolute tw-top-0 tw-left-0 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-tl-md">
                                    <span className={`respect_dlc_code respect_dlc_code_${songItem.dlcCode}`}>{songItem.dlcCode}</span>
                                  </span>
                                  <span
                                    className={`tw-absolute tw-right-0 tw-bottom-0 pattern tw-animate-fadeInLeft tw-rounded-br-md ${
                                      String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5') ? 'MX' : 'SC'
                                    }`}
                                  >
                                    <span className={`tw-text-white`}>{String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5') ? 'MX' : 'SC'}</span>
                                  </span>
                                </div>
                                {userData.userName !== '' && isScoredBaseSongData ? (
                                  <span className="mt-2 tw-w-full tw-bg-gray-950 tw-text-center tw-rounded-md tw-text-sm tw-font-bold tw-animate-fadeInDown">
                                    {String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5')
                                      ? songItem.patterns[`${keyMode}B`].MX.score
                                        ? songItem.patterns[`${keyMode}B`].MX.score
                                        : 0
                                      : songItem.patterns[`${keyMode}B`].SC.score
                                      ? songItem.patterns[`${keyMode}B`].SC.score
                                      : 0}
                                  </span>
                                ) : null}
                              </div>
                            </OverlayTrigger>
                          ))}
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            ))
        ) : (
          <span className="tw-text-center"></span>
        )}
      </div>
    </React.Fragment>
  )
}
