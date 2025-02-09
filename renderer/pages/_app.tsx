import 'bootstrap/dist/css/bootstrap.min.css'
import 'styles/globals.css'

import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  setCollectionData,
  setIsDetectedGame,
  setIsMiniMode,
  setIsUploading,
  setProjectRaData,
  setSelectedGame,
  setSettingData,
  setSongData,
  setUploadedDataProcessed,
  setUserData,
  setVArchiveData,
  setVArchiveUserData,
  setWjmaxSongData,
} from 'store/slices/appSlice'
import { addNotification, removeNotification } from 'store/slices/notificationSlice'
import { setFontFamily, setIsDjCommentOpen } from 'store/slices/uiSlice'

import BackgroundVideoComponent from '@/components/background/BackgroundVideo'
import ImageViewerComponent from '@/components/common/ImageViewer'
import HomePanelComponent from '@/components/common/ImportantModal'
import NotificationComponent from '@/components/common/NotificationModal'
import SettingComponent from '@/components/common/SettingModal'
import FooterComponent from '@/components/layout/footer/Footer'
import HeaderComponent from '@/components/layout/header/Header'
import SidebarComponent from '@/components/layout/sidebar/Sidebar'
import { IUserNameResponse } from '@/types/IUserName'
import { logRendererError } from '@utils/rendererLoggerUtils'
import axios from 'axios'
import type { AppProps } from 'next/app'
import localFont from 'next/font/local'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { Provider } from 'react-redux'
import { SyncLoader } from 'react-spinners'
import { store } from 'store'
import { v4 as uuidv4 } from 'uuid'

// prettier-ignore

// import { setIsDetectedGame, setSettingData, setUserData, setUploadedData, setVArchiveSongData } from 'store/slices/appSlice'

const noto = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
})

