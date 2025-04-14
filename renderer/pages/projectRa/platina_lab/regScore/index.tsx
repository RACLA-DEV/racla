import 'dayjs/locale/ko'

import React, { useEffect, useState } from 'react'
import { FaCloudArrowUp, FaRankingStar } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearProjectRaData,
  setIsUploading,
  setProjectRaPattern,
  setProjectRaUploadedPageData,
  setUploadedDataProcessed,
} from 'store/slices/appSlice'

import RaScorePopupComponent from '@/components/score/popup/ScorePopupRacla'
import { useNotificationSystem } from '@hooks/useNotifications'
import { useRecentHistory } from '@hooks/useRecentHistory'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { IconContext } from 'react-icons'
import { FiTriangle } from 'react-icons/fi'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

dayjs.locale('ko')
dayjs.extend(utc)

export default function PlatinaLabRegScorePage() {
  const { showNotification } = useNotificationSystem()
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)
  const dispatch = useDispatch()
  const {
    userData,
    songData,
    settingData,
    isUploadedDataProcessed,
    backupData,
    projectRaUploadedPageData,
  } = useSelector((state: RootState) => state.app)
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)

  const [keyMode] = useState<string>('4')

  const [screenShotFile, setScreenShotFile] = useState<any>(null)
  const isUploading = useSelector((state: RootState) => state.app.isUploading)

  const [isDragging, setIsDragging] = useState<boolean>(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isDragging) {
      setIsDragging(true)
    }
  }

  const patternToCode = (pattern: string) => {
    switch (pattern) {
      case 'SC':
        return 'SC'
      case 'MAXIMUM':
      case 'MX':
        return 'MX'
      case 'HARD':
      case 'HD':
        return 'HD'
      case 'NORMAL':
      case 'NM':
        return 'NM'
      case 'EASY':
        return 'EASY'
      case 'OVER':
        return 'OVER'
      case 'PLUS_1':
        return 'PLUS_1'
      case 'PLUS_2':
        return 'PLUS_2'
      case 'PLUS_3':
        return 'PLUS_3'
      case 'DPC':
        return 'DPC'
      default:
        return 'NM'
    }
  }

  const codeToPatternName = (pattern: string) => {
    switch (pattern) {
      case 'SC':
        return 'SC'
      case 'MAXIMUM':
      case 'MX':
        return 'MX'
      case 'HARD':
      case 'HD':
        return 'HARD'
      case 'NORMAL':
      case 'NM':
        return 'NORMAL'
      case 'EASY':
        return 'EASY'
      case 'OVER':
        return 'OVER'
      case 'PLUS_1':
        return 'PLUS'
      case 'PLUS_2':
        return 'PLUS'
      case 'PLUS_3':
        return 'PLUS'
      case 'DPC':
        return 'DPC'
      default:
        return 'NM'
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
      showNotification(
        '이미 업로드가 진행 중입니다. 완료될 때까지 기다려주세요.',
        'tw-bg-orange-600',
      )
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
        window.ipc.send('screenshot-upload', { buffer: buffer, gameCode: 'platina_lab' })
      }
      reader.readAsArrayBuffer(screenShotFile)
      showNotification(
        '성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.',
        'tw-bg-blue-600',
      )
      dispatch(setIsUploading(true))
    }
  }

  const { projectRaPattern } = useSelector((state: RootState) => state.app)

  const { projectRaData } = useSelector((state: RootState) => state.app)

  useEffect(() => {
    if (projectRaData && !isUploadedDataProcessed) {
      dispatch(setIsUploading(true))
      dispatch(setProjectRaUploadedPageData(projectRaData))
      // 기존 단일 플레이어 데이터 처리
      if (projectRaData.pattern) {
        let newPattern = 'NM'
        switch (projectRaData.pattern) {
          case 'DPC':
            newPattern = 'DPC'
            break
          case 'SC':
            newPattern = 'SC'
            break
          case 'MAXIMUM':
          case 'MX':
            newPattern = 'MX'
            break
          case 'HARD':
          case 'HD':
            newPattern = 'HD'
            break
          case 'NORMAL':
          case 'NM':
            newPattern = 'NM'
            break
          case 'EASY':
            newPattern = 'EASY'
            break
          case 'OVER':
            newPattern = 'OVER'
            break
          case 'PLUS_1':
            newPattern = 'PLUS_1'
            break
          case 'PLUS_2':
            newPattern = 'PLUS_2'
            break
          case 'PLUS_3':
            newPattern = 'PLUS_3'
            break
          default:
            newPattern = 'NM'
        }
        dispatch(setProjectRaPattern(newPattern))

        if (!projectRaData.isVerified && projectRaData.error) {
          showNotification(
            '마지막으로 업로드한 성과 기록 이미지의 데이터 유효성 검증에 실패하였습니다. 다시 캡쳐한 후 재시도해주세요.',
            'tw-bg-red-600',
          )
        } else if (projectRaData.isVerified) {
          showNotification('성과 기록을 RACLA에 정상적으로 갱신하였습니다.', 'tw-bg-lime-600')
          if (projectRaData.filePath) {
            showNotification(
              `${projectRaData.filePath} 경로에 성과 기록 이미지가 저장되었습니다.`,
              'tw-bg-lime-600',
            )
          }
          fetchRecentHistory()
        }
      }

      dispatch(setUploadedDataProcessed(true))
      dispatch(setIsUploading(false))
      dispatch(clearProjectRaData())
    }
  }, [projectRaData, isUploadedDataProcessed])

  useEffect(() => {
    if (projectRaUploadedPageData) {
      dispatch(setProjectRaUploadedPageData(projectRaUploadedPageData))
    }
    if (projectRaPattern) {
      dispatch(setProjectRaPattern(projectRaPattern))
    }
  }, [])

  const router = useRouter()

  useEffect(() => {
    if (userData.userToken === '') {
      router.push('/')
      showNotification('기록 등록은 로그인이 필요합니다.', 'tw-bg-red-600')
    }
  }, [userData.userToken, router, showNotification])

  // projectRaUploadedPageData 변경 감지하여 배경 BGA 설정
  useEffect(() => {
    if (projectRaUploadedPageData) {
      // 기존 단일 플레이어 모드
      if (projectRaUploadedPageData.songData) {
        dispatch(
          setBackgroundBgaName(
            'resources/music' +
              String(projectRaUploadedPageData.songData.bgaPreviewFileName).replace('.mp4', ''),
          ),
        )
      } else {
        dispatch(setBackgroundBgaName(''))
      }
    } else {
      dispatch(setBackgroundBgaName(''))
    }
  }, [projectRaUploadedPageData])

  useEffect(() => {
    if (!backgroundBgaName && projectRaUploadedPageData) {
      if (projectRaUploadedPageData.songData) {
        dispatch(
          setBackgroundBgaName(
            'resources/music' +
              String(projectRaUploadedPageData.songData.bgaPreviewFileName).replace('.mp4', ''),
          ),
        )
      }
    }
  }, [backgroundBgaName])

  const { recentHistory, isLoadingRecentHistory, errorRecentHistory, fetchRecentHistory } =
    useRecentHistory()
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)

  // 컴포넌트가 마운트될 때 데이터 불러오기
  useEffect(() => {
    // 컴포넌트 마운트 시 업로드 상태 초기화
    dispatch(setIsUploading(false))
    dispatch(setUploadedDataProcessed(true))

    fetchRecentHistory()
  }, [])

  return (
    <React.Fragment>
      <Head>
        <title>기록 등록 - RACLA</title>
      </Head>
      {userData.userToken !== '' ? (
        <div
          className={`tw-flex tw-gap-4 tw-relative`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragging && (
            // ... existing code ...
            <div className='tw-fixed tw-inset-0 tw-bg-gray-950 tw-bg-opacity-70 tw-flex tw-flex-col tw-gap-4 tw-items-center tw-justify-center tw-transition-all tw-border-2 tw-border-dashed tw-border-gray-400 tw-border-opacity-75 tw-rounded-md tw-z-[9999]'>
              <IconContext.Provider value={{ size: '36', className: 'tw-animate-pulse' }}>
                <FaCloudArrowUp />
              </IconContext.Provider>
              <div className='tw-text-xl tw-font-bold tw-text-white tw-animate-pulse'>
                리절트(결과) 화면의 이미지를 업로드해주세요.
              </div>
              <div className='tw-text-base tw-text-white tw-animate-pulse'>
                PLATiNA :: LAB는 싱글 플레이 결과 창을 지원합니다.
              </div>
            </div>
            // ... existing code ...
          )}
          <div
            className={`tw-flex tw-w-full tw-h-[calc(100vh-112px)] tw-relative tw-animate-fadeInLeft tw-transition-all tw-flex-col`}
          >
            {selectedGame === 'platina_lab' &&
            projectRaUploadedPageData !== null &&
            projectRaUploadedPageData.gameCode == 'platina_lab' &&
            !isUploading ? (
              <>
                {projectRaUploadedPageData.songData !== undefined ? (
                  <>
                    <div
                      className={
                        'tw-flex tw-relative tw-flex-col tw-gap-1 tw-bg-opacity-10 tw-rounded-md tw-mb-4 tw-h-auto p-0'
                      }
                    >
                      <div className='tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md'>
                        <Image
                          src={`https://cdn.racla.app/${selectedGame}/jackets/cropped/${String(projectRaUploadedPageData.songData.title)}.jpg`}
                          layout='fill'
                          objectFit='cover'
                          alt=''
                          className='tw-opacity-50 tw-blur-xl'
                        />
                        <div className='tw-absolute tw-inset-0 tw-bg-gray-500 tw-bg-opacity-25' />
                      </div>
                      <div className='tw-flex tw-flex-col tw-animate-fadeInLeft flex-equal tw-bg-gray-900 tw-bg-opacity-30 tw-rounded-md p-4'>
                        {/* 하단 */}
                        <div className='tw-flex tw-justify-between'>
                          <div className='tw-flex tw-gap-3 tw-mt-auto tw-items-end'>
                            <RaScorePopupComponent
                              gameCode={selectedGame}
                              songItemTitle={projectRaUploadedPageData.songData.title}
                              keyMode={keyMode}
                              judgementType={projectRaUploadedPageData.judgementType}
                            />
                            <div className='tw-flex tw-flex-col tw-w-full'>
                              {/* 제목 */}
                              <span className='tw-flex tw-font-light tw-text-gray-300'>
                                {projectRaUploadedPageData.songData.artist +
                                  ' / ' +
                                  (projectRaUploadedPageData.songData.bpm ==
                                  projectRaUploadedPageData.songData.bpmLow
                                    ? projectRaUploadedPageData.songData.bpm + ' BPM'
                                    : projectRaUploadedPageData.songData.bpmLow +
                                      '~' +
                                      projectRaUploadedPageData.songData.bpm +
                                      ' BPM')}
                              </span>
                              <div className='tw-flex'>
                                <span className='tw-text-lg tw-font-bold me-auto'>
                                  {projectRaUploadedPageData.songData.name}
                                  <sup className='tw-text-xs tw-font-light tw-text-gray-300'>
                                    {' '}
                                    (RACLA : {projectRaUploadedPageData.songData.title}
                                    {projectRaUploadedPageData.songData.officialCode &&
                                      ` / Official
                                      Code : ${projectRaUploadedPageData.songData.officialCode}`}
                                    )
                                  </sup>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className='tw-flex tw-gap-2'>
                              {String(projectRaUploadedPageData.songData.officialCode).trim() !==
                                '' &&
                                String(projectRaUploadedPageData.songData.officialCode).trim() !==
                                  'null' && (
                                  <button
                                    className='tw-inline-flex tw-items-center tw-gap-2 tw-animate-fadeInLeft tw-bg-gray-950 tw-bg-opacity-75 tw-rounded-md hover:tw-bg-gray-700 tw-transition-colors tw-text-sm p-1 px-2'
                                    onClick={() =>
                                      window.ipc.openBrowser(
                                        `https://platinalab.net/ranking/${projectRaUploadedPageData.songData.officialCode}`,
                                      )
                                    }
                                  >
                                    <FaRankingStar className='tw-text-red-gray-300' />
                                    <span className='tw-text-gray-300'>랭킹(공식 홈페이지)</span>
                                  </button>
                                )}
                              <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-950 tw-bg-opacity-75 p-1'>
                                <span className='platina_lab_dlc_code_wrap'>
                                  <span
                                    className={`platina_lab_dlc_code platina_lab_dlc_code_${projectRaUploadedPageData.songData.dlcCode}`}
                                  >
                                    {projectRaUploadedPageData.songData.dlc}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-gap-2 tw-mb-4 p-4'>
                      <div className='tw-flex tw-justify-between tw-items-center'>
                        <div className='tw-flex tw-flex-col tw-gap-2'>
                          <span className='tw-text-base tw-font-light'>BUTTON</span>
                          <span className='tw-font-extrabold tw-text-4xl'>
                            {projectRaUploadedPageData.button}B
                            {projectRaUploadedPageData.judgementType == 1 ? '+' : ''}
                          </span>
                        </div>
                        <div className='tw-flex tw-flex-col tw-gap-2'>
                          <span className='tw-text-base tw-font-light'>DIFFICULTY</span>
                          <span className='tw-font-extrabold tw-text-4xl'>
                            {codeToPatternName(patternToCode(projectRaUploadedPageData.pattern))}{' '}
                            Lv.
                            {projectRaUploadedPageData.songData.patterns[
                              `${projectRaUploadedPageData.button}B`
                            ][projectRaPattern]?.level.toFixed(0)}
                          </span>
                        </div>
                        {projectRaUploadedPageData.lastScore ? (
                          <div className='tw-flex tw-flex-col tw-gap-2'>
                            <span className='tw-text-base tw-font-light'>
                              {parseFloat(String(projectRaUploadedPageData.lastScore)) >=
                              parseFloat(String(projectRaUploadedPageData.score))
                                ? 'BEST'
                                : 'LAST'}{' '}
                              SCORE
                            </span>
                            <span className='tw-font-extrabold tw-text-4xl'>
                              {projectRaUploadedPageData.lastScore
                                ? Number(projectRaUploadedPageData.lastScore).toFixed(2)
                                : '00.00'}
                              %
                            </span>
                          </div>
                        ) : null}
                        <div className='tw-flex tw-flex-col tw-gap-2'>
                          <span className='tw-text-base tw-font-light'>
                            {projectRaUploadedPageData.lastScore ? 'CURRENT SCORE' : 'BEST SCORE'}
                          </span>
                          <div className='tw-flex tw-items-start tw-gap-2'>
                            <span className='tw-font-extrabold tw-text-4xl'>
                              {projectRaUploadedPageData.score
                                ? Number(projectRaUploadedPageData.score).toFixed(2)
                                : '00.00'}
                              %
                            </span>
                            {projectRaUploadedPageData?.max &&
                              projectRaUploadedPageData.score == 100 && (
                                <span className='tw-text-lg tw-font-light tw-text-yellow-400'>
                                  {projectRaUploadedPageData.max == 0
                                    ? 'MAX'
                                    : 'MAX-' + projectRaUploadedPageData.max}
                                </span>
                              )}
                            {projectRaUploadedPageData.lastScore && (
                              <span
                                className={`tw-flex tw-items-center tw-gap-1 tw-text-lg ${
                                  parseFloat(String(projectRaUploadedPageData.score)) >
                                  parseFloat(String(projectRaUploadedPageData.lastScore))
                                    ? 'tw-text-red-500'
                                    : parseFloat(String(projectRaUploadedPageData.score)) <
                                        parseFloat(String(projectRaUploadedPageData.lastScore))
                                      ? 'tw-text-blue-500'
                                      : 'tw-text-gray-500'
                                }`}
                              >
                                {parseFloat(String(projectRaUploadedPageData.score)) >
                                parseFloat(String(projectRaUploadedPageData.lastScore)) ? (
                                  <>
                                    <IconContext.Provider
                                      value={{ size: '12', className: 'tw-inline tw-mt-0.5' }}
                                    >
                                      <FiTriangle />
                                    </IconContext.Provider>
                                    {(
                                      parseFloat(String(projectRaUploadedPageData.score)) -
                                      parseFloat(String(projectRaUploadedPageData.lastScore))
                                    ).toFixed(2)}
                                    %
                                  </>
                                ) : parseFloat(String(projectRaUploadedPageData.score)) <
                                  parseFloat(String(projectRaUploadedPageData.lastScore)) ? (
                                  <>
                                    <IconContext.Provider
                                      value={{
                                        size: '12',
                                        className: 'tw-inline tw-rotate-180 tw-mt-0.5',
                                      }}
                                    >
                                      <FiTriangle />
                                    </IconContext.Provider>
                                    {(
                                      parseFloat(String(projectRaUploadedPageData.lastScore)) -
                                      parseFloat(String(projectRaUploadedPageData.score))
                                    ).toFixed(2)}
                                    %
                                  </>
                                ) : (
                                  '±0.00%'
                                )}
                              </span>
                            )}
                            <span className='tw-text-lg tw-font-light tw-text-yellow-400'>
                              {projectRaUploadedPageData.maxCombo == 1 &&
                              projectRaUploadedPageData.score != 100
                                ? 'MAX COMBO'
                                : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='tw-flex tw-gap-4 tw-w-full tw-flex-1 tw-overflow-hidden'>
                      {/* 최근 기록 섹션 */}
                      <div className='tw-flex tw-flex-col tw-w-1/2 tw-relative tw-animate-fadeInLeft tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-gap-2 p-4'>
                        <div className='tw-flex tw-w-full tw-mb-2 tw-items-center tw-justify-between'>
                          <span className='tw-text-lg tw-font-bold me-auto'>최근 기록</span>
                        </div>

                        <div className='tw-flex tw-flex-col tw-gap-2 tw-overflow-y-auto'>
                          {recentHistory.map((history) => (
                            <div
                              key={history.historyId}
                              className='tw-flex tw-items-center tw-gap-3 tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-3 hover:tw-bg-opacity-40 tw-transition-all'
                            >
                              <div className='tw-relative hover:tw-scale-110 tw-transition-transform'>
                                <RaScorePopupComponent
                                  gameCode={selectedGame}
                                  songItemTitle={history.songId.toString()}
                                  keyMode={history.keyType.replace('B', '')}
                                  judgementType={history.judgementType}
                                  rivalName=''
                                  delay={{ show: 500, hide: 0 }}
                                  size={54}
                                />
                              </div>

                              <div className='tw-flex tw-flex-col tw-gap-2 tw-flex-1'>
                                <div className='tw-flex tw-items-center tw-gap-2 tw-justify-between'>
                                  <span className='tw-font-bold'>{history.songName}</span>
                                  <div className='tw-flex tw-items-center tw-gap-2'>
                                    <div
                                      className={`tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded-md tw-bg-gray-900 tw-bg-opacity-75 tw-min-w-12 tw-text-center tw-justify-center`}
                                    >
                                      <span className='tw-text-sm'>
                                        {history.keyType}
                                        {String(history.judgementType) == 'HARD' ? '+' : ''}
                                      </span>
                                    </div>
                                    <div
                                      className={`tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded-md tw-bg-gray-900 tw-bg-opacity-75 tw-min-w-20 tw-text-center tw-justify-center`}
                                    >
                                      <span className='tw-text-sm'>
                                        {codeToPatternName(patternToCode(history.difficultyType))}
                                      </span>
                                      <span className='tw-text-sm'>
                                        Lv.{history.level.toFixed(0)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className='tw-flex tw-items-center tw-gap-2'>
                                  <span className='tw-font-bold'>
                                    {history.score.toFixed(2)}%
                                    {history.maxCombo && (
                                      <span className='tw-text-yellow-400 tw-font-light'>
                                        {' '}
                                        (MAX COMBO)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 추천 옵션 섹션 */}
                      <div className='tw-flex tw-flex-col tw-w-1/2 tw-relative tw-animate-fadeInRight tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-gap-2 p-4'>
                        <div className='tw-flex tw-w-full tw-mb-2 tw-items-center'>
                          <span className='tw-text-lg tw-font-bold me-auto'>팁 & 추천 옵션</span>
                        </div>

                        <div className='tw-flex tw-flex-col flex-equal tw-justify-center tw-items-center tw-text-base'>
                          <span>
                            통계 데이터가 충분하지 않아 팁 & 추천 옵션을 제공할 수 없습니다.
                          </span>
                          <span>더 많은 사용자의 플레이 데이터가 수집될 때까지 기다려주세요.</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            ) : isUploading ? (
              <div className='tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft tw-h-full tw-justify-center tw-items-center tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md'>
                <SyncLoader color='#ffffff' size={8} />
              </div>
            ) : (
              !isDragging && (
                <div className='tw-absolute tw-inset-0 tw-bg-gray-950 tw-bg-opacity-25 tw-z-50 tw-flex tw-flex-col tw-gap-4 tw-items-center tw-justify-center tw-transition-all tw-border-2 tw-border-dashed tw-border-gray-400 tw-border-opacity-75 tw-rounded-md'>
                  <IconContext.Provider value={{ size: '36', className: 'tw-animate-pulse' }}>
                    <FaCloudArrowUp />
                  </IconContext.Provider>
                  <div className='tw-text-xl tw-font-bold tw-text-white tw-animate-pulse'>
                    리절트(결과) 화면의 이미지를 업로드해주세요.
                  </div>
                  <div className='tw-text-base tw-text-white tw-animate-pulse'>
                    PLATiNA :: LAB는 싱글 플레이 결과 창을 지원합니다.
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
    </React.Fragment>
  )
}
