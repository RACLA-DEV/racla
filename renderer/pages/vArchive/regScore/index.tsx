import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import * as R from 'ramda'
import { FaBackward, FaCircleInfo, FaHeart, FaO, FaRegFile, FaRegHeart, FaRotate, FaTriangleExclamation, FaX } from 'react-icons/fa6'
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
import { setBackgroundBgaName } from 'store/slices/uiSlice'
import { useDispatch } from 'react-redux'
import { setPattern, setSettingData, setUploadedDataProcessed, setUploadedPageData, setBackupData } from 'store/slices/appSlice'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import ScorePopupComponent from '@/components/score/ScorePopupComponent'
import { SyncLoader } from 'react-spinners'
import { useRouter } from 'next/router'

export default function VArchiveRegScorePage() {
  const { showNotification } = useNotificationSystem()
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)
  const dispatch = useDispatch()
  const { userData, songData, uploadedData, settingData, isUploadedDataProcessed, backupData } = useSelector((state: RootState) => state.app)
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)

  const [keyMode] = useState<string>('4')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [songItemData, setSongItemData] = useState<any>(null)

  const [screenShotFile, setScreenShotFile] = useState<any>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const [isCanRollback, setIsCanRollback] = useState<boolean>(false)

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
      showNotification('이미 업로드가 진행 중입니다. 완료될 때까지 기다려주세요.', 'tw-bg-orange-600')
      return
    }

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.match('image.*')) {
        setScreenShotFile(file)
      } else {
        showNotification('이미지 파일만 업로드 가능합니다.', 'tw-bg-red-600')
      }
    }
  }

  useEffect(() => {
    if (screenShotFile) {
      handleUploadButton()
    }
  }, [screenShotFile])

  const handleUploadButton = () => {
    if (screenShotFile) {
      const reader = new FileReader()
      reader.onload = () => {
        const buffer = reader.result
        window.ipc.send('screenshot-upload', buffer)
      }
      reader.readAsArrayBuffer(screenShotFile)
      showNotification('성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.', 'tw-bg-blue-600')
      setIsUploading(true)
    }
  }

  const { uploadedPageData, pattern } = useSelector((state: RootState) => state.app)

  useEffect(() => {
    if (uploadedData && !isUploadedDataProcessed) {
      setIsUploading(true)

      dispatch(setUploadedPageData(uploadedData))

      if (uploadedData && uploadedData.pattern) {
        let newPattern = 'NM'
        if (uploadedData.pattern === 'SC') {
          newPattern = 'SC'
        } else if (uploadedData.pattern === 'MAXIMUM') {
          newPattern = 'MX'
        } else if (uploadedData.pattern === 'HARD') {
          newPattern = 'HD'
        }
        dispatch(setPattern(newPattern))
        setPattern(newPattern)
      }

      setUploadedPageData(uploadedData)

      if (!uploadedData.isVerified && uploadedData.error) {
        showNotification('마지막으로 업로드한 성과 기록 이미지의 데이터 유효성 검증에 실패하였습니다. 다시 캡쳐한 후 재시도해주세요.', 'tw-bg-red-600')
      } else if (uploadedData.isVerified) {
        showNotification('성과 기록 이미지의 데이터 유효성 검증에 성공하였습니다. V-ARCHIVE, 프로젝트 RA 서비스로 점수 갱신을 요청합니다.', 'tw-bg-lime-600')
        fetchUpdateScore(uploadedData)
      }

      dispatch(setUploadedDataProcessed(true))
    }
    setIsLoading(false)
    setIsUploading(false)
  }, [uploadedData, isUploadedDataProcessed])

  useEffect(() => {
    if (uploadedPageData) {
      setUploadedPageData(uploadedPageData)
    }
    if (pattern) {
      setPattern(pattern)
    }
  }, [])

  const router = useRouter()

  useEffect(() => {
    if (userData.userName === '') {
      router.push('/projectRa/home')
      showNotification('기록 등록(베타)는 로그인이 필요합니다.', 'tw-bg-red-600')
    }
  }, [userData])

  const fetchUpdateScore = async (data) => {
    try {
      const response = await axios
        .get(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${userData.userName}/title/${data.songData.title}`)
        .then(async (backupData) => {
          dispatch(setBackupData(backupData.data))

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
                showNotification(`${uploadedData.filePath} 경로에 성과 기록 이미지가 저장되었습니다.`, 'tw-bg-lime-600')
              }
              if (data.data.success && data.data.update) {
                showNotification('성과 기록을 V-ARCHIVE에 정상적으로 갱신하였습니다.', 'tw-bg-lime-600')
                setIsCanRollback(true)
              } else if (data.data.success && !data.data.update) {
                showNotification('기존의 성과 기록과 동일하거나 더 좋은 성과 기록이 존재하여 V-ARCHIVE에 갱신되지 않았습니다.', 'tw-bg-orange-600')
                setIsCanRollback(false)
              } else {
                showNotification('알 수 없는 오류가 발생하여 성과 기록 갱신에 실패하였습니다. 다시 시도해주시길 바랍니다.', 'tw-bg-red-600')
                setIsCanRollback(false)
              }
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
              showNotification('성과 기록을 정상적으로 롤백하였습니다.', 'tw-bg-lime-600')
            }
          })
          .catch((error) => {
            // console.log(error)
          })
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    } else {
      showNotification('알 수 없는 오류가 발생하여 성과 기록 롤백에 실패하였습니다. 다시 시도해주시길 바랍니다.', 'tw-bg-red-600')
    }
  }

  // uploadedPageData 변경 감지하여 배경 BGA 설정
  useEffect(() => {
    if (uploadedPageData && uploadedPageData.songData) {
      dispatch(setBackgroundBgaName(uploadedPageData.songData.title))
    } else {
      dispatch(setBackgroundBgaName(''))
    }
  }, [uploadedPageData])

  useEffect(() => {
    if (!backgroundBgaName && uploadedPageData) {
      dispatch(setBackgroundBgaName(uploadedPageData.songData.title))
    }
  }, [backgroundBgaName])

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
                지금은 프리스타일 리절트만 지원합니다. 추후 래더/버서스 리절트 이미지 업로드 기능이 추가될 예정입니다.
              </div>
            </div>
          )}
          <div className="tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft tw-transition-all ">
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
                            loading="lazy" // "lazy" | "eager"
                            blurDataURL={globalDictionary.blurDataURL}
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
                      <ScorePopupComponent songItemTitle={uploadedPageData.songData.title} keyMode={keyMode} />
                      <div className="tw-flex tw-flex-col tw-w-full">
                        {/* 제목 */}
                        <span className="tw-flex tw-font-light tw-text-gray-300">{uploadedPageData.songData.composer}</span>
                        <div className="tw-flex">
                          <span className="tw-text-lg tw-font-bold me-auto">
                            {uploadedPageData.songData.name}
                            <sup className="tw-text-xs tw-font-light tw-text-gray-300">
                              {' '}
                              (V-ARCHIVE : {uploadedPageData.songData.title} / 프로젝트 RA : {uploadedPageData.songData.title})
                            </sup>
                          </span>
                          {isCanRollback && backupData.patterns[`${uploadedPageData.button}B`][pattern].score && (
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
                                showNotification(
                                  '주의 : 롤백이 요청 되었습니다. 마지막으로 업로드된 이미지의 성과 기록을 업로드되기 전으로 되돌립니다.',
                                  'tw-bg-orange-600',
                                )
                              }}
                              className="tw-flex tw-justify-center tw-items-center tw-p-3 tw-h-8 tw-gap-1 tw-rounded-md tw-text-md tw-bg-red-600 tw-bg-opacity-100 tw-transition-all hover:tw-bg-red-900"
                            >
                              이전 성과 기록으로 롤백
                            </button>
                          )}
                        </div>
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
                      <span className="tw-text-base tw-font-light">{backupData ? 'CURRENT SCORE' : 'LAST PLAYED SCORE'}</span>
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
                        <Image
                          loading="lazy" // "lazy" | "eager"
                          blurDataURL={globalDictionary.blurDataURL}
                          src={`/images/djmax_respect_v/effectors/SPEED_BG.png`}
                          width={70}
                          height={70}
                          alt=""
                          className="tw-shadow-sm tw-absolute"
                        />
                        <div className="tw-absolute tw-flex tw-justify-center tw-items-center tw-bottom-0" style={{ width: 70, height: 60 }}>
                          <span className="tw-font-extrabold tw-text-3xl">
                            {String(uploadedPageData.speed).length === 1 ? String(uploadedPageData.speed) + '.0' : String(uploadedPageData.speed)}
                          </span>
                        </div>
                      </div>
                      {uploadedPageData.note !== null ? (
                        <Image
                          loading="lazy" // "lazy" | "eager"
                          blurDataURL={globalDictionary.blurDataURL}
                          src={`/images/djmax_respect_v/effectors/${uploadedPageData.note}.png`}
                          width={70}
                          height={70}
                          alt=""
                        />
                      ) : (
                        <div className="tw-bg-gray-950 tw-bg-opacity-30 tw-shadow-sm tw-rounded-lg" style={{ width: 70, height: 70 }} />
                      )}
                      {uploadedPageData.fader !== null ? (
                        <Image
                          loading="lazy" // "lazy" | "eager"
                          blurDataURL={globalDictionary.blurDataURL}
                          src={`/images/djmax_respect_v/effectors/${uploadedPageData.fader}.png`}
                          width={70}
                          height={70}
                          alt=""
                        />
                      ) : (
                        <div className="tw-bg-gray-950 tw-bg-opacity-30 tw-shadow-sm tw-rounded-lg" style={{ width: 70, height: 70 }} />
                      )}
                      {uploadedPageData.chaos !== null ? (
                        <Image
                          loading="lazy" // "lazy" | "eager"
                          blurDataURL={globalDictionary.blurDataURL}
                          src={`/images/djmax_respect_v/effectors/${uploadedPageData.chaos}.png`}
                          width={70}
                          height={70}
                          alt=""
                        />
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
                  <div className="tw-flex tw-flex-col flex-equal tw-justify-center tw-items-center">
                    <span>해당 수록곡의 충분한 플레이 데이터가 생성되지 않아 팁 & 추천 옵션을 제공할 수 없습니다.</span>
                    <span>더 많은 사용자의 플레이 데이터가 수집될 때까지 기다려주세요.</span>
                  </div>
                </div>
              </>
            ) : isUploading ? (
              <div className="tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft tw-h-full tw-justify-center tw-items-center tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md">
                <SyncLoader color="#ffffff" size={8} />
              </div>
            ) : (
              <div className="tw-absolute tw-inset-0 tw-bg-gray-900 tw-bg-opacity-70 tw-z-50 tw-flex tw-flex-col tw-gap-4 tw-items-center tw-justify-center tw-transition-all tw-border-2 tw-border-dashed tw-border-white tw-rounded-md">
                <IconContext.Provider value={{ size: '36', className: 'tw-animate-pulse' }}>
                  <FaRegFile />
                </IconContext.Provider>
                <div className="tw-text-xl tw-font-bold tw-text-white tw-animate-pulse">리절트(결과) 화면의 이미지를 업로드해주세요.</div>
                <div className="tw-text-base tw-text-white tw-animate-pulse">
                  지금은 프리스타일 리절트만 지원합니다. 추후 래더/버서스 리절트 이미지 업로드 기능이 추가될 예정입니다.
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
    </React.Fragment>
  )
}
