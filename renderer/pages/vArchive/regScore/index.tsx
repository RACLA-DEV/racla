import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearVArchiveData,
  setBackupData,
  setCollectionData,
  setIsUploading,
  setUploadedDataProcessed,
  setVArchivePattern,
  setVArchiveUploadedPageData,
} from 'store/slices/appSlice'

import ScorePopupComponent from '@/components/score/popup/ScorePopupDjmax'
import { useNotificationSystem } from '@hooks/useNotifications'
import { useRecentHistory } from '@hooks/useRecentHistory'
import { logRendererError } from '@utils/rendererLoggerUtils'
import axios from 'axios'
import dayjs from 'dayjs'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { IconContext } from 'react-icons'
import { FaCloudArrowUp } from 'react-icons/fa6'
import { FiTriangle } from 'react-icons/fi'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'
import { setBackgroundBgaName } from 'store/slices/uiSlice'

export default function VArchiveRegScorePage() {
  const { showNotification } = useNotificationSystem()
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)
  const dispatch = useDispatch()
  const { userData, songData, settingData, isUploadedDataProcessed, backupData, vArchiveUserData } =
    useSelector((state: RootState) => state.app)
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)
  const { vArchiveData } = useSelector((state: RootState) => state.app)

  const [keyMode] = useState<string>('4')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [songItemData, setSongItemData] = useState<any>(null)

  const [screenShotFile, setScreenShotFile] = useState<any>(null)
  const isUploading = useSelector((state: RootState) => state.app.isUploading)

  const [isCanRollback, setIsCanRollback] = useState<boolean>(false)

  const [isDragging, setIsDragging] = useState<boolean>(false)

  const [versusBackupData, setVersusBackupData] = useState<any[]>([])

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
        window.ipc.send('screenshot-upload', { buffer: buffer, gameCode: 'djmax_respect_v' })
      }
      reader.readAsArrayBuffer(screenShotFile)
      showNotification(
        '성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.',
        'tw-bg-blue-600',
      )
      dispatch(setIsUploading(true))
    }
  }

  const { vArchiveUploadedPageData, vArchivePattern, collectionData } = useSelector(
    (state: RootState) => state.app,
  )

  useEffect(() => {
    if (vArchiveData && !isUploadedDataProcessed) {
      dispatch(setVArchiveUploadedPageData(vArchiveData))

      if (vArchiveData.screenType === 'versus') {
        // versus 데이터 처리
        const processVersusData = async () => {
          const backupDataArray = []
          for (const playerData of vArchiveData.versusData) {
            if (playerData.score > 0) {
              try {
                const backupResponse = await axios.get(
                  `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/title/${playerData.songData.title}`,
                )
                backupDataArray.push(backupResponse.data)

                const response = await axios.post(
                  `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/open/${vArchiveUserData.userNo}/score`,
                  {
                    name: playerData.songData.name,
                    composer: playerData.songData.composer,
                    button: Number(playerData.button),
                    pattern: codeToPattern(playerData.pattern),
                    score: parseFloat(String(playerData.score)),
                    maxCombo: Number(playerData.maxCombo),
                  },
                  {
                    headers: {
                      Authorization: `${vArchiveUserData.userToken}`,
                      'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                  },
                )

                if (response.data.success && response.data.update) {
                  showNotification(
                    `${playerData.songData.name} 곡의 성과 기록을 V-ARCHIVE에 정상적으로 갱신하였습니다.`,
                    'tw-bg-lime-600',
                  )
                  setIsCanRollback(true)
                } else if (response.data.success && !response.data.update) {
                  showNotification(
                    `${playerData.songData.name} 곡은 기존의 성과 기록과 동일하거나 더 좋은 성과 기록이 존재하여 갱신되지 않았습니다.`,
                    'tw-bg-orange-600',
                  )
                }
              } catch (error) {
                logRendererError(error, { message: 'Error in processVersusData', ...userData })
                backupDataArray.push(null)
                showNotification(
                  `${playerData.songData.name} 곡의 성과 기록 갱신 중 오류가 발생했습니다.`,
                  'tw-bg-red-600',
                )
              }
            }
          }
          setVersusBackupData(backupDataArray)
        }

        processVersusData()
      } else if (vArchiveData.screenType == 'collection') {
        const processCollectionData = async () => {
          const backupDataArray = []
          // 초기 컬렉션 데이터 설정
          let updatedCollectionData = []

          for (const playerData of vArchiveData.collectionData) {
            if (playerData.score > 0) {
              try {
                const backupResponse = await axios.get(
                  `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/title/${playerData.songData.title}`,
                )
                backupDataArray.push(backupResponse.data)

                const response = await axios.post(
                  `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/open/${vArchiveUserData.userNo}/score`,
                  {
                    name: playerData.songData.name,
                    composer: playerData.songData.composer,
                    button: Number(playerData.button),
                    pattern: codeToPattern(playerData.pattern),
                    score: parseFloat(String(playerData.score)),
                    maxCombo: Number(playerData.maxCombo),
                  },
                  {
                    headers: {
                      Authorization: `${vArchiveUserData.userToken}`,
                      'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                  },
                )

                if (response.data.success && response.data.update) {
                  showNotification(
                    `${playerData.songData.name} 곡의 성과 기록을 V-ARCHIVE에 정상적으로 갱신하였습니다.`,
                    'tw-bg-lime-600',
                  )
                  setIsCanRollback(true)
                  updatedCollectionData.push({ ...playerData, status: 'success' })
                } else if (response.data.success && !response.data.update) {
                  showNotification(
                    `${playerData.songData.name} 곡은 기존의 성과 기록과 동일하거나 더 좋은 성과 기록이 존재하여 갱신되지 않았습니다.`,
                    'tw-bg-orange-600',
                  )
                  updatedCollectionData.push({ ...playerData, status: 'noUpdate' })
                }
              } catch (error) {
                logRendererError(error, { message: 'Error in processCollectionData', ...userData })
                backupDataArray.push(null)
                showNotification(
                  `${playerData.songData.name} 곡의 성과 기록 갱신 중 오류가 발생했습니다.`,
                  'tw-bg-red-600',
                )
                updatedCollectionData.push({ ...playerData, status: 'error' })
              }
            }
          }

          // 모든 처리가 끝난 후 한 번에 컬렉션 데이터 업데이트
          dispatch(setCollectionData(updatedCollectionData))
          setVersusBackupData(backupDataArray)
        }

        processCollectionData()
      } else {
        // 기존 단일 플레이어 데이터 처리
        if (vArchiveData.pattern) {
          let newPattern = 'NM'
          switch (vArchiveData.pattern) {
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
            default:
              newPattern = 'NM'
          }
          dispatch(setVArchivePattern(newPattern))
        }

        if (!vArchiveData.isVerified && vArchiveData.error) {
          showNotification(
            '마지막으로 업로드한 성과 기록 이미지의 데이터 유효성 검증에 실패하였습니다. 다시 캡쳐한 후 재시도해주세요.',
            'tw-bg-red-600',
          )
        } else if (vArchiveData.isVerified) {
          showNotification(
            '성과 기록 이미지의 데이터 유효성 검증에 성공하였습니다. V-ARCHIVE, RACLA 서비스로 점수 갱신을 요청합니다.',
            'tw-bg-lime-600',
          )
          fetchUpdateScore(vArchiveData)
          fetchRecentHistory()
        }
      }

      dispatch(setUploadedDataProcessed(true))
      dispatch(setIsUploading(false))
      dispatch(clearVArchiveData())
    }
  }, [vArchiveData, isUploadedDataProcessed])

  useEffect(() => {
    if (vArchiveUploadedPageData) {
      setVArchiveUploadedPageData(vArchiveUploadedPageData)
    }
    if (vArchivePattern) {
      setVArchivePattern(vArchivePattern)
    }
  }, [])

  const router = useRouter()

  useEffect(() => {
    if (vArchiveUserData.userName === '') {
      router.push('/')
      showNotification('기록 등록은 로그인 또는 V-ARCHIVE 계정 연동이 필요합니다.', 'tw-bg-red-600')
    }
  }, [userData])

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
    }
  }

  const codeToPattern = (code: string) => {
    switch (code) {
      case 'SC':
        return 'SC'
      case 'MX':
        return 'MAXIMUM'
      case 'HD':
        return 'HARD'
      case 'NM':
        return 'NORMAL'
      default:
        return code
    }
  }

  const fetchUpdateScore = async (data) => {
    try {
      const backupResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/title/${data.songData.title}`,
      )
      dispatch(setBackupData(backupResponse.data))

      if (data.score > 0) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/open/${vArchiveUserData.userNo}/score`,
          {
            name: data.songData.name,
            composer: data.songData.composer,
            button: Number(data.button),
            pattern: codeToPattern(data.pattern),
            score: parseFloat(String(data.score)),
            maxCombo: Number(data.maxCombo),
          },
          {
            headers: {
              Authorization: `${vArchiveUserData.userToken}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          },
        )

        if (data.filePath) {
          showNotification(
            `${data.filePath} 경로에 성과 기록 이미지가 저장되었습니다.`,
            'tw-bg-lime-600',
          )
        }

        if (response.data.success && response.data.update) {
          showNotification('성과 기록을 V-ARCHIVE에 정상적으로 갱신하였습니다.', 'tw-bg-lime-600')
          setIsCanRollback(true)

          setTimeout(async () => {
            try {
              // 갱신된 곡 데이터 다시 조회
              const updatedSongResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/title/${data.songData.title}`,
              )

              const newRating =
                updatedSongResponse.data?.patterns?.[`${data.button}B`]?.[data.pattern]?.rating || 0

              // 모든 보드 타입에 대한 데이터 가져오기
              const boards = [
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
                '10',
                '11',
                'MX',
                'SC',
                'SC5',
                'SC10',
                'SC15',
              ]
              const allBoardResponses = await Promise.all(
                boards.map(async (boardType) => {
                  try {
                    const response = await axios.get(
                      `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${vArchiveUserData.userName}/board/${data.button}/${boardType}`,
                    )
                    return (
                      response.data.floors?.flatMap((floor) =>
                        floor.patterns.map((pattern) => ({
                          ...pattern,
                          floor: floor.floorNumber,
                        })),
                      ) || []
                    )
                  } catch (error) {
                    logRendererError(error, { message: 'Error in fetchUpdateScore', ...userData })
                    console.error(`Error fetching ${boardType}:`, error)
                    return []
                  }
                }),
              )

              // 모든 패턴을 하나의 배열로 합치고 중복 제거
              const allPatterns = allBoardResponses.flat()
              const uniquePatterns = Object.values(
                allPatterns.reduce((acc, pattern) => {
                  const key = `${pattern.title}_${pattern.pattern}`
                  if (!acc[key] || (pattern.rating && pattern.rating > (acc[key].rating || 0))) {
                    acc[key] = pattern
                  }
                  return acc
                }, {}),
              )

              // rating 기준으로 정렬하고 TOP50 확인
              const sortedPatterns = uniquePatterns.sort(
                (a: any, b: any) => (b.rating || 0) - (a.rating || 0),
              )
              const top50Cutoff = (sortedPatterns[49] as any)?.rating || 0
              const top49Rating = (sortedPatterns[48] as any)?.rating || 0

              if (newRating > top50Cutoff) {
                showNotification(
                  `${data.songData.name} 곡의 성과로 TOP50이 ${top50Cutoff}TP에서 ${top49Rating}TP로 갱신하였습니다.`,
                  'tw-bg-yellow-700',
                )
                window.ipc.send('top50-updated', {
                  title: data.songData.title,
                  name: data.songData.name,
                  previousCutoff: top50Cutoff,
                  currentCutoff: top49Rating,
                })
              }
            } catch (error) {
              logRendererError(error, { message: 'Error checking TOP50', ...userData })
              console.error('Error checking TOP50:', error)
            }
          }, 1000)
        } else if (response.data.success && !response.data.update) {
          showNotification(
            '기존의 성과 기록과 동일하거나 더 좋은 성과 기록이 존재하여 V-ARCHIVE에 갱신되지 않았습니다.',
            'tw-bg-orange-600',
          )
          setIsCanRollback(false)
        }
      } else {
        showNotification(
          '성과 기록 점수가 0점으로 인식되어 점수 갱신 요청이 취소되었습니다.',
          'tw-bg-red-600',
        )
        setIsCanRollback(false)
      }
    } catch (error) {
      if (error.status == 404) {
        logRendererError(error, { message: 'Error in fetchUpdateScore', ...userData })
        console.error('Error fetching data:', error)
        showNotification(
          '해당 수록곡은 V-ARCHIVE 데이터베이스에 등록되지 않아 점수 갱신을 요청할 수 없습니다. 잠시 후 다시 시도해주세요.',
          'tw-bg-red-600',
        )
        setIsCanRollback(false)
      } else {
        logRendererError(error, { message: 'Error in fetchUpdateScore', ...userData })
        console.error('Error fetching data:', error)
        showNotification(
          '알 수 없는 오류가 발생하여 성과 기록 갱신에 실패하였습니다. 다시 시도해주시길 바랍니다.',
          'tw-bg-red-600',
        )
        setIsCanRollback(false)
      }
    }
  }

  const handleRollback = async () => {
    if (vArchiveUploadedPageData.songData.title === backupData.title) {
      try {
        const response = await axios
          .post(
            `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/userRecord`,
            {
              button: Number(vArchiveUploadedPageData.button),
              pattern: vArchivePattern,
              force: true,
              maxCombo: Number(
                backupData.patterns[`${vArchiveUploadedPageData.button}B`][vArchivePattern]
                  .maxCombo,
              ),
              score: parseFloat(
                String(
                  backupData.patterns[`${vArchiveUploadedPageData.button}B`][vArchivePattern].score,
                ),
              ),
              title: vArchiveUploadedPageData.songData.title,
            },
            {
              method: 'POST',
              headers: {
                Authorization: `${vArchiveUserData.userNo}|${vArchiveUserData.userToken}`,
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            },
          )
          .then((data) => {
            if (data.data.success) {
              setBackupData(null)
              dispatch(setVArchiveUploadedPageData(null))
              setIsCanRollback(false)
              showNotification('성과 기록을 정상적으로 롤백하였습니다.', 'tw-bg-lime-600')
            }
          })
          .catch((error) => {
            logRendererError(error, { message: 'Error in handleRollback', ...userData })
            showNotification(
              '알 수 없는 오류가 발생하여 성과 기록 롤백에 실패하였습니다. 다시 시도해주시길 바랍니다.',
              'tw-bg-red-600',
            )
          })
      } catch (error) {
        logRendererError(error, { message: 'Error in handleRollback', ...userData })
        console.error('Error fetching data:', error)
      }
    } else {
      showNotification(
        '알 수 없는 오류가 발생하여 성과 기록 롤백에 실패하였습니다. 다시 시도해주시길 바랍니다.',
        'tw-bg-red-600',
      )
    }
  }

  // vArchiveUploadedPageData 변경 감지하여 배경 BGA 설정
  useEffect(() => {
    if (vArchiveUploadedPageData) {
      if (vArchiveUploadedPageData.screenType === 'versus') {
        // versus 모드일 때는 첫 번째 곡의 배경 사용
        if (
          vArchiveUploadedPageData.versusData &&
          vArchiveUploadedPageData.versusData[0]?.songData
        ) {
          dispatch(setBackgroundBgaName(vArchiveUploadedPageData.versusData[0].songData.title))
        } else {
          dispatch(setBackgroundBgaName(''))
        }
      } else {
        // 기존 단일 플레이어 모드
        if (vArchiveUploadedPageData.songData) {
          dispatch(setBackgroundBgaName(vArchiveUploadedPageData.songData.title))
        } else {
          dispatch(setBackgroundBgaName(''))
        }
      }
    } else {
      dispatch(setBackgroundBgaName(''))
    }
  }, [vArchiveUploadedPageData])

  const { recentHistory, isLoadingRecentHistory, errorRecentHistory, fetchRecentHistory } =
    useRecentHistory()

  // 컴포넌트가 마운트될 때 데이터 불러오기
  useEffect(() => {
    fetchRecentHistory()
  }, [])

  return (
    <React.Fragment>
      <Head>
        <title>기록 등록 - RACLA</title>
      </Head>
      {vArchiveUserData.userName !== '' ? (
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
                DJMAX RESPECT V는 프리스타일 곡 선택, 프리스타일 결과, 오픈 매치 곡 선택, 오픈 매치
                결과, 래더/버서스 매치 결과, 컬렉션 창을 지원합니다.
              </div>
            </div>
            // ... existing code ...
          )}
          <div
            className={`tw-flex tw-w-full tw-h-[calc(100vh-112px)] tw-relative tw-animate-fadeInLeft tw-transition-all ${
              vArchiveUploadedPageData !== null && vArchiveUploadedPageData.screenType === 'versus'
                ? ''
                : 'tw-flex-col'
            }`}
          >
            {vArchiveUploadedPageData !== null &&
            vArchiveUploadedPageData.gameCode == 'djmax_respect_v' &&
            !isUploading ? (
              <>
                {vArchiveUploadedPageData.screenType === 'versus' ? (
                  // versus 화면 렌더링

                  <div className='tw-flex tw-h-full tw-w-full tw-gap-4'>
                    {vArchiveUploadedPageData.versusData.map((playerData, index) => (
                      <div
                        className='tw-flex tw-flex-col tw-gap-4 tw-flex-1'
                        key={`versusDataList_${index}`}
                      >
                        <div
                          key={index}
                          className={
                            'tw-flex tw-relative tw-flex-col tw-gap-1 tw-bg-opacity-10 tw-rounded-md tw-h-60 p-0'
                          }
                        >
                          <div className='tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md'>
                            <Image
                              src={`https://cdn.racla.app/djmax_respect_v/jackets/${String(playerData.songData.title)}.jpg`}
                              layout='fill'
                              objectFit='cover'
                              alt=''
                              className='tw-opacity-50 tw-blur-xl'
                            />
                            <div className='tw-absolute tw-inset-0 tw-bg-gray-500 tw-bg-opacity-25' />
                          </div>
                          <div className='tw-flex tw-flex-col tw-animate-fadeInLeft flex-equal tw-bg-gray-900 tw-bg-opacity-30 tw-rounded-md p-4'>
                            {/* 상단 정보 */}
                            <div className='tw-flex tw-flex-col tw-gap-2'>
                              <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-950 tw-bg-opacity-75 tw-h-8 tw-flex tw-items-center tw-me-auto p-1'>
                                <span className='respect_dlc_code_wrap'>
                                  <span
                                    className={`respect_dlc_code respect_dlc_code_${playerData.songData.dlcCode}`}
                                  >
                                    {playerData.songData.dlc}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* 하단 정보 */}
                            <div className='tw-flex tw-gap-3 tw-mt-auto tw-items-end'>
                              <ScorePopupComponent
                                songItemTitle={playerData.songData.title}
                                keyMode={playerData.button}
                              />
                              <div className='tw-flex tw-flex-col tw-w-full'>
                                <span className='tw-flex tw-font-light tw-text-gray-300'>
                                  {playerData.songData.composer}
                                </span>
                                <div className='tw-flex'>
                                  <span className='tw-text-lg tw-font-bold me-auto'>
                                    {playerData.songData.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className='tw-flex tw-flex-col tw-w-full tw-flex-1 tw-relative tw-animate-fadeInLeft tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-gap-2 p-4'>
                          <div className='tw-flex tw-flex-col tw-gap-4 tw-items-center tw-justify-center tw-h-12 tw-text-xl tw-font-bold'>
                            {index + 1 === vArchiveUploadedPageData.versusData.length
                              ? 'FINAL ROUND'
                              : `ROUND ${index + 1}`}
                          </div>
                          <div className='tw-flex tw-flex-col tw-gap-16 tw-items-center tw-justify-center tw-flex-1'>
                            <div className='tw-flex tw-flex-col tw-gap-16 tw-items-center tw-justify-center tw-flex-1'>
                              <div className='tw-flex tw-flex-col tw-gap-2'>
                                <span className='tw-text-base tw-font-light tw-text-center'>
                                  PLAYED SCORE
                                </span>
                                <div className='tw-flex tw-flex-col tw-items-center tw-gap-4'>
                                  <span className='tw-font-extrabold tw-text-4xl'>
                                    {playerData.score
                                      ? String(playerData.score).includes('.')
                                        ? String(playerData.score).split('.')[1].length === 1
                                          ? String(playerData.score) + '0'
                                          : playerData.score
                                        : playerData.score + '.00'
                                      : '00.00'}
                                    %
                                  </span>
                                  {versusBackupData[index] && (
                                    <span
                                      className={`tw-flex tw-items-center tw-gap-1 tw-text-lg ${
                                        parseFloat(String(playerData.score)) >
                                        parseFloat(
                                          String(
                                            versusBackupData[index].patterns[
                                              `${playerData.button}B`
                                            ][patternToCode(playerData.pattern)]?.score,
                                          ),
                                        )
                                          ? 'tw-text-red-500'
                                          : parseFloat(String(playerData.score)) <
                                              parseFloat(
                                                String(
                                                  versusBackupData[index].patterns[
                                                    `${playerData.button}B`
                                                  ][patternToCode(playerData.pattern)]?.score,
                                                ),
                                              )
                                            ? 'tw-text-blue-500'
                                            : 'tw-text-gray-500'
                                      }`}
                                    >
                                      {parseFloat(String(playerData.score)) >
                                      parseFloat(
                                        String(
                                          versusBackupData[index].patterns[`${playerData.button}B`][
                                            patternToCode(playerData.pattern)
                                          ]?.score,
                                        ),
                                      ) ? (
                                        <>
                                          <IconContext.Provider
                                            value={{ size: '12', className: 'tw-inline tw-mt-0.5' }}
                                          >
                                            <FiTriangle />
                                          </IconContext.Provider>
                                          {(
                                            parseFloat(String(playerData.score)) -
                                            parseFloat(
                                              String(
                                                versusBackupData[index].patterns[
                                                  `${playerData.button}B`
                                                ][patternToCode(playerData.pattern)]?.score,
                                              ),
                                            )
                                          ).toFixed(2)}
                                          %
                                        </>
                                      ) : parseFloat(String(playerData.score)) <
                                        parseFloat(
                                          String(
                                            versusBackupData[index].patterns[
                                              `${playerData.button}B`
                                            ][patternToCode(playerData.pattern)]?.score,
                                          ),
                                        ) ? (
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
                                            parseFloat(
                                              String(
                                                versusBackupData[index].patterns[
                                                  `${playerData.button}B`
                                                ][patternToCode(playerData.pattern)]?.score,
                                              ),
                                            ) - parseFloat(String(playerData.score))
                                          ).toFixed(2)}
                                          %
                                        </>
                                      ) : (
                                        '±0.00'
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className='tw-flex tw-gap-2 tw-justify-center'>
                            <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-500 tw-bg-opacity-25 tw-flex tw-items-center tw-gap-2 p-1 px-3'>
                              <span
                                className={
                                  'tw-text-base text-stroke-100 tw-font-extrabold tw-text-gray-50'
                                }
                              >
                                {playerData.button}B
                              </span>
                            </div>
                            <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-500 tw-bg-opacity-25 tw-flex tw-items-center tw-gap-2 p-1 px-3'>
                              <span
                                className={
                                  playerData.songData.patterns[`${playerData.button}B`][
                                    patternToCode(playerData.pattern)
                                  ]?.level <= 5
                                    ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                      (patternToCode(playerData.pattern) === 'SC'
                                        ? ' tw-text-respect-sc-5'
                                        : ' tw-text-respect-nm-5')
                                    : playerData.songData.patterns[`${playerData.button}B`][
                                          patternToCode(playerData.pattern)
                                        ]?.level <= 10
                                      ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                        (patternToCode(playerData.pattern) === 'SC'
                                          ? ' tw-text-respect-sc-10'
                                          : ' tw-text-respect-nm-10')
                                      : 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                        (patternToCode(playerData.pattern) === 'SC'
                                          ? ' tw-text-respect-sc-15'
                                          : ' tw-text-respect-nm-15')
                                }
                              >
                                {playerData.pattern}
                              </span>
                            </div>
                            <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-500 tw-bg-opacity-25 tw-flex tw-items-center tw-gap-2 p-1 px-3'>
                              <div>
                                <Image
                                  loading='lazy' // "lazy" | "eager"
                                  src={
                                    playerData.songData.patterns[`${playerData.button}B`][
                                      patternToCode(playerData.pattern)
                                    ]?.level <= 5
                                      ? `https://cdn.racla.app/djmax_respect_v/${patternToCode(playerData.pattern) === 'SC' ? 'sc' : 'nm'}_5_star.png`
                                      : playerData.songData.patterns[`${playerData.button}B`][
                                            patternToCode(playerData.pattern)
                                          ]?.level <= 10
                                        ? `https://cdn.racla.app/djmax_respect_v/${patternToCode(playerData.pattern) === 'SC' ? 'sc' : 'nm'}_10_star.png`
                                        : `https://cdn.racla.app/djmax_respect_v/${patternToCode(playerData.pattern) === 'SC' ? 'sc' : 'nm'}_15_star.png`
                                  }
                                  height={14}
                                  width={14}
                                  alt=''
                                />
                              </div>
                              <span
                                className={
                                  playerData.songData.patterns[`${playerData.button}B`][
                                    patternToCode(playerData.pattern)
                                  ]?.level <= 5
                                    ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                      (patternToCode(playerData.pattern) === 'SC'
                                        ? ' tw-text-respect-sc-5'
                                        : ' tw-text-respect-nm-5')
                                    : playerData.songData.patterns[`${playerData.button}B`][
                                          patternToCode(playerData.pattern)
                                        ]?.level <= 10
                                      ? 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                        (patternToCode(playerData.pattern) === 'SC'
                                          ? ' tw-text-respect-sc-10'
                                          : ' tw-text-respect-nm-10')
                                      : 'tw-text-base text-stroke-100 tw-font-extrabold ' +
                                        (patternToCode(playerData.pattern) === 'SC'
                                          ? ' tw-text-respect-sc-15'
                                          : ' tw-text-respect-nm-15')
                                }
                              >
                                {
                                  playerData.songData.patterns[`${playerData.button}B`][
                                    patternToCode(playerData.pattern)
                                  ]?.level
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : // 기존 단일 플레이어 화면 렌더링
                vArchiveUploadedPageData.songData !== undefined ? (
                  <>
                    <div
                      className={
                        'tw-flex tw-relative tw-flex-col tw-gap-1 tw-bg-opacity-10 tw-rounded-md tw-mb-4 tw-h-auto p-0'
                      }
                    >
                      <div className='tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md'>
                        <Image
                          src={`https://cdn.racla.app/djmax_respect_v/jackets/${String(vArchiveUploadedPageData.songData.title)}.jpg`}
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
                            <ScorePopupComponent
                              songItemTitle={vArchiveUploadedPageData.songData.title}
                              keyMode={keyMode}
                            />
                            <div className='tw-flex tw-flex-col tw-w-full'>
                              {/* 제목 */}
                              <span className='tw-flex tw-font-light tw-text-gray-300'>
                                {vArchiveUploadedPageData.songData.composer}
                              </span>
                              <div className='tw-flex'>
                                <span className='tw-text-lg tw-font-bold me-auto'>
                                  {vArchiveUploadedPageData.songData.name}
                                  <sup className='tw-text-xs tw-font-light tw-text-gray-300'>
                                    {' '}
                                    (V-ARCHIVE : {vArchiveUploadedPageData.songData.title} / RACLA :{' '}
                                    {vArchiveUploadedPageData.songData.title})
                                  </sup>
                                </span>
                                {/* {isCanRollback && backupData.patterns[`${vArchiveUploadedPageData.button}B`]?.[pattern]?.score && (
                                  <button
                                    type="button"
                                    disabled={
                                      !(backupData && vArchiveUploadedPageData && vArchiveUploadedPageData.songData) ||
                                      backupData.title !== vArchiveUploadedPageData.songData.title ||
                                      !backupData.patterns[`${vArchiveUploadedPageData.button}B`][pattern].score ||
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
                                )} */}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className='tw-flex tw-gap-2'>
                              {/* <div className="tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950 tw-bg-opacity-75 px-3 tw-flex tw-items-center tw-gap-2">
                                <span className={'tw-text-sm text-stroke-100 tw-font-extrabold tw-text-gray-50'}>{vArchiveUploadedPageData.button}B</span>
                              </div>
                              <div className="tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950 tw-bg-opacity-75 px-3 tw-flex tw-items-center tw-gap-2">
                                <span
                                  className={
                                    vArchiveUploadedPageData.songData.patterns[`${vArchiveUploadedPageData.button}B`][pattern].level <= 5
                                      ? 'tw-text-sm text-stroke-100 tw-font-extrabold ' + (pattern === 'SC' ? ' tw-text-respect-sc-5' : ' tw-text-respect-nm-5')
                                      : vArchiveUploadedPageData.songData.patterns[`${vArchiveUploadedPageData.button}B`][pattern].level <= 10
                                      ? 'tw-text-sm text-stroke-100 tw-font-extrabold ' +
                                        (pattern === 'SC' ? ' tw-text-respect-sc-10' : ' tw-text-respect-nm-10')
                                      : 'tw-text-sm text-stroke-100 tw-font-extrabold ' +
                                        (pattern === 'SC' ? ' tw-text-respect-sc-15' : ' tw-text-respect-nm-15')
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
                                      vArchiveUploadedPageData.songData.patterns[`${vArchiveUploadedPageData.button}B`][pattern].level <= 5
                                        ? `https://cdn.racla.app/djmax_respect_v/${pattern === 'SC' ? 'sc' : 'nm'}_5_star.png`
                                        : vArchiveUploadedPageData.songData.patterns[`${vArchiveUploadedPageData.button}B`][pattern].level <= 10
                                        ? `https://cdn.racla.app/djmax_respect_v/${pattern === 'SC' ? 'sc' : 'nm'}_10_star.png`
                                        : `https://cdn.racla.app/djmax_respect_v/${pattern === 'SC' ? 'sc' : 'nm'}_15_star.png`
                                    }
                                    height={14}
                                    width={14}
                                    alt=""
                                  />
                                </div>
                                <span
                                  className={
                                    vArchiveUploadedPageData.songData.patterns[`${vArchiveUploadedPageData.button}B`][pattern].level <= 5
                                      ? 'tw-flex tw-items-center tw-text-sm text-stroke-100 tw-font-extrabold ' +
                                        (pattern === 'SC' ? ' tw-text-respect-sc-5' : ' tw-text-respect-nm-5')
                                      : vArchiveUploadedPageData.songData.patterns[`${vArchiveUploadedPageData.button}B`][pattern].level <= 10
                                      ? 'tw-flex tw-items-center tw-text-sm text-stroke-100 tw-font-extrabold ' +
                                        (pattern === 'SC' ? ' tw-text-respect-sc-10' : ' tw-text-respect-nm-10')
                                      : 'tw-flex tw-items-center tw-text-sm text-stroke-100 tw-font-extrabold ' +
                                        (pattern === 'SC' ? ' tw-text-respect-sc-15' : ' tw-text-respect-nm-15')
                                  }
                                >
                                  {vArchiveUploadedPageData.songData.patterns[`${vArchiveUploadedPageData.button}B`][pattern].level}
                                </span>
                              </div> */}
                              <div className='tw-animate-fadeInLeft tw-rounded-md tw-bg-gray-950 tw-bg-opacity-75 p-1'>
                                <span className='respect_dlc_code_wrap'>
                                  <span
                                    className={`respect_dlc_code respect_dlc_code_${vArchiveUploadedPageData.songData.dlcCode}`}
                                  >
                                    {vArchiveUploadedPageData.songData.dlc}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {vArchiveUploadedPageData.screenType != 'collection' && (
                      <div className='tw-flex tw-flex-col tw-w-full tw-relative tw-animate-fadeInLeft tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-gap-2 tw-mb-4 p-4'>
                        <div className='tw-flex tw-justify-between tw-items-center'>
                          <div className='tw-flex tw-flex-col tw-gap-2'>
                            <span className='tw-text-base tw-font-light'>BUTTON</span>
                            <span className='tw-font-extrabold tw-text-4xl'>
                              {vArchiveUploadedPageData.button}B
                            </span>
                          </div>
                          <div className='tw-flex tw-flex-col tw-gap-2'>
                            <span className='tw-text-base tw-font-light'>DIFFICULTY</span>
                            <span className='tw-font-extrabold tw-text-4xl'>
                              {patternToCode(vArchiveUploadedPageData.pattern)}{' '}
                              {
                                vArchiveUploadedPageData.songData.patterns[
                                  `${vArchiveUploadedPageData.button}B`
                                ][vArchivePattern]?.level
                              }
                            </span>
                          </div>
                          {backupData &&
                          vArchiveUploadedPageData &&
                          vArchiveUploadedPageData.songData &&
                          backupData.title === vArchiveUploadedPageData.songData.title &&
                          backupData ? (
                            <div className='tw-flex tw-flex-col tw-gap-2'>
                              <span className='tw-text-base tw-font-light'>
                                {parseFloat(
                                  String(
                                    backupData.patterns[`${vArchiveUploadedPageData.button}B`][
                                      vArchivePattern
                                    ].score,
                                  ),
                                ) >= parseFloat(String(vArchiveUploadedPageData.score))
                                  ? 'BEST'
                                  : 'LAST'}{' '}
                                SCORE
                              </span>
                              <span className='tw-font-extrabold tw-text-4xl'>
                                {backupData.patterns[`${vArchiveUploadedPageData.button}B`][
                                  vArchivePattern
                                ].score
                                  ? backupData.patterns[`${vArchiveUploadedPageData.button}B`][
                                      vArchivePattern
                                    ].score
                                  : '00.00'}
                                %
                              </span>
                            </div>
                          ) : null}
                          <div className='tw-flex tw-flex-col tw-gap-2'>
                            <span className='tw-text-base tw-font-light'>
                              {backupData ? 'CURRENT SCORE' : 'LAST PLAYED SCORE'}
                            </span>
                            <div className='tw-flex tw-items-start tw-gap-2'>
                              <span className='tw-font-extrabold tw-text-4xl'>
                                {String(vArchiveUploadedPageData.score).includes('.')
                                  ? String(vArchiveUploadedPageData.score).split('.')[1].length ===
                                    1
                                    ? String(vArchiveUploadedPageData.score) + '0'
                                    : vArchiveUploadedPageData.score
                                  : vArchiveUploadedPageData.score + '.00'}
                                %
                              </span>
                              {backupData &&
                                vArchiveUploadedPageData &&
                                vArchiveUploadedPageData.songData &&
                                backupData.title === vArchiveUploadedPageData.songData.title && (
                                  <span
                                    className={`tw-flex tw-items-center tw-gap-1 tw-text-lg ${
                                      parseFloat(String(vArchiveUploadedPageData.score)) >
                                      parseFloat(
                                        String(
                                          backupData.patterns[
                                            `${vArchiveUploadedPageData.button}B`
                                          ][vArchivePattern].score,
                                        ),
                                      )
                                        ? 'tw-text-red-500'
                                        : parseFloat(String(vArchiveUploadedPageData.score)) <
                                            parseFloat(
                                              String(
                                                backupData.patterns[
                                                  `${vArchiveUploadedPageData.button}B`
                                                ][vArchivePattern].score,
                                              ),
                                            )
                                          ? 'tw-text-blue-500'
                                          : 'tw-text-gray-500'
                                    }`}
                                  >
                                    {parseFloat(String(vArchiveUploadedPageData.score)) >
                                    parseFloat(
                                      String(
                                        backupData.patterns[`${vArchiveUploadedPageData.button}B`][
                                          vArchivePattern
                                        ].score,
                                      ),
                                    ) ? (
                                      <>
                                        <IconContext.Provider
                                          value={{ size: '12', className: 'tw-inline tw-mt-0.5' }}
                                        >
                                          <FiTriangle />
                                        </IconContext.Provider>
                                        {(
                                          parseFloat(String(vArchiveUploadedPageData.score)) -
                                          parseFloat(
                                            String(
                                              backupData.patterns[
                                                `${vArchiveUploadedPageData.button}B`
                                              ][vArchivePattern].score,
                                            ),
                                          )
                                        ).toFixed(2)}
                                        %
                                      </>
                                    ) : parseFloat(String(vArchiveUploadedPageData.score)) <
                                      parseFloat(
                                        String(
                                          backupData.patterns[
                                            `${vArchiveUploadedPageData.button}B`
                                          ][vArchivePattern].score,
                                        ),
                                      ) ? (
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
                                          parseFloat(
                                            String(
                                              backupData.patterns[
                                                `${vArchiveUploadedPageData.button}B`
                                              ][vArchivePattern].score,
                                            ),
                                          ) - parseFloat(String(vArchiveUploadedPageData.score))
                                        ).toFixed(2)}
                                        %
                                      </>
                                    ) : (
                                      '±0.00%'
                                    )}
                                  </span>
                                )}
                              <span className='tw-text-lg tw-font-light tw-text-yellow-400'>
                                {vArchiveUploadedPageData.maxCombo == 1 ? 'MAX COMBO' : ''}
                              </span>
                            </div>
                          </div>
                          {/* <div className="tw-rounded-md tw-flex tw-gap-2">
                          <div className="tw-relative" style={{ width: 70, height: 70 }}>
                            <Image
                              loading="lazy" // "lazy" | "eager"
                              blurDataURL={globalDictionary.blurDataURL}
                              src={`https://cdn.racla.app/djmax_respect_v/effectors/SPEED_BG.png`}
                              width={70}
                              height={70}
                              alt=""
                              className="tw-shadow-sm tw-absolute"
                            />
                            <div className="tw-absolute tw-flex tw-justify-center tw-items-center tw-bottom-0" style={{ width: 70, height: 60 }}>
                              <span className="tw-font-extrabold tw-text-3xl">
                                {String(vArchiveUploadedPageData.speed).length === 1 ? String(vArchiveUploadedPageData.speed) + '.0' : String(vArchiveUploadedPageData.speed)}
                              </span>
                            </div>
                          </div>
                          {vArchiveUploadedPageData.note !== null ? (
                            <Image
                              loading="lazy" // "lazy" | "eager"
                              blurDataURL={globalDictionary.blurDataURL}
                              src={`https://cdn.racla.app/djmax_respect_v/effectors/${vArchiveUploadedPageData.note}.png`}
                              width={70}
                              height={70}
                              alt=""
                            />
                          ) : (
                            <div className="tw-bg-gray-950 tw-bg-opacity-30 tw-shadow-sm tw-rounded-lg" style={{ width: 70, height: 70 }} />
                          )}
                          {vArchiveUploadedPageData.fader !== null ? (
                            <Image
                              loading="lazy" // "lazy" | "eager"
                              blurDataURL={globalDictionary.blurDataURL}
                              src={`https://cdn.racla.app/djmax_respect_v/effectors/${vArchiveUploadedPageData.fader}.png`}
                              width={70}
                              height={70}
                              alt=""
                            />
                          ) : (
                            <div className="tw-bg-gray-950 tw-bg-opacity-30 tw-shadow-sm tw-rounded-lg" style={{ width: 70, height: 70 }} />
                          )}
                          {vArchiveUploadedPageData.chaos !== null ? (
                            <Image
                              loading="lazy" // "lazy" | "eager"
                              blurDataURL={globalDictionary.blurDataURL}
                              src={`https://cdn.racla.app/djmax_respect_v/effectors/${vArchiveUploadedPageData.chaos}.png`}
                              width={70}
                              height={70}
                              alt=""
                            />
                          ) : (
                            <div className="tw-bg-gray-950 tw-bg-opacity-30 tw-shadow-sm tw-rounded-lg" style={{ width: 70, height: 70 }} />
                          )}
                        </div> */}
                        </div>
                      </div>
                    )}

                    <div className='tw-flex tw-gap-4 tw-w-full tw-flex-1 tw-overflow-hidden'>
                      {vArchiveUploadedPageData.screenType == 'collection' && (
                        <div className='tw-flex tw-flex-col tw-w-1/2 tw-relative tw-animate-fadeInLeft tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-gap-2 p-4'>
                          <div className='tw-flex tw-w-full tw-mb-2 tw-items-center tw-justify-between'>
                            <span className='tw-text-lg tw-font-bold me-auto'>
                              컬렉션 처리 결과
                            </span>
                            <span className='tw-text-sm tw-text-gray-400'>
                              *V-ARCHIVE 기록 대비 낮은 점수는 갱신되지 않습니다.
                            </span>
                          </div>

                          <div className='tw-w-full tw-h-full tw-overflow-hidden tw-rounded-md tw-text-center'>
                            {/* 헤더 - 키 모드 */}
                            <div className='tw-h-12 tw-grid tw-grid-cols-5 tw-auto-rows-fr tw-gap-4 tw-pb-0 tw-mb-4'>
                              <span className='tw-border-gray-600 tw-border-opacity-25 tw-flex tw-flex-col tw-justify-center tw-items-center tw-overflow-hidden tw-bg-gray-900 tw-bg-opacity-0 tw-rounded-lg tw-text-base tw-font-bold'>
                                {' '}
                              </span>
                              {['4B', '5B', '6B', '8B'].map((button) => (
                                <div
                                  key={button}
                                  className='tw-border-gray-600 tw-border-opacity-25 tw-flex tw-flex-col tw-justify-center tw-items-center tw-overflow-hidden tw-bg-gray-900 tw-bg-opacity-20 tw-rounded-lg'
                                >
                                  <div className='tw-relative tw-h-full tw-w-full tw-flex-1'>
                                    <Image
                                      loading='lazy'
                                      src={`https://cdn.racla.app/djmax_respect_v/${button}-BG.png`}
                                      alt=''
                                      fill
                                      className='tw-absolute tw-rounded-lg tw-object-cover'
                                    />
                                    <div className='tw-absolute tw-inset-0 tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-lg tw-backdrop-blur-md' />
                                    <div
                                      className={`tw-absolute tw-inset-0 respect_db_button respect_bg_b${button.replace('B', '')} tw-rounded-lg`}
                                    />
                                    <span className='tw-absolute tw-inset-0 tw-font-extrabold tw-text-4xl tw-flex tw-items-center tw-justify-center'>
                                      <span className='tw-text-base tw-font-bold'>{button}</span>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 난이도별 점수 그리드 */}
                            <div className='tw-grid tw-grid-rows-4 tw-grid-cols-5 tw-gap-4 tw-h-[calc(100%-64px)]'>
                              {['NM', 'HD', 'MX', 'SC'].map((difficulty) => (
                                <React.Fragment key={difficulty}>
                                  {/* 난이도 라벨 */}
                                  <div
                                    className={`tw-border-gray-600 tw-text-bold tw-text-base tw-border-opacity-25 tw-flex tw-flex-col tw-justify-center tw-items-center tw-overflow-hidden tw-bg-gray-500 tw-bg-opacity-25 tw-rounded-lg tw-font-bold ${
                                      difficulty === 'SC'
                                        ? 'tw-text-respect-sc-15'
                                        : difficulty === 'MX'
                                          ? 'tw-text-respect-nm-15'
                                          : difficulty === 'HD'
                                            ? 'tw-text-respect-nm-10'
                                            : 'tw-text-respect-nm-5'
                                    }`}
                                  >
                                    {difficulty}
                                  </div>

                                  {/* 각 키 모드별 점수 */}
                                  {['4B', '5B', '6B', '8B'].map((button) => {
                                    const matchingScore = collectionData.find(
                                      (item) =>
                                        item.button + 'B' === button && item.pattern === difficulty,
                                    )

                                    return (
                                      <div
                                        key={`${difficulty}_${button}`}
                                        className='tw-border-gray-600 tw-border-opacity-25 tw-flex tw-flex-col tw-justify-center tw-items-center tw-p-2 tw-bg-gray-700 tw-bg-opacity-20 tw-rounded-lg'
                                      >
                                        {matchingScore ? (
                                          <div className='tw-flex tw-items-center tw-justify-center tw-gap-1 tw-w-full tw-flex-col'>
                                            <span className={`tw-font-semibold tw-text-base`}>
                                              {matchingScore.score == 100
                                                ? '100.00'
                                                : matchingScore.score.toFixed(2)}
                                            </span>
                                            <span className='tw-text-yellow-500 tw-text-xs'>
                                              {matchingScore.maxCombo ? 'MAX' : ''}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className='tw-text-gray-500 tw-text-sm'>-</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 최근 기록 섹션 */}
                      <div className='tw-flex tw-flex-col tw-w-1/2 tw-relative tw-animate-fadeInLeft tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-gap-2 p-4'>
                        <div className='tw-flex tw-w-full tw-mb-2 tw-items-center tw-justify-between'>
                          <span className='tw-text-lg tw-font-bold me-auto'>최근 기록</span>
                          <span className='tw-text-sm tw-text-gray-400'>*RACLA 기록</span>
                        </div>

                        <div className='tw-flex tw-flex-col tw-gap-2 tw-overflow-y-auto'>
                          {recentHistory.map((history) => (
                            <React.Fragment key={history.historyId}>
                              <div className='tw-flex tw-items-center tw-gap-3 tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-3 hover:tw-bg-opacity-40 tw-transition-all'>
                                <div className='tw-relative hover:tw-scale-110 tw-transition-transform'>
                                  <ScorePopupComponent
                                    songItemTitle={history.songId.toString()}
                                    keyMode={history.keyType.replace('B', '')}
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
                                        className={`tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded-md tw-bg-gray-900 tw-bg-opacity-75 tw-min-w-12 tw-justify-center`}
                                      >
                                        <span className='tw-text-sm'>{history.keyType}</span>
                                      </div>
                                      <div
                                        className={`tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded-md tw-bg-gray-900 tw-bg-opacity-75 tw-min-w-12 tw-justify-center`}
                                      >
                                        <span className='tw-text-sm'>{history.difficultyType}</span>
                                        <span className='tw-text-sm'>{history.level}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className='tw-flex tw-items-center tw-justify-between tw-gap-2'>
                                    <span className='tw-font-bold'>
                                      {history.score.toFixed(2)}%
                                      {history.maxCombo && (
                                        <span className='tw-text-yellow-400 tw-font-light'>
                                          {' '}
                                          (MAX COMBO)
                                        </span>
                                      )}{' '}
                                    </span>
                                    <span className='tw-font-light tw-text-gray-400'>
                                      {dayjs(history.playedAt).format('YYYY-MM-DD HH:mm:ss')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* 추천 옵션 섹션 */}
                      {vArchiveUploadedPageData.screenType != 'collection' && (
                        <div className='tw-flex tw-flex-col tw-w-1/2 tw-relative tw-animate-fadeInRight tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md tw-gap-2 p-4'>
                          <div className='tw-flex tw-w-full tw-mb-2 tw-items-center'>
                            <span className='tw-text-lg tw-font-bold me-auto'>팁 & 추천 옵션</span>
                          </div>

                          <div className='tw-flex tw-flex-col flex-equal tw-justify-center tw-items-center tw-text-base'>
                            <span>
                              통계 데이터가 충분하지 않아 팁 & 추천 옵션을 제공할 수 없습니다.
                            </span>
                            <span>
                              더 많은 사용자의 플레이 데이터가 수집될 때까지 기다려주세요.
                            </span>
                          </div>
                        </div>
                      )}
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
                    DJMAX RESPECT V는 프리스타일 곡 선택, 프리스타일 결과, 오픈 매치 곡 선택, 오픈
                    매치 결과, 래더/버서스 매치 결과, 컬렉션 창을 지원합니다.
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
