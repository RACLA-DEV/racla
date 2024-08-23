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
import { v4 as uuidv4 } from 'uuid'

import 'moment/locale/ko'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useParams } from 'next/navigation'

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

export default function VArchiveDbPage({ fontFamily, userData, songData, addNotificationCallback, setBackgroundBgaName }) {
  const router = useRouter()
  const params = useParams()

  const [keyMode, setKeyMode] = useState<string>('4')
  const [keyPattern, setKeyPattern] = useState<string>('ALL')
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

  const descendWithNull = R.descend((SongItem: SongItem) => (SongItem.floor === null ? -Infinity : SongItem.floor))
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
        (songItem) => songItem.pattern === 'SC' || (pattern === 'ALL' && ['NM', 'HD', 'MX'].includes(songItem.pattern) && songItem.level >= 12),
      )

      return [...new Set([...sortedData.map((songItem) => songItem.level)])].map((level) => {
        const sortedDataWithLevel = sortedData.filter((songItem: SongItem) =>
          pattern === 'ALL'
            ? ![2, 4, 6, 8].includes(level)
              ? songItem.level === level && songItem.pattern === 'SC'
              : (songItem.level === level && songItem.pattern === 'SC') ||
                (['NM', 'HD', 'MX'].includes(songItem.pattern) && songItem.level === LevelDictionary[`level${level}`])
            : songItem.level === level && songItem.pattern === 'SC',
        )

        return {
          level,
          floorItems: [...new Set([...sortedDataWithLevel.map((songItem) => songItem.floor)])].map((floor) => {
            return {
              floor,
              songItems: sortByName(sortedDataWithLevel.filter((songItem) => songItem.floor === floor)),
            }
          }),
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
                        .filter((songItem) => (keyPattern == 'ALL' ? true : songItem.level === Number(keyPattern) && songItem.pattern !== 'SC'))
                        .map((item) => item.floor),
                    ]),
                  ].map((floor) => {
                    return {
                      floor,
                      songItems: sortByName(
                        processedData
                          .filter((songItem) => (keyPattern == 'ALL' ? true : songItem.level === Number(keyPattern) && songItem.pattern !== 'SC'))
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
                      songItems: sortByName(processedData.filter((songItem) => songItem.pattern === 'SC').filter((songItem) => songItem.floor === floor)),
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
        setBackgroundBgaName(String(hoveredTitle))
      }, 500)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [hoveredTitle])

  return (
    <React.Fragment>
      <Head>
        <title>
          DJMAX RESPECT V 서열표 {String(keyMode) !== 'DJPOWER' ? String(keyMode) + 'B' : 'DJ POWER'}{' '}
          {isNaN(Number(String(keyPattern))) ? String(keyPattern) : `Lv.${String(keyPattern)}`} - 프로젝트 RA
        </title>
      </Head>
      <div className="tw-flex tw-gap-4">
        {/* 곡 데이터 */}
        <div className="tw-flex tw-flex-col tw-w-full tw-relative">
          <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-mb-4">
            {/* 상단 */}
            <div className="tw-flex tw-w-full">
              {/* 제목 */}
              <span className="tw-text-lg tw-font-bold me-auto">서열표</span>
              {/* keyMode 선택 */}
              <div className="tw-flex tw-flex-col gap-2 tw-items-end" style={{ width: '520px' }}>
                <div className="tw-flex tw-gap-2 tw-w-full">
                  <button
                    key={`keyModeSelector_DJPOWER`}
                    onClick={() => {
                      setKeyDjPower(!keyDjPower)
                      setKeyPattern(String('ALL'))
                      setBaseSongData([])
                      setIsLoading(true)
                    }}
                    className={
                      'tw-flex tw-items-center tw-justify-center tw-relative tw-px-6 tw-py-3 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-border-gray-600 tw-rounded-sm flex-equal ' +
                      (keyDjPower ? ' tw-brightness-200 tw-bg-gray-700 tw-bg-opacity-50' : '')
                    }
                    disabled={isLoading}
                  >
                    <div className={`tw-absolute tw-w-full tw-h-full respect_bg_b` + String('DJPOWER')} />
                    <span className="tw-absolute tw-text-lg tw-font-bold">DJ POWER {keyDjPower ? 'ON' : 'OFF'}</span>
                  </button>
                  {globalDictionary.respect.keyModeList.map((value) => (
                    <button
                      key={`keyModeSelector_${value}`}
                      onClick={() => {
                        setKeyMode(String(value))
                        setKeyPattern(String('ALL'))
                        setBaseSongData([])
                        setIsLoading(true)
                      }}
                      className={
                        'tw-flex tw-items-center tw-justify-center tw-relative tw-px-6 tw-py-3 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-border-gray-600 tw-rounded-sm tw-w-20 ' +
                        (keyMode === String(value) ? ' tw-brightness-200' : '')
                      }
                      disabled={isLoading || keyMode === String(value)}
                    >
                      <div className={`tw-absolute tw-w-full tw-h-full respect_bg_b` + String(value)} />
                      <span className="tw-absolute tw-text-lg tw-font-bold">{String(value)}B</span>
                    </button>
                  ))}
                </div>
                <div className="tw-flex tw-gap-2 tw-w-full tw-justify-start">
                  {['ALL', 'SC', '15', '14', '13', '12'].map((value) => (
                    <button
                      key={`keyModeSelector_${value}`}
                      onClick={() => {
                        setKeyPattern(String(value))
                      }}
                      className={
                        'tw-flex tw-items-center tw-justify-center tw-relative tw-px-6 tw-py-3 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-border-gray-600 tw-rounded-sm tw-w-20' +
                        (keyPattern === String(value) ? ' tw-brightness-200 tw-bg-gray-700 tw-bg-opacity-50' : '') +
                        (keyDjPower && !isNaN(Number(String(value))) ? ' tw-opacity-20' : '')
                      }
                      disabled={isLoading || keyPattern === String(value) || (keyDjPower && !isNaN(Number(String(value))))}
                    >
                      <div className={`tw-absolute tw-w-full tw-h-full respect_bg_b` + String(value)} />
                      <span className="tw-absolute tw-text-lg tw-font-bold">{isNaN(Number(String(value))) ? String(value) : `Lv.${String(value)}`}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 내용 */}
            <span className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold tw-mt-4">
              <FaCircleInfo />
              <div className="tw-flex tw-flex-col">
                <span>수록곡 데이터가 많은 관계로 마우스 커서를 수록곡(자켓) 이미지에 올려둔 경우에만 성과 기록이 제공됩니다.</span>
                <span>V-ARCHIVE의 수록곡 난이도 비교(일반, 티어)는 마이너 업데이트를 통해 제공될 예정입니다.</span>
              </div>
            </span>
          </div>

          <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4">
            {baseSongData.length > 0 && !isLoading ? (
              baseSongData.map((levelData) => (
                <div key={'DifficultyBody' + levelData.level} className="tw-flex tw-flex-col tw-animate-fadeInLeft">
                  <span className="tw-text-2xl tw-py-1 tw-mb-3 tw-w-full tw-font-bold me-auto tw-border-b tw-border-gray-600 tw-border-opacity-50">
                    {baseSongData.length === 1
                      ? (String(keyMode) !== 'DJPOWER' ? String(keyMode) + 'B' : 'DJ POWER') +
                        ' ' +
                        (isNaN(Number(String(keyPattern))) ? String(keyPattern) : `Lv.${String(keyPattern)}`)
                      : 'SC ' +
                        levelData.level +
                        ([2, 4, 6, 8].includes(levelData.level) && keyPattern === 'ALL' ? ` + Lv.${LevelDictionary[`level${levelData.level}`]}` : '')}
                  </span>
                  <div className="tw-flex tw-flex-col tw-gap-6">
                    {levelData.floorItems
                      ? levelData.floorItems.map((floorItem) => (
                          <div key={'FloorItemsPack' + levelData.level + '_' + String(floorItem.floor).replace('.', '_')} className="tw-flex tw-gap-3">
                            <span className="tw-font-bold tw-text-base">{floorItem.floor}</span>
                            <div className="tw-flex tw-flex-wrap">
                              {floorItem.songItems.map((songItem) => (
                                <OverlayTrigger
                                  key={`baseSongDataPack${levelData.level}_item` + songItem.title + '_' + songItem.pattern + '_' + songItem.level}
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
                                                songItemData.patterns[`${keyMode}B`][value] !== undefined &&
                                                songItemData.patterns[`${keyMode}B`][value] !== null ? (
                                                  <div
                                                    className="tw-flex tw-flex-col tw-gap-2"
                                                    key={'baseSongDataPack_item' + songItemData.title + '_hover' + value + '_' + levelData.level}
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
                                                          className={
                                                            'tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-extrabold tw-text-white'
                                                          }
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
                                                <span className="tw-text-xs tw-font-light tw-text-gray-300">
                                                  로그인 사용자({userData.userName})의 성과 기록입니다.
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>

                                          {commentRivalName !== '' &&
                                          userData.userName !== '' &&
                                          commentRivalSongItemData &&
                                          commentRivalName !== userData.userName ? (
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
                                                        key={
                                                          'RivalBaseSongDataPack_item' +
                                                          commentRivalSongItemData.title +
                                                          '_hover' +
                                                          value +
                                                          '_' +
                                                          levelData.level +
                                                          '_' +
                                                          commentRivalName
                                                        }
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
                                              <IconContext.Provider value={{ className: 'tw-text-center tw-animate-spin' }}>
                                                <FaRotate />
                                              </IconContext.Provider>
                                            </div>
                                          </div>
                                          <div
                                            className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-items-center tw-content-center mb-1 tw-bg-gray-900 tw-bg-opacity-40"
                                            style={{ opacity: 1 }}
                                          >
                                            <div className="tw-flex flex-equal tw-items-center tw-justify-center">
                                              <IconContext.Provider value={{ className: 'tw-text-center tw-animate-spin' }}>
                                                <FaRotate />
                                              </IconContext.Provider>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Tooltip>
                                  }
                                >
                                  <div
                                    className="tw-inline-flex tw-flex-col tw-h-26 tw-w-20 tw-transition-all tw-me-3 tw-mb-3"
                                    onMouseEnter={() => {
                                      setHoveredTitle(String(songItem.title))
                                      setSongItemData(null)
                                      if (userData.userName !== '') {
                                        // setCommentRivalName()
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
                                      href={`/vArchive/db/title/${songItem.title}`}
                                      className="tw-relative tw-h-20 tw-w-20 tw-rounded-md hover-scale-110 respect_record tw-shadow-lg tw-cursor-pointer"
                                      onMouseEnter={() => setBackgroundBgaName(String(songItem.title))}
                                      onMouseLeave={() => setBackgroundBgaName('')}
                                    >
                                      <Image
                                        src={`/images/djmax_respect_v/jackets/${songItem.title}.jpg`}
                                        className="tw-absolute tw-rounded-md"
                                        height={80}
                                        width={80}
                                        alt=""
                                      />
                                      <span className="tw-absolute tw-top-0 tw-left-0 respect_dlc_code_wrap tw-rounded-tl-md">
                                        <span className={`respect_dlc_code respect_dlc_code_${songItem.dlcCode}`}>{songItem.dlcCode}</span>
                                      </span>
                                      <span className={`tw-absolute tw-right-0 tw-bottom-0 pattern tw-rounded-br-md ${songItem.pattern}`}>
                                        <span className={`tw-text-white`}>{String(songItem.pattern)}</span>
                                      </span>
                                    </Link>
                                  </div>
                                </OverlayTrigger>
                              ))}
                            </div>
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="tw-flex tw-justify-center">
                <IconContext.Provider value={{ className: 'tw-text-center tw-animate-spin' }}>
                  <FaRotate />
                </IconContext.Provider>
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
