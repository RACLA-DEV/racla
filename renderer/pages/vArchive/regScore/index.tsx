import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import * as R from 'ramda'
import { FaCircleInfo, FaHeart, FaO, FaRegFile, FaRegHeart, FaRotate, FaTriangleExclamation, FaX } from 'react-icons/fa6'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'
import moment from 'moment'
import { randomUUID } from 'crypto'

import 'moment/locale/ko'
import axios from 'axios'
import Link from 'next/link'
import { FiCircle, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

export default function VArchiveRegScorePage({ userData, songData, addNotificationCallback, setBackgroundBgaName, uploadedData, settingData, setSettingData }) {
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)

  const [keyMode] = useState<string>('4')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [songItemData, setSongItemData] = useState<any>(null)

  const [commentRivalName, setCommentRivalName] = useState<string>('')
  const [commentRivalSongItemData, setCommentRivalSongItemData] = useState<any>(null)

  const [screenShotFile, setScreenShotFile] = useState<any>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const [isCanRollback, setIsCanRollback] = useState<boolean>(false)
  const [backupData, setBackupData] = useState<any>(null)
  const [uploadedPageData, setUploadedPageData] = useState<any>(null)

  const [isDragging, setIsDragging] = useState<boolean>(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isDragging) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (isUploading) {
      addNotificationCallback('이미 업로드가 진행 중입니다. 완료될 때까지 기다려주세요.', 'tw-bg-orange-600')
      return
    }

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.match('image.*')) {
        setScreenShotFile(file)
      } else {
        addNotificationCallback('이미지 파일만 업로드 가능합니다.', 'tw-bg-red-600')
      }
    }
  }

  useEffect(() => {
    if (screenShotFile) {
      handleUploadButton()
    }
  }, [screenShotFile])

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

  const handleUploadButton = () => {
    if (screenShotFile) {
      const reader = new FileReader()
      reader.onload = () => {
        const buffer = reader.result
        window.ipc.send('screenshot-upload', buffer)
      }
      reader.readAsArrayBuffer(screenShotFile)
      addNotificationCallback('성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.', 'tw-bg-blue-600')
      setIsUploading(true)
    }
  }

  const [pattern, setPattern] = useState<string>('')

  useEffect(() => {
    setIsUploading(true)
    setUploadedPageData(uploadedData)
    if (uploadedData && uploadedData.pattern) {
      if (uploadedData.pattern === 'SC') {
        setPattern('SC')
      } else if (uploadedData.pattern === 'MAXIMUM') {
        setPattern('MX')
      } else if (uploadedData.pattern === 'HARD') {
        setPattern('HD')
      } else {
        setPattern('NM')
      }
    }
  }, [uploadedData])

  useEffect(() => {
    let timer
    if (hoveredTitle) {
      timer = setTimeout(() => {
        fetchSongItemData(hoveredTitle)
        // fetchCommentRivalSongItemData(hoveredTitle)
        setBackgroundBgaName(String(hoveredTitle))
      }, 500)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [hoveredTitle])

  const fetchUpdateScore = async (data) => {
    try {
      const backupData = await axios
        .get(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${userData.userName}/title/${data.songData.title}`)
        .then(async (backupData) => {
          const response = await axios
            .post(
              `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/open/${userData.userNo}/score`,
              {
                name: data.songData.name,
                composer: data.songData.composer,
                button: Number(data.button),
                pattern: data.pattern,
                score: parseFloat(String(data.score)),
                maxCombo: Number(data.maxCombo),
              },
              {
                method: 'POST',
                headers: {
                  Authorization: `${userData.userToken}`,
                  'Content-Type': 'application/json',
                },
                withCredentials: true,
              },
            )
            .then((data) => {
              if (uploadedData.filePath) {
                addNotificationCallback(`${uploadedData.filePath} 경로에 성과 기록 이미지가 저장되었습니다.`, 'tw-bg-lime-600')
              }
              if (data.data.success && data.data.update) {
                addNotificationCallback('성과 기록을 V-ARCHIVE에 정상적으로 갱신하였습니다.', 'tw-bg-lime-600')
                setBackupData(backupData.data)
                setIsCanRollback(true)
              } else if (data.data.success && !data.data.update) {
                addNotificationCallback('기존의 성과 기록과 동일하거나 더 좋은 성과 기록이 존재하여 V-ARCHIVE에 갱신되지 않았습니다.', 'tw-bg-orange-600')
                setBackupData(backupData.data)
              } else {
                addNotificationCallback('알 수 없는 오류가 발생하여 성과 기록 갱신에 실패하였습니다. 다시 시도해주시길 바랍니다.', 'tw-bg-red-600')
              }
            })
            .catch((error) => {
              // console.log(error)
            })
        })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleRollback = async () => {
    if (uploadedPageData.songData.title === backupData.title) {
      try {
        const response = await axios
          .post(
            `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/userRecord`,
            {
              button: Number(uploadedPageData.button),
              pattern: pattern,
              force: true,
              maxCombo: Number(backupData.patterns[`${uploadedPageData.button}B`][pattern].maxCombo),
              score: parseFloat(String(backupData.patterns[`${uploadedPageData.button}B`][pattern].score)),
              title: uploadedPageData.songData.title,
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
              setBackupData(null)
              setUploadedPageData(null)
              setIsCanRollback(false)
              addNotificationCallback('성과 기록을 정상적으로 롤백하였습니다.', 'tw-bg-lime-600')
            }
          })
          .catch((error) => {
            // console.log(error)
          })
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    } else {
      addNotificationCallback('알 수 없는 오류가 발생하여 성과 기록 롤백에 실패하였습니다. 다시 시도해주시길 바랍니다.', 'tw-bg-red-600')
    }
  }

  useEffect(() => {
    if (!isLoading) {
      if (uploadedPageData !== null && !uploadedPageData.isVerified && uploadedPageData.error) {
        addNotificationCallback('마지막으로 업로드한 성과 기록 이미지의 데이터 유효성 검증에 실패하였습니다. 다시 캡쳐한 후 재시도해주세요.', 'tw-bg-red-600')
      } else if (uploadedPageData !== null && uploadedPageData.isVerified) {
        addNotificationCallback(
          '성과 기록 이미지의 데이터 유효성 검증에 성공하였습니다. V-ARCHIVE, 프로젝트 RA 서비스로 점수 갱신을 요청합니다.',
          'tw-bg-lime-600',
        )
        fetchUpdateScore(uploadedPageData)
      }
    }
    setIsLoading(false)
    setIsUploading(false)
  }, [uploadedPageData])

  return (
    <React.Fragment>
      <Head>
        <title>DJMAX RESPECT V 기록 등록(베타) - 프로젝트 RA</title>
      </Head>
      {userData.userName !== '' ? (
        <div
          className={`tw-flex tw-gap-4 vh-screen tw-relative`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="tw-absolute tw-inset-0 tw-bg-gray-900 tw-bg-opacity-70 tw-z-50 tw-flex tw-flex-col tw-gap-4 tw-items-center tw-justify-center tw-transition-all tw-border-2 tw-border-dashed tw-border-white tw-rounded-md">
              <IconContext.Provider value={{ size: '36', className: 'tw-animate-pulse' }}>
                <FaRegFile />
              </IconContext.Provider>
              <div className="tw-text-xl tw-font-bold tw-text-white tw-animate-pulse">리절트(결과) 화면의 이미지를 업로드해주세요.</div>
              <div className="tw-text-base tw-text-white tw-animate-pulse">
                지금은 프리스타일 리절트만 지원합니다. 추후 래더/버서스 리절트 이미지 업로드 기능을 추가할 예정입니다.
              </div>
            </div>
          )}
          <div className="tw-flex tw-flex-col tw-w-4/12 tw-relative tw-gap-4">
            <div className="tw-flex tw-flex-col tw-gap-2 tw-bg-gray-600 tw-bg-opacity-10 p-4 tw-rounded-md flex-equal">
              {/* 상단 */}
              <div className="tw-flex tw-w-full tw-mb-2 tw-items-center">
                {/* 제목 */}
                <span className="tw-text-lg tw-font-bold me-auto">자동 업로드 옵션(실험)</span>
                {/* uploadedPageData.button 선택 */}
                <div className="tw-flex tw-gap-2">
                  <button
                    className={`tw-relative tw-inline-flex tw-items-center tw-h-5 tw-w-10 tw-rounded-full tw-transition-colors tw-duration-300 ${
                      settingData.autoCaptureMode ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                    }`}
                    onClick={() => {
                      setSettingData({ ...settingData, autoCaptureMode: !settingData.autoCaptureMode })
                      window.ipc.send('changeAutoCaptureMode', { autoCaptureMode: !settingData.autoCaptureMode })
                      if (!settingData.autoCaptureMode) {
                        addNotificationCallback(
                          '주의 : 자동 업로드 옵션은 실험적인 기능으로 화면 끊어짐 등의 이상 현상이 발생할 수 있습니다.',
                          'tw-bg-orange-600',
                        )
                      }
                    }}
                  >
                    <span
                      className={`tw-inline-block tw-h-4 tw-w-4 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-1000 ${
                        settingData.autoCaptureMode ? 'tw-right-1' : 'tw-left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <span className="tw-font-semibold tw-text-base">캡쳐 API</span>
              <select
                className="form-select tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-light"
                onChange={(e) => {
                  setSettingData({ ...settingData, autoCaptureApi: e.currentTarget.value })
                  window.ipc.send('changeAutoCaptureApi', { autoCaptureApi: e.currentTarget.value })
                }}
                defaultValue={settingData.autoCaptureApi}
              >
                <option value="xcap-api">XCap API(추천, Rust로 작성된 게임 화면 캡쳐 API)</option>
                <option value="eapi">Electron API(Node.js로 작성된 게임 화면 캡쳐 API)</option>
                <option value="napi" disabled>
                  LunaCap API(Deprecated, Rust로 작성된 디스플레이(화면) 캡쳐 API)
                </option>
              </select>

              <span className="tw-font-semibold tw-text-base">텍스트 인식(OCR) API</span>
              <select
                className="form-select tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-light"
                onChange={(e) => {
                  // setSettingData({ ...settingData, autoCaptureApi: e.currentTarget.value })
                  // window.ipc.send('changeAutoCaptureApi', { autoCaptureApi: e.currentTarget.value })
                }}
                defaultValue={'tesseract-server'}
              >
                <option value="tesseract-server">Project RA Server API(서버 사이드 텍스트 인식 API)</option>
                <option value="tesseract-client" disabled>
                  Project RA Client API(Deprecated, 클라이언트 사이드 텍스트 인식 API)
                </option>
                <option value="google-vision" disabled>
                  Google Vision AI API(Deprecated, AI 기반 외부 텍스트 인식 API)
                </option>
              </select>

              <span className="tw-font-semibold tw-text-base">캡쳐 주기</span>
              <select
                className="form-select tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-light"
                onChange={(e) => {
                  setSettingData({ ...settingData, autoCaputreIntervalTime: Number(e.currentTarget.value) })
                  window.ipc.send('changeAutoCaptureIntervalTime', { autoCaptureIntervalTime: Number(e.currentTarget.value) })
                }}
                defaultValue={String(settingData.autoCaptureIntervalTime)}
              >
                <option value="1000">1초(상남자 옵션)</option>
                <option value="2000">2초</option>
                <option value="3000">3초(추천)</option>
                <option value="5000">5초</option>
                <option value="10000">10초</option>
              </select>
            </div>

            <div className="tw-flex tw-flex-col tw-gap-2 tw-bg-gray-600 tw-bg-opacity-10 p-4 tw-rounded-md">
              {/* 상단 */}
              <div className="tw-flex tw-w-full tw-mb-2">
                {/* 제목 */}
                <span className="tw-text-lg tw-font-bold me-auto">유틸리티</span>
              </div>
              {/* 내용 */}
              <div className="tw-flex tw-flex-col tw-gap-2 tw-items-center">
                <button
                  type="button"
                  onClick={() => {
                    window.ipc.send('captureTest')
                    addNotificationCallback(
                      '화면 캡쳐가 요청 되었습니다. 결과 이미지는 사용자의 사진 폴더에 위치한 PROJECT-RA에서 확인할 수 있습니다.',
                      'tw-bg-lime-600',
                    )
                  }}
                  className="tw-flex tw-justify-center tw-items-center tw-w-full tw-h-8 tw-gap-1 btn-reg tw-rounded-md tw-text-md tw-bg-gray-950 tw-bg-opacity-50"
                >
                  현재 게임 화면 캡쳐
                </button>
                <button
                  type="button"
                  disabled={
                    !(backupData && uploadedPageData && uploadedPageData.songData) ||
                    backupData.title !== uploadedPageData.songData.title ||
                    !backupData.patterns[`${uploadedPageData.button}B`][pattern].score ||
                    !isCanRollback
                  }
                  onClick={() => {
                    handleRollback()
                    addNotificationCallback(
                      '주의 : 롤백이 요청 되었습니다. 마지막으로 업로드된 이미지의 성과 기록을 업로드되기 전으로 되돌립니다.',
                      'tw-bg-orange-600',
                    )
                  }}
                  className="tw-flex tw-justify-center tw-items-center tw-w-full tw-h-8 tw-gap-1 tw-rounded-md tw-text-md tw-bg-red-600 tw-bg-opacity-100 tw-transition-all hover:tw-bg-red-900"
                >
                  마지막으로 업로드된 성과 기록 롤백
                </button>
              </div>
            </div>
          </div>

          <div className="tw-flex tw-flex-col tw-w-8/12 tw-relative tw-animate-fadeInLeft tw-transition-all ">
            {uploadedPageData !== null && !isUploading && uploadedPageData.songData !== undefined ? (
              <>
                <div
                  className={
                    'tw-flex tw-flex-col tw-gap-1 tw-bg-opacity-10 tw-rounded-md p-0 tw-mb-4 tw-h-60 ' +
                    ` respect_dlc_${uploadedPageData.songData.dlcCode} respect_dlc_logo_${uploadedPageData.songData.dlcCode} respect_dlc_logo_BG_${uploadedPageData.songData.dlcCode}`
                  }
                >
                  <div className="tw-flex tw-flex-col tw-animate-fadeInLeft p-4 flex-equal tw-bg-gray-900 tw-bg-opacity-30 tw-rounded-md">
                    <div className="tw-flex">
                      <div className="tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950 tw-bg-opacity-75 tw-me-auto">
                        <span className="respect_dlc_code_wrap ">
                          <span className={`respect_dlc_code respect_dlc_code_${uploadedPageData.songData.dlcCode}`}>{uploadedPageData.songData.dlc}</span>
                        </span>
                      </div>
                      <div className="tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950 tw-bg-opacity-75 px-3 tw-flex tw-items-center tw-gap-2 tw-me-2">
                        <span className={'tw-text-base text-stroke-100 tw-font-extrabold tw-text-gray-50'}>{uploadedPageData.button}B</span>
                      </div>
                      <div className="tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950 tw-bg-opacity-75 px-3 tw-flex tw-items-center tw-gap-2 tw-me-2">
                        <span
                          className={
                            uploadedPageData.songData.patterns[`${uploadedPageData.button}B`][pattern].level <= 5
                              ? 'tw-text-base text-stroke-100 tw-font-extrabold ' + (pattern === 'SC' ? ' tw-text-respect-sc-5' : ' tw-text-respect-nm-5')
                              : uploadedPageData.songData.patterns[`${uploadedPageData.button}B`][pattern].level <= 10
                              ? 'tw-text-base text-stroke-100 tw-font-extrabold ' + (pattern === 'SC' ? ' tw-text-respect-sc-10' : ' tw-text-respect-nm-10')
                              : 'tw-text-base text-stroke-100 tw-font-extrabold ' + (pattern === 'SC' ? ' tw-text-respect-sc-15' : ' tw-text-respect-nm-15')
                          }
                        >
                          {pattern}
                        </span>
                      </div>
                      <div className="tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950 tw-bg-opacity-75 px-3 tw-flex tw-items-center tw-gap-2">
                        <div>
                          <Image
                            src={
                              uploadedPageData.songData.patterns[`${uploadedPageData.button}B`][pattern].level <= 5
                                ? `/images/djmax_respect_v/${pattern === 'SC' ? 'sc' : 'nm'}_5_star.png`
                                : uploadedPageData.songData.patterns[`${uploadedPageData.button}B`][pattern].level <= 10
                                ? `/images/djmax_respect_v/${pattern === 'SC' ? 'sc' : 'nm'}_10_star.png`
                                : `/images/djmax_respect_v/${pattern === 'SC' ? 'sc' : 'nm'}_15_star.png`
                            }
                            height={14}
                            width={14}
                            alt=""
                          />
                        </div>
                        <span
                          className={
                            uploadedPageData.songData.patterns[`${uploadedPageData.button}B`][pattern].level <= 5
                              ? 'tw-text-base text-stroke-100 tw-font-extrabold ' + (pattern === 'SC' ? ' tw-text-respect-sc-5' : ' tw-text-respect-nm-5')
                              : uploadedPageData.songData.patterns[`${uploadedPageData.button}B`][pattern].level <= 10
                              ? 'tw-text-base text-stroke-100 tw-font-extrabold ' + (pattern === 'SC' ? ' tw-text-respect-sc-10' : ' tw-text-respect-nm-10')
                              : 'tw-text-base text-stroke-100 tw-font-extrabold ' + (pattern === 'SC' ? ' tw-text-respect-sc-15' : ' tw-text-respect-nm-15')
                          }
                        >
                          {uploadedPageData.songData.patterns[`${uploadedPageData.button}B`][pattern].level}
                        </span>
                      </div>
                    </div>

                    {/* 하단 */}
                    <div className="tw-flex tw-gap-3 tw-mt-auto tw-items-end">
                      <OverlayTrigger
                        placement="auto-start"
                        delay={{ show: userData.userName !== '' ? 500 : 500, hide: 0 }}
                        overlay={
                          <Tooltip id="btn-nav-home" className={`tw-text-xs tw-min-h-48 ${fontFamily}`}>
                            {songItemData !== null ? (
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
                                        <div className="tw-flex tw-flex-col tw-gap-2">
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
                                    {/* {userData.userName !== '' ? (
                                                <span className="tw-text-xs tw-font-light tw-text-gray-300">
                                                  로그인 사용자({userData.userName})의 성과 기록입니다.
                                                </span>
                                              ) : null} */}
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
                                              key={'RivalBaseSongDataPack_item' + commentRivalSongItemData.title + '_hover' + value + '_' + commentRivalName}
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
                        <Link
                          href={`/vArchive/db/title/${uploadedPageData.songData.title}`}
                          className="hover-scale-110 tw-relative"
                          onMouseEnter={() => {
                            setHoveredTitle(String(uploadedPageData.songData.title))
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
                          <Image
                            src={`/images/djmax_respect_v/jackets/${uploadedPageData.songData.title}.jpg`}
                            height={90}
                            width={90}
                            alt=""
                            className="tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm"
                          />
                        </Link>
                      </OverlayTrigger>
                      <div className="tw-flex tw-flex-col tw-w-full">
                        {/* 제목 */}
                        <span className="tw-flex tw-font-light tw-text-gray-300">{uploadedPageData.songData.composer}</span>
                        <span className="tw-text-lg tw-font-bold me-auto">
                          {uploadedPageData.songData.name}
                          <sup className="tw-text-xs tw-font-light tw-text-gray-300">
                            {' '}
                            (V-ARCHIVE : {uploadedPageData.songData.title} / 프로젝트-RA : {uploadedPageData.songData.title})
                          </sup>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-gap-2 tw-mb-4">
                  <div className="tw-flex tw-justify-between tw-items-center">
                    {backupData && uploadedPageData && uploadedPageData.songData && backupData.title === uploadedPageData.songData.title && backupData ? (
                      <div className="tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-text-base tw-font-light">
                          {parseFloat(String(backupData.patterns[`${uploadedPageData.button}B`][pattern].score)) >= parseFloat(String(uploadedPageData.score))
                            ? 'BEST'
                            : 'LAST'}{' '}
                          SCORE
                        </span>
                        <span className="tw-font-extrabold tw-text-4xl">
                          {backupData.patterns[`${uploadedPageData.button}B`][pattern].score
                            ? backupData.patterns[`${uploadedPageData.button}B`][pattern].score
                            : '00.00'}
                          %
                        </span>
                      </div>
                    ) : null}
                    <div className="tw-flex tw-flex-col tw-gap-2">
                      <span className="tw-text-base tw-font-light">CURRENT SCORE</span>
                      <span className="tw-font-extrabold tw-text-4xl">
                        {String(uploadedPageData.score).includes('.')
                          ? String(uploadedPageData.score).split('.')[1].length === 1
                            ? String(uploadedPageData.score) + '0'
                            : uploadedPageData.score
                          : uploadedPageData.score + '.00'}
                        %
                      </span>
                    </div>
                    <div className="tw-flex tw-flex-col tw-gap-2">
                      <span className="tw-text-base tw-font-light">MAX COMBO</span>
                      <span className="tw-font-extrabold tw-text-4xl">{uploadedPageData.maxCombo === 1 ? <FiCircle /> : <FiX />}</span>
                    </div>
                    <div className="tw-rounded-md tw-flex tw-gap-2">
                      <div className="tw-relative" style={{ width: 70, height: 70 }}>
                        <Image src={`/images/djmax_respect_v/effectors/SPEED_BG.png`} width={70} height={70} alt="" className="tw-shadow-sm tw-absolute" />
                        <div className="tw-absolute tw-flex tw-justify-center tw-items-center tw-bottom-0" style={{ width: 70, height: 60 }}>
                          <span className="tw-font-extrabold tw-text-3xl">
                            {String(uploadedPageData.speed).length === 1 ? String(uploadedPageData.speed) + '.0' : String(uploadedPageData.speed)}
                          </span>
                        </div>
                      </div>
                      {uploadedPageData.note !== null ? (
                        <Image src={`/images/djmax_respect_v/effectors/${uploadedPageData.note}.png`} width={70} height={70} alt="" />
                      ) : (
                        <div className="tw-bg-gray-950 tw-bg-opacity-30 tw-shadow-sm tw-rounded-lg" style={{ width: 70, height: 70 }} />
                      )}
                      {uploadedPageData.fader !== null ? (
                        <Image src={`/images/djmax_respect_v/effectors/${uploadedPageData.fader}.png`} width={70} height={70} alt="" />
                      ) : (
                        <div className="tw-bg-gray-950 tw-bg-opacity-30 tw-shadow-sm tw-rounded-lg" style={{ width: 70, height: 70 }} />
                      )}
                      {uploadedPageData.chaos !== null ? (
                        <Image src={`/images/djmax_respect_v/effectors/${uploadedPageData.chaos}.png`} width={70} height={70} alt="" />
                      ) : (
                        <div className="tw-bg-gray-950 tw-bg-opacity-30 tw-shadow-sm tw-rounded-lg" style={{ width: 70, height: 70 }} />
                      )}
                    </div>
                  </div>
                </div>

                <div className="tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft flex-equal tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-gap-2 tw-mb-auto">
                  <div className="tw-flex tw-w-full tw-mb-2 tw-items-center">
                    {/* 제목 */}
                    <span className="tw-text-lg tw-font-bold me-auto">팁 & 추천 옵션</span>
                  </div>
                  <div className="tw-flex flex-equal tw-justify-center tw-items-center">
                    <span>준비 중인 서비스 입니다.</span>
                  </div>
                </div>
              </>
            ) : isUploading ? (
              <div className="tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft tw-h-full tw-justify-center tw-items-center tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md">
                <div className="tw-relative tw-text-center tw-animate-spin">
                  <IconContext.Provider value={{ className: '' }}>
                    <FaRotate />
                  </IconContext.Provider>
                </div>
              </div>
            ) : (
              <div className="tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft tw-h-full tw-justify-center tw-items-center tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md">
                수동 또는 자동으로 성과 기록을 업로드해주세요.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="tw-flex tw-flex-col vh-screen tw-relative tw-animate-fadeInLeft tw-h-full tw-justify-center tw-items-center tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md">
          기록 등록(베타)는 로그인이 필요합니다.
        </div>
      )}
    </React.Fragment>
  )
}