function MyApp({ Component, pageProps }: AppProps) {
  const { asPath } = useRouter()

  const [detectedGame, setDetectedGame] = useState<boolean>(false)
  const [detectedGameName, setDetectedGameName] = useState<string>('')

  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const [userNo, setUserNo] = useState<string>('')
  const [userToken, setUserToken] = useState<string>('')
  const [vArchiveUserNo, setVArchiveUserNo] = useState<string>('')
  const [vArchiveUserToken, setVArchiveUserToken] = useState<string>('')
  const [vArchiveUserName, setVArchiveUserName] = useState<string>('')
  const [discordUid, setDiscordUid] = useState<string>('')
  const [settingDataApp, setSettingDataApp] = useState<any>(null)

  useEffect(() => {
    // Bootstrap 로드
    require('bootstrap/dist/js/bootstrap.bundle.min.js')

    // 설정 데이터 요청
    setTimeout(() => {
      window.ipc.send('getSettingData')
    }, 3000)

    const handleGameDetection = ({ status: data, game }) => {
      store.dispatch(setIsDetectedGame(data))
      setDetectedGameName(game)
      setDetectedGame(data)
    }

    const handleSettingData = (data: any) => {
      store.dispatch(setSettingData(data))
      store.dispatch(setIsMiniMode(data.isMiniMode))
      setSettingDataApp(data)

      if (isLoading) {
        // 애니메이션 설정 적용
        if (!data.visibleAnimation) {
          document.documentElement.classList.add('no-animation')
        } else {
          document.documentElement.classList.remove('no-animation')
        }

        window.ipc.send('PROGRAM_LOADED')

        // 세션 데이터 요청
        const fetchSessionData = () => {
          window.ipc.getSession()
          console.log('Session Requested.')
        }

        fetchSessionData()
        setIsLoading(false)
      }
    }

    const handleSessionData = (data: any) => {
      if (data.userNo !== '' && data.userToken !== '') {
        setUserNo(data.userNo)
        setUserToken(data.userToken)
      }
    }

    const handleNotification = (data: any) => {
      showNotification(data.message, data.color)
    }

    const handleResultScreen = (data: string) => {
      showNotification(
        'DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.',
        'tw-bg-blue-600',
      )
    }

    // 이벤트 리스너 등록
    window.ipc.on('isDetectedGame', handleGameDetection)
    window.ipc.on('IPC_RENDERER_GET_SETTING_DATA', handleSettingData)
    window.ipc.on('IPC_RENDERER_GET_SESSION', handleSessionData)
    window.ipc.on('pushNotification', handleNotification)
    window.ipc.on('isDetectedResultScreen', handleResultScreen)

    // 클린업 함수
    return () => {
      window.ipc.removeListener('isDetectedGame', handleGameDetection)
      window.ipc.removeListener('IPC_RENDERER_GET_SETTING_DATA', handleSettingData)
      window.ipc.removeListener('IPC_RENDERER_GET_SESSION', handleSessionData)
      window.ipc.removeListener('pushNotification', handleNotification)
      window.ipc.removeListener('isDetectedResultScreen', handleResultScreen)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      showNotification(
        detectedGame
          ? detectedGameName +
              '(게임)의 실행이 감지되어 게임 모드(배경 BGA 표시 비활성화)가 활성화 되었습니다.'
          : '게임 종료가 감지되어 게임 모드(배경 BGA 표시 비활성화)가 비활성화 되었습니다.',
        'tw-bg-blue-600',
      )
    }
  }, [detectedGame])

  const [isLoading, setIsLoading] = useState(true)

  const showNotification = useCallback((message: string, color?: string) => {
    const notificationId = uuidv4()
    store.dispatch(
      addNotification({
        id: notificationId,
        message,
        color,
        createdAt: Date.now(),
        isRemoving: false,
      }),
    )

    // 10초 후 제거 애니메이션 시작
    setTimeout(() => {
      const element = document.getElementById(`notification-${notificationId}`)
      if (element) {
        element.classList.remove('tw-animate-fadeInSlideRight')
        element.classList.add('tw-animate-fadeOutSlideRight')

        // 애니메이션 완료 후 실제 제거
        setTimeout(() => {
          store.dispatch(removeNotification(notificationId))
        }, 500)
      }
    }, 10000)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 서버에서 이미 처리된 곡 데이터 가져오기
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_OPEN_API_URL}/songs/processed/djmax_respect_v`,
        )

        if (data && data.length > 0) {
          // 데이터 저장
          window.ipc.putSongData(data, 'djmax_respect_v')
          store.dispatch(setSongData(data))
        }
        return data
      } catch (error) {
        console.error('Error fetching processed song data:', error)
        logRendererError(
          error,
          userNo != '' && userToken != ''
            ? { userNo, userToken, message: 'Error fetching processed song data' }
            : { message: 'Error fetching processed song data' },
        )
        throw error
      }
    }

    fetchData().catch((error) => {
      // 서버 요청 실패시 로컬 데이터 사용
      window.ipc.getSongData('djmax_respect_v')

      window.ipc.on('IPC_RENDERER_GET_SONG_DATA', (value: any) => {
        if (value.gameCode === 'djmax_respect_v') {
          if (store.getState().app.songData.length === 0) {
            store.dispatch(setSongData(value.songData))
          }
        }
      })
    })

    const fetchWjmaxData = async () => {
      try {
        // 서버에서 이미 처리된 곡 데이터 가져오기
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_OPEN_API_URL}/songs/wjmax`)

        if (data && data.length > 0) {
          // 데이터 저장
          window.ipc.putSongData(data, 'wjmax')
          store.dispatch(setWjmaxSongData(data))
        }
        return data
      } catch (error) {
        console.error('Error fetching processed song data:', error)
        logRendererError(
          error,
          userNo != '' && userToken != ''
            ? { userNo, userToken, message: 'Error fetching processed song data' }
            : { message: 'Error fetching processed song data' },
        )
        throw error
      }
    }

    fetchWjmaxData().catch(() => {
      // 서버 요청 실패시 로컬 데이터 사용
      window.ipc.getSongData('wjmax')

      window.ipc.on('IPC_RENDERER_GET_SONG_DATA', (value: any) => {
        if (value.gameCode === 'wjmax') {
          if (store.getState().app.wjmaxSongData.length === 0) {
            store.dispatch(setWjmaxSongData(value.songData))
          }
        }
      })
    })
  }, [])

  useEffect(() => {
    const handleScreenshotUploaded = (data: any) => {
      console.log(data)
      if (data.isVerified || data.screenType == 'versus' || data.screenType == 'collection') {
        if (data.gameCode == 'djmax_respect_v') {
          store.dispatch(setCollectionData([]))
          store.dispatch(setVArchiveData(data))
        } else {
          store.dispatch(setProjectRaData(data))
        }

        if (
          !router.asPath.includes(
            `/${data.gameCode === 'djmax_respect_v' ? 'vArchive' : 'projectRa/' + data.gameCode}/regScore`,
          )
        ) {
          setTimeout(() => {
            router.push(
              `/${data.gameCode === 'djmax_respect_v' ? 'vArchive' : 'projectRa/' + data.gameCode}/regScore`,
            )
          }, 300)
        }
      } else {
        store.dispatch(setVArchiveData(null))
        store.dispatch(setProjectRaData(null))
        store.dispatch(setIsUploading(false))
        store.dispatch(setUploadedDataProcessed(true))
        showNotification(
          '성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
          'tw-bg-red-600',
        )
      }
    }

    window.ipc.on('screenshot-uploaded', handleScreenshotUploaded)

    return () => {
      window.ipc.removeListener('screenshot-uploaded', handleScreenshotUploaded)
    }
  }, [])

  useEffect(() => {
    const handleLogined = (value) => {
      if (value !== undefined && Boolean(value)) {
        window.ipc.getSession()

        window.ipc.on('IPC_RENDERER_GET_SESSION', (data: any) => {
          if (data.userNo !== '' && data.userToken !== '') {
            setUserNo(data.userNo)
            setUserToken(data.userToken)
          }
          if (data.vArchiveUserNo !== '' && data.vArchiveUserToken !== '') {
            setVArchiveUserNo(data.vArchiveUserNo)
            setVArchiveUserToken(data.vArchiveUserToken)
            setVArchiveUserName(data.vArchiveUserName)
          }
          if (data.discordUid !== '') {
            setDiscordUid(data.discordUid)
          }
        })
      }
    }

    window.ipc.on('IPC_RENDERER_IS_LOGINED', (value) => {
      handleLogined(value)
    })

    // 메모리 누수 방지
    return () => {
      window.ipc.removeListener('IPC_RENDERER_IS_LOGINED', (value) => {
        handleLogined(value)
      })
    }
  }, [])

  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    if (
      router.pathname != '/' &&
      !router.pathname.includes('/license') &&
      !router.pathname.includes('/overlay') &&
      !router.pathname.includes('/bug')
    ) {
      if (params?.gameCode) {
        store.dispatch(setSelectedGame(params?.gameCode as string))
      } else {
        store.dispatch(setSelectedGame('djmax_respect_v'))
      }
    }
  }, [params, router])

  // 로그인 타입 정의
  type LoginType = 'vArchive' | 'normal' | 'discord'

  // 로그인 함수 분리
  const handleLogin = async (
    loginType: LoginType,
    credentials: { userNo: string; userToken: string },
  ) => {
    if (!credentials.userNo || !credentials.userToken) return

    try {
      // RACLA API 로그인
      const endpoint =
        loginType === 'vArchive'
          ? '/v1/user/login/oauth/vArchive'
          : loginType === 'discord'
            ? '/v1/user/login/oauth/discord'
            : '/v1/user/login'

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        credentials,
      )

      if (!response.data) {
        throw new Error('유효하지 않은 사용자 세션입니다.')
      }

      console.log(response.data)

      // 기본 사용자 데이터 저장
      showNotification(
        `${response.data.userName}님 RACLA에 오신 것을 환영합니다.`,
        'tw-bg-lime-600',
      )

      store.dispatch(
        setUserData({
          userName: response.data.userName,
          userNo: response.data.userNo,
          userToken: response.data.userToken,
          discordUid: response.data.discordUid,
          discordLinked: response.data.discordLinked || false,
          randomTitle: Math.floor(Math.random() * 652 + 1).toString(),
          vArchiveLinked: response.data.varchiveLinked || false,
        }),
      )

      if (response.data.discordLinked) {
        setDiscordUid(response.data.discordUid)
      }

      // V-ARCHIVE 연동 처리
      if (response.data.varchiveLinked) {
        const sessionData = {
          userNo: response.data.userNo,
          userToken: response.data.userToken,
          vArchiveUserNo: response.data.varchiveUserNo,
          vArchiveUserToken: response.data.varchiveUserToken,
        }

        window.ipc.send('storeSession', sessionData)

        const vArchiveResponse = await axios.post<IUserNameResponse>(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`,
          {
            userNo: response.data.varchiveUserNo,
            token: response.data.varchiveUserToken,
          },
        )

        if (vArchiveResponse.data.success) {
          store.dispatch(
            setVArchiveUserData({
              userNo: response.data.varchiveUserNo,
              userToken: response.data.varchiveUserToken,
              userName: vArchiveResponse.data.nickname,
            }),
          )

          showNotification(
            `V-ARCHIVE 계정(${vArchiveResponse.data.nickname}) 데이터 동기화에 성공 하였습니다.`,
            'tw-bg-lime-600',
          )

          window.ipc.send('storeSession', {
            ...sessionData,
            vArchiveUserName: vArchiveResponse.data.nickname,
          })
        } else {
          showNotification(
            'V-ARCHIVE 계정이 존재하지 않거나 통신 중 오류가 발생하였습니다. 연동 상태를 확인하시거나 잠시 후 다시 시도해주세요.',
            'tw-bg-yellow-600',
          )
        }

        window.ipc.setAuthorization({
          userNo: response.data.varchiveUserNo,
          userToken: response.data.varchiveUserToken,
        })
      } else {
        showNotification(
          'DJMAX RESPECT V 서비스를 이용하시려면 V-ARCHIVE 계정 연동이 필요합니다. 사이드바에 위치한 설정 -> 내 계정 탭에서 연동을 진행해주세요.',
          'tw-bg-amber-600',
        )
      }

      if (!response.data.discordLinked) {
        showNotification(
          'Discord 계정 연동이 되어 있지 않습니다. 사이드바에 위치한 설정 -> 내 계정 탭에서 연동을 진행해주세요.',
          'tw-bg-amber-600',
        )
      }

      window.ipc.send('logined', {
        userNo: response.data.userNo,
        userToken: response.data.userToken,
      })
    } catch (error) {
      logRendererError(error, { message: 'Error in handleLogin' })
      window.ipc.logout()
      if (loginType === 'vArchive') {
        setVArchiveUserNo('')
        setVArchiveUserToken('')
      } else {
        setUserNo('')
        setUserToken('')
      }
      showNotification(
        `알 수 없는 오류로 인해 사용자 정보 조회에 실패하였습니다. ${String(error)}`,
        'tw-bg-red-600',
      )
    }
  }

  // useEffect 통합
  useEffect(() => {
    if (vArchiveUserNo && vArchiveUserToken) {
      handleLogin('vArchive', {
        userNo: vArchiveUserNo,
        userToken: vArchiveUserToken,
      })
    }
  }, [vArchiveUserNo, vArchiveUserToken])

  useEffect(() => {
    if (userNo && userToken) {
      handleLogin('normal', {
        userNo: userNo,
        userToken: userToken,
      })
    }
  }, [userNo, userToken])

  useEffect(() => {
    if (router.pathname.includes('/overlay/widget')) {
      document.body.style.background = 'transparent'
      document.body.style.backgroundColor = 'transparent'
    } else {
      document.body.style.background = ''
      document.body.style.backgroundColor = ''
    }

    if (router.pathname.includes('wjmax')) {
      store.dispatch(setIsDjCommentOpen(false))
    }

    // 컴포넌트 언마운트 시 스타일 제거
    return () => {
      document.body.style.background = ''
      document.body.style.backgroundColor = ''
    }
  }, [router.pathname])

  // noto font 설정 후
  useEffect(() => {
    store.dispatch(setFontFamily(noto.className))
  }, [noto.className])

  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')

  useEffect(() => {
    // 외부 링크 열기 요청 수신
    window.ipc.on('confirm-external-link', (url: string) => {
      setExternalUrl(url)
      setShowExternalLinkModal(true)
    })

    return () => {
      // ... existing cleanup ...
      window.ipc.removeListener('confirm-external-link', () => {})
    }
  }, [])

  const handleExternalLink = () => {
    window.ipc.send('open-external-link', externalUrl)
    setShowExternalLinkModal(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 백드롭 영역만 클릭했을 때 닫히도록 함
    if (e.target === e.currentTarget) {
      setShowExternalLinkModal(false)
    }
  }

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExternalLinkModal) {
        setShowExternalLinkModal(false)
      }
    }

    // ESC 키 이벤트 리스너 등록
    window.addEventListener('keydown', handleEscKey)

    // 클린업
    return () => {
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [showExternalLinkModal])

  const [refreshKey, setRefreshKey] = useState(0)

  const noticeSection = (
    <div className='tw-flex tw-flex-col tw-gap-8'>
      <div className='tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-text-sm'>
        <div className='tw-flex tw-flex-col tw-gap-4 tw-w-full'>
          <div className='tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed'>
            <div className='tw-bg-yellow-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-yellow-500'>
              <span className='tw-font-bold'>
                전체 화면에서는 오버레이 기능이 올바르게 작동하지 않습니다.
              </span>
            </div>
            <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded'>
              <span>
                현재 오버레이 기능은 창 모드, 전체 창모드에서만 올바르게 작동합니다. 단 오버레이
                기능과 별개로 자동 캡쳐 모드는 창 모드, 전체 창모드, 전체 화면에서 900p 이상
                해상도에서 모두 정상적으로 작동하오니 착오가 없으시길 바랍니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-text-sm'>
        <div className='tw-flex tw-flex-col tw-gap-4 tw-w-full'>
          <div className='tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed'>
            <div className='tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500'>
              <span className='tw-font-bold'>
                macOS, Linux 사용자를 위한 데스크톱 앱이 제공될 예정입니다.
              </span>
            </div>
            <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded'>
              <span>
                Wine, GPTK, Proton, Whisky 등의 호환 플레이 도구를 사용하여 DJMAX RESPECT V, WJMAX
                등의 게임을 구동하는 사용자를 위한 자동 캡쳐 모드가 포함된 데스크톱 앱이 제공될
                예정입니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-text-sm'>
        <div className='tw-flex tw-flex-col tw-gap-4 tw-w-full'>
          <div className='tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed'>
            <div className='tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500'>
              <span className='tw-font-bold'>RACLA는 아래와 같은 사용자 데이터를 수집합니다.</span>
            </div>
            <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded'>
              <span>
                RACLA는 사용자에게 더 나은 서비스를 제공하기 위한 닉네임 정보, 플레이 데이터, 접속
                환경의 IP를 수집하고 있습니다. 사용자의 동의 없이 제3자에게 제공되지 않으며 계정 및
                데이터 삭제 요청은 개발자에게 문의바랍니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const updateSection = (
    <div className='tw-flex tw-flex-col tw-gap-4 tw-break-keep'>
      <div className='tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-text-sm'>
        <div className='tw-flex tw-flex-col tw-gap-4 tw-w-full'>
          <div className='tw-flex tw-flex-col tw-gap-6 tw-w-full tw-leading-relaxed'>
            {/* 첫 번째 설명 블록 */}
            {/* <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold tw-whitespace-pre-line">새로운 기능</span>
            </div> */}

            <Image
              src='https://ribbon.r-archive.zip/project_ra/update_070_banner.png'
              alt='overlay'
              className='tw-cursor-pointer tw-w-full tw-h-auto tw-rounded-lg'
              width={500}
              height={500}
              onClick={() =>
                setSelectedImage(
                  'https://ribbon.r-archive.zip/project_ra/update_070_banner.png?full=1',
                )
              }
              referrerPolicy='origin'
            />

            <Image
              src='https://ribbon.r-archive.zip/project_ra/update_070_menual.png'
              alt='overlay'
              className='tw-cursor-pointer tw-w-full tw-h-auto tw-rounded-lg'
              width={500}
              height={500}
              onClick={() =>
                setSelectedImage(
                  'https://ribbon.r-archive.zip/project_ra/update_070_menual.png?full=1',
                )
              }
              referrerPolicy='origin'
            />

            <Image
              src='https://ribbon.r-archive.zip/project_ra/update_070_content_1.png'
              alt='overlay'
              className='tw-cursor-pointer tw-w-full tw-h-auto tw-rounded-lg'
              width={500}
              height={500}
              onClick={() =>
                setSelectedImage(
                  'https://ribbon.r-archive.zip/project_ra/update_070_content_1.png?full=1',
                )
              }
              referrerPolicy='origin'
            />

            <Image
              src='https://ribbon.r-archive.zip/project_ra/update_070_content_2.png'
              alt='overlay'
              className='tw-cursor-pointer tw-w-full tw-h-auto tw-rounded-lg'
              width={500}
              height={500}
              onClick={() =>
                setSelectedImage(
                  'https://ribbon.r-archive.zip/project_ra/update_070_content_2.png?full=1',
                )
              }
              referrerPolicy='origin'
            />

            <Image
              src='https://ribbon.r-archive.zip/project_ra/update_070_content_3.png'
              alt='overlay'
              className='tw-cursor-pointer tw-w-full tw-h-auto tw-rounded-lg'
              width={500}
              height={500}
              onClick={() =>
                setSelectedImage(
                  'https://ribbon.r-archive.zip/project_ra/update_070_content_3.png?full=1',
                )
              }
              referrerPolicy='origin'
            />

            <Image
              src='https://ribbon.r-archive.zip/project_ra/update_070_feedback.png'
              alt='overlay'
              className='tw-cursor-pointer tw-w-full tw-h-auto tw-rounded-lg'
              width={500}
              height={500}
              onClick={() =>
                setSelectedImage(
                  'https://ribbon.r-archive.zip/project_ra/update_070_feedback.png?full=1',
                )
              }
              referrerPolicy='origin'
            />
          </div>
        </div>
      </div>
    </div>
  )

  const ServiceSection = () => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const webview = document.createElement('webview')
      webview.setAttribute('src', 'https://status.lunatica.kr')
      webview.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        overflow: hidden;
      `

      if (containerRef.current) {
        containerRef.current.appendChild(webview)
      }

      webview.addEventListener('dom-ready', () => {
        // 웹뷰 내부 스크롤바 제거를 위한 CSS 주입
        webview.insertCSS(`
          ::-webkit-scrollbar {
            width: 0px !important;
            display: none !important;
          }
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          body {
            overflow: -moz-scrollbars-none !important;
          }
        `)

        // ... existing event listeners ...
      })

      return () => {
        if (containerRef.current) {
          containerRef.current.removeChild(webview)
        }
      }
    }, [])

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      />
    )
  }

  const updateSections = [{ title: '0.7.0 업데이트', content: updateSection }]

  const [isBlurred, setIsBlurred] = useState(true)
  const [showLoader, setShowLoader] = useState(true)

  // isLoading 상태가 false로 변경될 때 순차적으로 전환
  useEffect(() => {
    if (!isLoading) {
      // 1. 먼저 로딩 화면을 페이드 아웃
      setTimeout(() => {
        setShowLoader(false)
      }, 1000)

      // 2. 로딩 화면이 사라진 후 블러 효과도 제거
      setTimeout(() => {
        setIsBlurred(false)
      }, 1000)
    }
  }, [isLoading])

  return (
    <Provider store={store}>
      {!router.pathname.includes('/overlay/widget') ? (
        <>
          {/* 블러 오버레이 */}
          <div
            className={`tw-fixed tw-inset-0 tw-bg-gray-950/50 tw-backdrop-blur-xl tw-transition-all tw-duration-700 tw-ease-out tw-z-[999999] ${
              isBlurred ? 'tw-opacity-100' : 'tw-opacity-0 tw-pointer-events-none'
            }`}
          />

          {/* 메인 앱 컨텐츠 */}
          {!isLoading && (
            <div className={`tw-w-full tw-transition-all tw-h-full ${noto.className}`}>
              <BackgroundVideoComponent />
              <main
                className='tw-pr-2 tw-mx-2 tw-text-sm tw-transition-all tw-overflow-x-hidden custom-scrollbar custom-scrollbar-always'
                style={{
                  marginLeft: settingDataApp.isMiniMode ? '4.25rem' : '14rem',
                  marginBottom: '3rem',
                  marginTop: '4rem',
                }}
                data-bs-theme='dark'
              >
                <AnimatePresence initial={false} mode='wait'>
                  <motion.div
                    key={asPath + refreshKey}
                    initial={{ x: 10, opacity: 0.5 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%' }}
                    className='tw-overflow-x-hidden'
                  >
                    <Component {...pageProps} setSelectedImage={setSelectedImage} />
                  </motion.div>
                </AnimatePresence>

                <HeaderComponent
                  refreshKeyHandle={setRefreshKey}
                  callback={() => {
                    setUserNo('')
                    setUserToken('')
                    setVArchiveUserNo('')
                    setVArchiveUserToken('')
                  }}
                />
                <SidebarComponent />
                <FooterComponent />
              </main>

              <HomePanelComponent
                noticeSection={noticeSection}
                updateSections={updateSections}
                serviceSection={<ServiceSection />}
              />

              {selectedImage && (
                <ImageViewerComponent src={selectedImage} onClose={() => setSelectedImage(null)} />
              )}

              {/* 외부 링크 확인 모달 */}
              <div
                className={`tw-fixed tw-inset-0 tw-z-[9999] tw-transition-opacity tw-duration-300 ${
                  showExternalLinkModal
                    ? 'tw-opacity-100 tw-pointer-events-auto'
                    : 'tw-opacity-0 tw-pointer-events-none'
                }`}
              >
                <div
                  className='tw-fixed tw-inset-0 tw-bg-gray-950 tw-bg-opacity-90'
                  onClick={handleBackdropClick}
                />
                <div className='tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center'>
                  <div
                    className={`tw-bg-gray-900 tw-p-6 tw-rounded-lg tw-shadow-lg tw-max-w-md tw-w-full tw-mx-4 tw-transition-all tw-duration-300 ${showExternalLinkModal ? 'tw-opacity-100 tw-translate-y-0' : 'tw-opacity-0 tw-translate-y-4'}`}
                  >
                    <h3 className='tw-text-lg tw-font-bold tw-mb-4 tw-text-center'>
                      외부 링크 열기
                    </h3>
                    <p className='tw-mb-6 tw-text-center tw-font-light tw-text-sm'>
                      이 링크는 사용자의 브라우저에서 열립니다.
                      <br />
                      신뢰할 수 있는 링크인지 확인 후 이동해주세요.
                    </p>
                    <div className='tw-mb-6 tw-h-20 tw-overflow-y-auto tw-bg-gray-800 tw-rounded tw-p-2'>
                      <p className='tw-text-blue-400 tw-break-all tw-text-sm'>{externalUrl}</p>
                    </div>
                    <div className='tw-flex tw-justify-end tw-gap-2'>
                      <button
                        className='tw-px-4 tw-py-1.5 tw-text-sm tw-bg-gray-800 tw-rounded hover:tw-bg-gray-700'
                        onClick={() => setShowExternalLinkModal(false)}
                      >
                        취소
                      </button>
                      <button
                        className='tw-px-4 tw-py-1.5 tw-text-sm tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700'
                        onClick={handleExternalLink}
                      >
                        열기
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <NotificationComponent />

              <SettingComponent />
            </div>
          )}

          {/* 로딩 화면 - 항상 렌더링되지만 opacity로 제어 */}
          <div
            className={`tw-fixed tw-inset-0 tw-flex tw-w-screen tw-h-screen tw-bg-gray-900 tw-bg-opacity-90 tw-flex-col tw-gap-10 tw-items-center tw-justify-center tw-transition-opacity tw-duration-1000 tw-z-[1000000] ${
              showLoader ? 'tw-opacity-100' : 'tw-opacity-0 tw-pointer-events-none'
            } ${noto.className}`}
          >
            <div className='tw-flex tw-w-full tw-h-full tw-relative'>
              <div className='tw-flex tw-flex-1 tw-items-center tw-justify-center'>
                <SyncLoader color='#ffffff' size={8} />
              </div>
              <div className='tw-flex tw-flex-col tw-gap-2 tw-w-full tw-p-2 tw-justify-center tw-items-center tw-absolute tw-bottom-0'>
                {/* <span className="tw-text-xs tw-font-light tw-text-gray-200 tw-text-opacity-50">
                  The resources provided by this Service are not licensed to each creator. Restricted to commercial use.
                </span> */}
                {/* <span className="tw-text-xs tw-font-light tw-text-gray-200 tw-text-opacity-50">
                  본 서비스에서 제공되는 리소스는 각 저작권자로부터 별도의 라이선스를 부여받지 않았습니다. 비상업적인 용도로만 사용할 수 있습니다.
                </span> */}
                <span className='tw-text-xs tw-font-light tw-text-gray-200 tw-text-opacity-50'>
                  Developed by GGDRN0 STUDIO & R-ARCHIVE
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Provider store={store}>
          <Component {...pageProps} isNotificationSound={settingDataApp?.isNotificationSound} />
        </Provider>
      )}
    </Provider>
  )
}

export default MyApp
