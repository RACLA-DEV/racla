import React, { useEffect, useState, useCallback, useRef } from 'react'
import type { AppProps } from 'next/app'
import axios, { AxiosResponse } from 'axios'
import HeaderComponent from '@/components/header/HeaderComponent'
import FooterComponent from '@/components/footer/FooterComponent'
import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import NotificationComponent from '@/components/notification/NotificationComponent'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import SidebarComponent from '@/components/sidebar/SidebarComponent'
import Image from 'next/image'

import 'bootstrap/dist/css/bootstrap.min.css'
import '@styles/globals.css'
import { FaBell, FaChevronLeft, FaChevronRight, FaRotate } from 'react-icons/fa6'
import SettingComponent from '@/components/layout/SettingComponent'
import { IconContext } from 'react-icons'
import { setFontFamily, setBackgroundBgaName, setIsDjCommentOpen } from 'store/slices/uiSlice'

import { RootState, store } from 'store'
// import { setIsDetectedGame, setSettingData, setUserData, setUploadedData, setVArchiveSongData } from 'store/slices/appSlice'
import { Provider } from 'react-redux'
import BackgroundVideoComponent from '@/components/layout/BackgroundVideoComponent'
import {
  setIsDetectedGame,
  setIsMiniMode,
  setIsUploading,
  setSelectedGame,
  setSettingData,
  setSongData,
  setUploadedDataProcessed,
  setUserData,
  setVArchiveUserData,
  setWjmaxSongData,
  setProjectRaData,
  setVArchiveData,
} from 'store/slices/appSlice'
import { addNotification, setNotificationFadeOut, removeNotification } from 'store/slices/notificationSlice'
import { v4 as uuidv4 } from 'uuid'
import { SyncLoader } from 'react-spinners'
import { globalDictionary } from '@/libs/server/globalDictionary'
import HomePanelComponent from '@/components/layout/HomePanelComponent'
import ImageViewerComponent from '@/components/layout/ImageViewerComponent'
import localFont from 'next/font/local'
import { useParams } from 'next/navigation'
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
      showNotification('DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.', 'tw-bg-blue-600')
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
          ? detectedGameName + '(게임)의 실행이 감지되어 게임 모드(배경 BGA 표시 비활성화)가 활성화 되었습니다.'
          : '게임 종료가 감지되어 게임 모드(배경 BGA 표시 비활성화)가 비활성화 되었습니다.',
        'tw-bg-blue-600',
      )
    }
  }, [detectedGame])

  const [isLoading, setIsLoading] = useState(true)

  const showNotification = useCallback((message: string, color?: string, updateKey?: string) => {
    const notificationId = uuidv4()
    store.dispatch(addNotification({ id: notificationId, message, color, updateKey }))

    setTimeout(() => {
      store.dispatch(setNotificationFadeOut(notificationId))

      setTimeout(() => {
        store.dispatch(removeNotification(notificationId))
      }, 500)
    }, 10000)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 서버에서 이미 처리된 곡 데이터 가져오기
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_OPEN_API_URL}/songs/processed/djmax_respect_v`)

        if (data && data.length > 0) {
          // 데이터 저장
          window.ipc.putSongData(data, 'djmax_respect_v')
          store.dispatch(setSongData(data))
        }
        return data
      } catch (error) {
        console.error('Error fetching processed song data:', error)
        throw error
      }
    }

    fetchData().catch(() => {
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
      if (data.isVerified || data.screenType == 'versus') {
        if (data.gameCode == 'djmax_respect_v') {
          store.dispatch(setVArchiveData(data))
        } else {
          store.dispatch(setProjectRaData(data))
        }

        if (!router.asPath.includes(`/${data.gameCode === 'djmax_respect_v' ? 'vArchive' : 'projectRa/' + data.gameCode}/regScore`)) {
          setTimeout(() => {
            router.push(`/${data.gameCode === 'djmax_respect_v' ? 'vArchive' : 'projectRa/' + data.gameCode}/regScore`)
          }, 300)
        }
      } else {
        store.dispatch(setVArchiveData(null))
        store.dispatch(setProjectRaData(null))
        store.dispatch(setIsUploading(false))
        store.dispatch(setUploadedDataProcessed(true))
        showNotification('성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.', 'tw-bg-red-600')
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
    if (router.pathname != '/' && !router.pathname.includes('/license') && !router.pathname.includes('/overlay') && !router.pathname.includes('/bug')) {
      if (params?.gameCode) {
        store.dispatch(setSelectedGame(params?.gameCode as string))
      } else {
        store.dispatch(setSelectedGame('djmax_respect_v'))
      }
    }
  }, [params, router])

  // R-ARCHIVE 로그인 처리
  useEffect(() => {
    const fetchUserData = async () => {
      if (vArchiveUserNo !== '' && vArchiveUserToken !== '') {
        try {
          // R-ARCHIVE API로 사용자 정보 조회
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/user/login/oauth/vArchive`, {
            userNo: vArchiveUserNo,
            userToken: vArchiveUserToken,
          })

          if (response.data) {
            showNotification(`${response.data.userName}님 R-ARCHIVE에 오신 것을 환영합니다.`, 'tw-bg-lime-600')
            window.ipc.send('storeSession', {
              userNo: response.data.userNo,
              userToken: response.data.userToken,
              vArchiveUserNo: response.data.varchiveUserNo,
              vArchiveUserToken: response.data.varchiveUserToken,
            })
            store.dispatch(
              setUserData({
                userName: response.data.userName,
                userNo: response.data.userNo,
                userToken: response.data.userToken,
                randomTitle: Math.floor(Math.random() * 652 + 1).toString(),
                vArchiveLinked: response.data.varchiveLinked || false,
              }),
            )
            if (response.data.varchiveLinked) {
              const vArchiveResponse = await axios.post<IUserNameResponse>(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`, {
                userNo: response.data.varchiveUserNo,
                token: response.data.varchiveUserToken,
              })

              if (vArchiveResponse.data.success) {
                store.dispatch(
                  setVArchiveUserData({
                    userNo: response.data.varchiveUserNo,
                    userToken: response.data.varchiveUserToken,
                    userName: vArchiveResponse.data.nickname,
                  }),
                )
                showNotification(`V-ARCHIVE 계정(${vArchiveResponse.data.nickname}) 데이터 동기화에 성공 하였습니다.`, 'tw-bg-lime-600')
              } else {
                showNotification(
                  'V-ARCHIVE 계정이 존재하지 않거나 통신 중 오류가 발생하였습니다. 연동 상태를 확인하시거나 잠시 후 다시 시도해주세요.',
                  'tw-bg-yellow-600',
                )
              }
              window.ipc.setAuthorization({ userNo: response.data.varchiveUserNo, userToken: response.data.varchiveUserToken })
            } else {
              showNotification('DJMAX RESPECT V 서비스를 이용하시려면 V-ARCHIVE 계정 연동이 필요합니다. 설정에서 연동을 진행해주세요.', 'tw-bg-yellow-600')
            }
            window.ipc.send('logined')
          } else {
            window.ipc.logout()
            setUserNo('')
            setUserToken('')
            showNotification('유효하지 않은 사용자 세션입니다.', 'tw-bg-red-600')
          }
        } catch (error) {
          window.ipc.logout()
          setUserNo('')
          setUserToken('')
          showNotification(`알 수 없는 오류로 인해 사용자 정보 조회에 실패하였습니다. ${String(error)}`, 'tw-bg-red-600')
        }
      }
    }
    fetchUserData()
  }, [vArchiveUserNo, vArchiveUserToken])

  // R-ARCHIVE 로그인 처리
  useEffect(() => {
    const fetchUserData = async () => {
      if (userNo !== '' && userToken !== '') {
        try {
          // R-ARCHIVE API로 사용자 정보 조회
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/user/login`, {
            userNo: userNo,
            userToken: userToken,
          })

          if (response.data) {
            showNotification(`${response.data.userName}님 R-ARCHIVE에 오신 것을 환영합니다.`, 'tw-bg-lime-600')
            store.dispatch(
              setUserData({
                userName: response.data.userName,
                userNo: response.data.userNo,
                userToken: response.data.userToken,
                randomTitle: Math.floor(Math.random() * 652 + 1).toString(),
                vArchiveLinked: response.data.varchiveLinked || false,
              }),
            )
            if (response.data.varchiveLinked) {
              window.ipc.send('storeSession', {
                userNo: response.data.userNo,
                userToken: response.data.userToken,
                vArchiveUserNo: response.data.varchiveUserNo,
                vArchiveUserToken: response.data.varchiveUserToken,
              })
              const vArchiveResponse = await axios.post<IUserNameResponse>(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`, {
                userNo: response.data.varchiveUserNo,
                token: response.data.varchiveUserToken,
              })

              if (vArchiveResponse.data.success) {
                store.dispatch(
                  setVArchiveUserData({
                    userNo: response.data.varchiveUserNo,
                    userToken: response.data.varchiveUserToken,
                    userName: vArchiveResponse.data.nickname,
                  }),
                )
                showNotification(`V-ARCHIVE 계정(${vArchiveResponse.data.nickname}) 데이터 동기화에 성공 하였습니다.`, 'tw-bg-lime-600')
              } else {
                showNotification(
                  'V-ARCHIVE 계정이 존재하지 않거나 통신 중 오류가 발생하였습니다. 연동 상태를 확인하시거나 잠시 후 다시 시도해주세요.',
                  'tw-bg-yellow-600',
                )
              }
              window.ipc.setAuthorization({ userNo: response.data.varchiveUserNo, userToken: response.data.varchiveUserToken })
            } else {
              showNotification('DJMAX RESPECT V 서비스를 이용하시려면 V-ARCHIVE 계정 연동이 필요합니다. 설정에서 연동을 진행해주세요.', 'tw-bg-yellow-600')
            }
            window.ipc.send('logined')
          } else {
            window.ipc.logout()
            setUserNo('')
            setUserToken('')
            showNotification('유효하지 않은 사용자 세션입니다.', 'tw-bg-red-600')
          }
        } catch (error) {
          window.ipc.logout()
          setUserNo('')
          setUserToken('')
          showNotification(`알 수 없는 오류로 인해 사용자 정보 조회에 실패하였습니다. ${String(error)}`, 'tw-bg-red-600')
        }
      }
    }
    fetchUserData()
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
    <div className="tw-flex tw-flex-col tw-gap-8">
      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-yellow-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-yellow-500">
              <span className="tw-font-bold">전체 화면에서는 오버레이 기능이 올바르게 작동하지 않습니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                현재 오버레이 기능은 창 모드, 전체 창모드에서만 올바르게 작동합니다. 단 오버레이 기능과 별개로 자동 캡쳐 모드는 창 모드, 전체 창모드, 전체
                화면에서 900p 이상 해상도에서 모두 정상적으로 작동하오니 착오가 없으시길 바랍니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold">프로젝트 RA는 2024년 12월 07일 이후로 R-ARCHIVE로 리브랜딩 되었습니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                기존의 LUNATICA.KR 도메인은 하위 호환성을 위한 최소한의 유지 보수만으로 운영되며 공식적으로는 더 이상 사용되지 않으므로 참고해주시길
                부탁드립니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold">DJMAX RESPECT V 서비스는 데스크톱 앱에서만 지원합니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                DJMAX RESPECT V 서비스의 경우 V-ARCHIVE에 의존하고 있습니다. 해당 서비스를 운영해주시는 관계자분들과 서비스 유지를 위한 수익에 피해를 드리지
                않도록 웹 서비스는 제공하지 않습니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold">macOS, Linux 사용자를 위한 데스크톱 앱이 제공될 예정입니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                Wine, GPTK, Proton, Whisky 등의 호환 플레이 도구를 사용하여 DJMAX RESPECT V, WJMAX 등의 게임을 구동하는 사용자를 위한 자동 캡쳐 모드가 포함된
                데스크톱 앱이 제공될 예정입니다.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold">WJMAX 서비스의 티어 시뮬레이션과 수록곡 별 상수에 대하여 의견을 받습니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                WJMAX 서비스의 티어 수식 또는 계산식 그리고 수록곡 별 상수에 대하여 의견을 받습니다. 보내주신 의견이 채택되는 경우 라이선스에 해당되는 사용자의
                닉네임이 반영(선택 사항), 기프티콘 그리고 개발자 빌드 참여 기회가 제공됩니다.
              </span>
            </div>
          </div>
        </div>
      </div> */}

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold">R-ARCHIVE는 아래와 같은 사용자 데이터를 수집합니다.</span>
            </div>
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                R-ARCHIVE는 사용자에게 더 나은 서비스를 제공하기 위한 닉네임 정보, 플레이 데이터, 접속 환경의 IP를 수집하고 있습니다. 사용자의 동의 없이
                제3자에게 제공되지 않으며 계정 및 데이터 삭제 요청은 개발자에게 문의바랍니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const update1Section = (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-break-keep">
      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            {/* 첫 번째 설명 블록 */}
            <div className="tw-bg-green-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-green-500">
              <span className="tw-font-bold tw-whitespace-pre-line">R-ARCHIVE 데스크톱 앱이 0.6.3 버전으로 업데이트 되었습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                프로젝트 RA는 2024년 12월 07일 이후로 R-ARCHIVE로 리브랜딩 되었습니다. 기존의 LUNATICA.KR 도메인은 하위 호환성을 위한 최소한의 유지 보수만으로
                운영되며 공식적으로는 더 이상 사용되지 않으므로 참고해주시길 부탁드립니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                해당 창을 닫으려면 상하좌우의 검정 여백을 클릭해주세요. 홈 화면 우측 상단의{' '}
                <button disabled className="tw-bg-gray-700 tw-p-2 tw-rounded">
                  <FaBell />
                </button>{' '}
                버튼을 통해 다시 확인하실 수 있습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                업데이트 내용은 아래의 목차에 따라 내용이 정리되어 있습니다. 우측 상단의{' '}
                <button disabled className="tw-bg-gray-700 tw-p-2 tw-rounded">
                  <FaChevronLeft />
                </button>{' '}
                <button disabled className="tw-bg-gray-700 tw-p-2 tw-rounded">
                  <FaChevronRight />
                </button>{' '}
                버튼을 통해 확인하실 수 있습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>각 이미지는 클릭 시 원본 크기로 확대되어 확인할 수 있습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                이 외에 기능 추가 의견, 버그 신고, 불편 사항, 궁금한 점 등이 있으시면 언제든지 좌측 하단에 위치한 버그 신고 또는 배포된 게시글에 댓글을 통해
                알려주세요.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const update2Section = (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-break-keep">
      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            {/* 첫 번째 설명 블록 */}
            <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
              <span className="tw-font-bold tw-whitespace-pre-line">새로운 기능</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                <span className="tw-text-sm tw-font-bold">WJMAX 서비스 지원</span>
                <br />
                V-ARCHIVE를 벤치마킹하여 R-ARCHIVE의 자체 서비스로 WJMAX 서비스를 제공합니다. 데이터베이스, 성과표를 지원하며 데이터베이스에서는 키보드 접근성과
                DJMAX RESPECT V 서비스 대비 더 많은 편의 기능을 제공합니다.
                <br />
                <br />
                방향키 : 카테고리 변경 및 곡 선택
                <br />
                1번 키 : 키 변경
                <br /> F 키 : 검색 창<br /> A, D 키 : 정렬
                <br /> Q, E 키 : 난이도 변경 <br />V 키 : 목록 뷰 변경
                <br />
                <br />
                일반 모드와 플러스 모드의 성과를 따로 기록할 수 있으며 자동 캡쳐 모드를 지원합니다. 단 현재는 수동 업로드와 자동 업로드 모두 프리스타일 결과
                창만 지원합니다. 0.6.1 업데이트에서 곡 선택창을 지원할 예정입니다.
              </span>
              <div className="tw-flex tw-justify-center tw-my-4">
                <Image
                  src="https://ribbon.r-archive.zip/project_ra/update_060_wjmax1.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://ribbon.r-archive.zip/project_ra/update_060_wjmax1.png?full=1')}
                  referrerPolicy="origin"
                />
                <Image
                  src="https://ribbon.r-archive.zip/project_ra/update_060_wjmax2.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://ribbon.r-archive.zip/project_ra/update_060_wjmax2.png?full=1')}
                />
              </div>
              <div className="tw-flex tw-justify-center tw-my-4">
                <Image
                  src="https://ribbon.r-archive.zip/project_ra/update_060_wjmax3.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://ribbon.r-archive.zip/project_ra/update_060_wjmax3.png?full=1')}
                  referrerPolicy="origin"
                />
                <Image
                  src="https://ribbon.r-archive.zip/project_ra/update_060_wjmax4.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://ribbon.r-archive.zip/project_ra/update_060_wjmax4.png?full=1')}
                />
              </div>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                <span className="tw-text-sm tw-font-bold">미니 모드</span>
                <br />
                이제 사이드바를 열고 접을 수 있으며 더 많은 콘텐츠를 한 눈에 볼 수 있습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                <span className="tw-text-sm tw-font-bold">피드백 센터</span>
                <br />
                기존의 카카오톡 오픈 프로필로 연결된 버그 신고 기능은 잘 활용되지 않아 티켓 지원 방식의 피드백 센터를 추가하였습니다. 누구나 버그 신고, 의견
                등의 요청 사항을 작성할 수 있으며 다른 이가 작성한 내용에 추가 의견을 제시할 수 있습니다.
              </span>
              <div className="tw-flex tw-justify-center tw-my-4">
                <Image
                  src="https://ribbon.r-archive.zip/project_ra/update_060_feedback.png"
                  alt="overlay"
                  className="tw-cursor-pointer tw-w-1/2 tw-h-auto"
                  width={500}
                  height={500}
                  onClick={() => setSelectedImage('https://ribbon.r-archive.zip/project_ra/update_060_feedback.png?full=1')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            {/* 첫 번째 설명 블록 */}
            <div className="tw-bg-yellow-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-yellow-500">
              <span className="tw-font-bold tw-whitespace-pre-line">변경 사항</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                WJMAX 자체 서비스가 추가됨에 따라 로그인 시스템이 일부 변경 되었습니다. 자세한 사항은 공지사항 패널 또는 로그인 화면의 내용을 참고 부탁드립니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>창 모드 사용자를 위해 R-ARCHIVE 데스크톱 앱이 요구하는 최저 해상도가 1440x810에서 1280x720으로 변경되었습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>전체적인 채도, 명도, 컬러 등의 재조정과 폰트 변경, 폰트 사이즈 변경 등의 가독성 향상 작업이 진행되었습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                (DJMAX RESPECT V 오픈 매치 한정) 자동 캡쳐 모드 사용 시 캡쳐 주기를 3초 미만으로 사용하는 경우 올바르게 캡쳐되지 않는 문제가 발생하여 제대로
                캡쳐가 인식되지 않는 경우가 발생하여 일정 시간(3초) 후 한번 더 캡쳐하도록 기능이 변경되었습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>(0.6.3) 서비스와 관련된 단어, 명칭을 R-ARCHIVE로 리브랜딩 하였습니다.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-8 tw-p-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-text-sm">
        <div className="tw-flex tw-flex-col tw-gap-4 tw-w-full">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full tw-leading-relaxed">
            {/* 첫 번째 설명 블록 */}
            <div className="tw-bg-red-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-red-500">
              <span className="tw-font-bold tw-whitespace-pre-line">버그 수정 사항</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>홈, 성과표 그래프에서 성과 기록이 제대로 합산되지 않던 버그를 수정하였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>일부 API가 캐싱 처리되어 지연이 발생하던 문제를 해소하였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                DJMAX RESPECT V 성과 기록 등록 시 난이도, 패턴을 올바르게 인식하였으나 간혈적으로 V-ARCHIVE로 갱신 요청에 실패하는 버그를 수정하였습니다.
              </span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>(0.6.1) 앱 오른쪽 하단에 표시되는 알림이 올바르게 제거되지 않는 버그를 수정하였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>(0.6.2) 자동 캡쳐 모드 사용 시 상태값 충돌로 인하여 발생할 수 있는 Application Error를 일부 개선하였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>(0.6.3) 백 프로세스(Electron)에서 발생할 수 있는 오류에 대한 예외 처리 코드를 모두 추가하였습니다.</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
              <span>
                (0.6.3) 자동 캡쳐 모드 사용 시 캡쳐 주기를 3초 미만으로 사용 시 데이터 처리 과정에서 R-ARCHIVE 데스크톱 앱이 재시작하는 경우가 발생하여
                정상적으로 성과 기록 등록이 되지 않던 부분을 일부 해소하였습니다.
              </span>
            </div>
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

  const updateSections = [
    { title: '업데이트', content: update1Section },
    { title: '0.6 업데이트', content: update2Section },
  ]

  return (
    <Provider store={store}>
      {!isLoading && !router.pathname.includes('/overlay/widget') ? (
        <div className={`tw-w-full tw-transition-all tw-h-full ${noto.className}`}>
          <BackgroundVideoComponent />

          <main
            className="tw-mx-5 tw-text-sm tw-transition-all"
            style={{ marginLeft: settingDataApp.isMiniMode ? '4rem' : '14.25rem', marginBottom: '3rem', marginTop: '4rem' }}
            data-bs-theme="dark"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={asPath + refreshKey}
                initial={{ x: 10, opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%' }}
              >
                <Component {...pageProps} />
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

          <HomePanelComponent noticeSection={noticeSection} updateSections={updateSections} serviceSection={<ServiceSection />} />

          {selectedImage && <ImageViewerComponent src={selectedImage} onClose={() => setSelectedImage(null)} />}

          {/* 외부 링크 확인 모달 */}
          <div
            className={`tw-fixed tw-inset-0 tw-z-[9999] tw-transition-opacity tw-duration-300 ${
              showExternalLinkModal ? 'tw-opacity-100 tw-pointer-events-auto' : 'tw-opacity-0 tw-pointer-events-none'
            }`}
          >
            <div className="tw-fixed tw-inset-0 tw-bg-gray-950 tw-bg-opacity-90" onClick={handleBackdropClick} />
            <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center">
              <div
                className={`tw-bg-gray-900 tw-p-6 tw-rounded-lg tw-shadow-lg tw-max-w-md tw-w-full tw-mx-4 
                tw-transition-all tw-duration-300 ${showExternalLinkModal ? 'tw-opacity-100 tw-translate-y-0' : 'tw-opacity-0 tw-translate-y-4'}`}
              >
                <h3 className="tw-text-lg tw-font-bold tw-mb-4 tw-text-center">외부 링크 열기</h3>
                <p className="tw-mb-6 tw-text-center tw-font-light tw-text-sm">
                  이 링크는 사용자의 브라우저에서 열립니다.
                  <br />
                  신뢰할 수 있는 링크인지 확인 후 이동해주세요.
                </p>
                <div className="tw-mb-6 tw-h-20 tw-overflow-y-auto tw-bg-gray-800 tw-rounded tw-p-2">
                  <p className="tw-text-blue-400 tw-break-all tw-text-sm">{externalUrl}</p>
                </div>
                <div className="tw-flex tw-justify-end tw-gap-2">
                  <button
                    className="tw-px-4 tw-py-1.5 tw-text-sm tw-bg-gray-800 tw-rounded hover:tw-bg-gray-700"
                    onClick={() => setShowExternalLinkModal(false)}
                  >
                    취소
                  </button>
                  <button className="tw-px-4 tw-py-1.5 tw-text-sm tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700" onClick={handleExternalLink}>
                    열기
                  </button>
                </div>
              </div>
            </div>
          </div>

          <NotificationComponent />

          <SettingComponent />
        </div>
      ) : router.pathname.includes('/overlay/widget') ? (
        <Provider store={store}>
          <Component {...pageProps} />
        </Provider>
      ) : (
        <div className={`tw-flex tw-w-screen tw-h-screen flex-equal tw-flex-col tw-gap-10 tw-items-center tw-justify-center ${noto.className}`}>
          <Image src="/images/logo.svg" height={240} width={240} alt="Logo" />
          {/* <span className="tw-text-sm tw-font-bold">R-ARCHIVE 실행에 필요한 데이터를 불러오고 있습니다. 잠시만 기다려주세요.</span> */}
          <SyncLoader color="#ffffff" size={8} />
        </div>
      )}
    </Provider>
  )
}

export default MyApp
