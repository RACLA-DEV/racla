import React, { useEffect, useState, useCallback } from 'react'
import type { AppProps } from 'next/app'
import { Noto_Sans_KR } from 'next/font/google'
import axios, { AxiosResponse } from 'axios'
import HeaderComponent from '@/components/header/HeaderComponent'
import FooterComponent from '@/components/footer/FooterComponent'
import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import NotificationComponent from '@/components/notification/NotificationComponent'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import SidebarComponent from '@/components/sidebar/SidebarComponent'
import Image from 'next/image'

import 'bootstrap/dist/css/bootstrap.min.css'
import '@styles/globals.css'
import { FaRotate } from 'react-icons/fa6'
import SettingComponent from '@/components/layout/SettingComponent'
import { IconContext } from 'react-icons'
import { setFontFamily, setBackgroundBgaName } from 'store/slices/uiSlice'

import { RootState, store } from 'store'
// import { setIsDetectedGame, setSettingData, setUserData, setUploadedData, setVArchiveSongData } from 'store/slices/appSlice'
import { Provider } from 'react-redux'
import BackgroundVideoComponent from '@/components/layout/BackgroundVideoComponent'
import { setIsDetectedGame, setIsUploading, setSettingData, setSongData, setUploadedData, setUserData } from 'store/slices/appSlice'
import { addNotification, setNotificationFadeOut, removeNotification } from 'store/slices/notificationSlice'
import { v4 as uuidv4 } from 'uuid'
import { SyncLoader } from 'react-spinners'
import { globalDictionary } from '@/libs/server/globalDictionary'

const noto = Noto_Sans_KR({
  subsets: ['latin'], // 또는 preload: false
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--noto-sans-kr',
})

function MyApp({ Component, pageProps }: AppProps) {
  const { asPath } = useRouter()

  const [detectedGame, setDetectedGame] = useState<boolean>(false)

  useEffect(() => {
    // Bootstrap 로드
    require('bootstrap/dist/js/bootstrap.bundle.min.js')

    // 설정 데이터 요청
    window.ipc.send('getSettingData')

    window.ipc.on('isDetectedGame', (data: boolean) => {
      store.dispatch(setIsDetectedGame(data))
      setDetectedGame(data)
    })

    window.ipc.on('IPC_RENDERER_GET_SETTING_DATA', (data: any) => {
      store.dispatch(setSettingData(data))
      if (isLoading) {
        // 애니메이션 설정 적용
        // if (!data.visiableAnimation) {
        if (!data.visibleAnimation) {
          document.documentElement.classList.add('no-animation')
        } else {
          document.documentElement.classList.remove('no-animation')
        }

        window.ipc.send('PROGRAM_LOADED')

        if (isLoading) {
          // 세션 데이터 요청
          const fetchSessionData = () => {
            window.ipc.getSession()

            console.log('Session Requested.')
            window.ipc.on('IPC_RENDERER_GET_SESSION', (data: any) => {
              if (data.userNo !== '' && data.userToken !== '') {
                setUserNo(data.userNo)
                setUserToken(data.userToken)
              }
            })
          }

          fetchSessionData()
          setIsLoading(false)
        }
      }
    })

    window.ipc.on('pushNotification', (data: any) => {
      showNotification(data.message, data.color)
    })

    // 클린업 함수
    return () => {
      window.ipc.removeListener('isDetectedGame', (data: boolean) => {
        store.dispatch(setIsDetectedGame(data))
        setDetectedGame(data)
      })

      window.ipc.removeListener('IPC_RENDERER_GET_SETTING_DATA', (data: any) => {
        store.dispatch(setSettingData(data))
        if (isLoading) {
          // 애니메이션 설정 적용
          // if (!data.visiableAnimation) {
          if (!data.visiableAnimation) {
            document.documentElement.classList.add('no-animation')
          } else {
            document.documentElement.classList.remove('no-animation')
          }

          window.ipc.send('PROGRAM_LOADED')

          if (isLoading) {
            // 세션 데이터 요청
            const fetchSessionData = () => {
              window.ipc.getSession()

              console.log('Session Requested.')
              window.ipc.on('IPC_RENDERER_GET_SESSION', (data: any) => {
                if (data.userNo !== '' && data.userToken !== '') {
                  setUserNo(data.userNo)
                  setUserToken(data.userToken)
                }
              })
            }

            fetchSessionData()
            setIsLoading(false)
          }
        }
      })

      window.ipc.removeListener('isDetectedResultScreen', (data: string) => {
        showNotification('DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.', 'tw-bg-blue-600')
      })
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      showNotification(
        detectedGame
          ? 'DJMAX RESPECT V(게임) 실행이 감지되어 게임 모드(배경 BGA 미표시)가 활성화 되었습니다.'
          : 'DJMAX RESPECT V(게임) 종료가 감지되어 게임 모드(배경 BGA 미표시)가 비활성화 되었습니다.',
        'tw-bg-blue-600',
      )
    }
  }, [detectedGame])

  const [isLoading, setIsLoading] = useState(true)
  const [userNo, setUserNo] = useState<string>('')
  const [userToken, setUserToken] = useState<string>('')

  const showNotification = useCallback((message: string, color?: string) => {
    const notificationId = uuidv4()
    store.dispatch(addNotification({ id: notificationId, message, color }))

    setTimeout(() => {
      store.dispatch(setNotificationFadeOut(notificationId))

      setTimeout(() => {
        store.dispatch(removeNotification(notificationId))
      }, 500)
    }, 10000)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/db/songs.json`)
      if (data.length > 0 && data[0].title === 0) {
        window.ipc.putSongData(data)
      }
      return data
    }
    fetchData()
      .then((value) => {
        store.dispatch(setSongData(value))
      })
      .catch(() => {
        window.ipc.getSongData()

        window.ipc.on('IPC_RENDERER_GET_SONG_DATA', (value: any) => {
          if (store.getState().app.songData.length === 0) {
            store.dispatch(setSongData(value))
          }
        })
      })
  }, [])

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(body: R): Promise<T> => {
    const { data } = await axios.post<T, AxiosResponse<T>, R>(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`, body, {
      withCredentials: false,
    })
    return data
  }

  useEffect(() => {
    const handleScreenshotUploaded = (data: any) => {
      if (data.isVerified) {
        store.dispatch(setUploadedData(data))
        if (!router.asPath.includes('/vArchive/regScore')) {
          setTimeout(() => {
            router.push('/vArchive/regScore')
          }, 300)
        }
      } else {
        store.dispatch(setUploadedData(null))
        showNotification('성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.', 'tw-bg-red-600')
        store.dispatch(setIsUploading(false))
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

  useEffect(() => {
    console.log(userNo, userToken)
    const fetchUserName = async () => {
      if (userNo !== '' && userToken !== '') {
        try {
          const response = getUserName({ userNo, token: userToken })
          response.then((result) => {
            if (result.success) {
              window.ipc.setAuthorization({ userNo, userToken })
              showNotification(`${result.nickname}님 프로젝트 RA에 오신 것을 환영합니다.`, 'tw-bg-lime-600')
              store.dispatch(setUserData({ userName: result.nickname, userNo, userToken, randomTitle: Math.floor(Math.random() * 652 + 1).toString() }))
              window.ipc.send('logined')
            } else {
              window.ipc.logout()
              showNotification(`유효하지 않은 사용자 세션으로 자동 로그인에 실패하였습니다.`, 'tw-bg-red-600')
            }
          })
        } catch (error) {
          window.ipc.logout()
          showNotification(`알 수 없는 오류로 인해 사용자 정보 조회에 실패하였습니다. ${String(error)}`, 'tw-bg-red-600')
        }
      }
    }
    fetchUserName()
  }, [userNo, userToken])

  const router = useRouter()

  useEffect(() => {
    if (!router.pathname.includes('/db/title')) {
      // 현재 값이 이미 빈 문자열이면 dispatch하지 않음
      const currentBgaName = store.getState().ui.backgroundBgaName
      if (currentBgaName !== '') {
        store.dispatch(setBackgroundBgaName(''))
      }
    }
  }, [router])

  useEffect(() => {
    if (router.pathname.includes('/projectRa/overlay/widget')) {
      document.body.style.background = 'transparent'
      document.body.style.backgroundColor = 'transparent'
    } else {
      document.body.style.background = ''
      document.body.style.backgroundColor = ''
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
    // ... existing effects ...

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

  return (
    <Provider store={store}>
      {!isLoading && !router.pathname.includes('/projectRa/overlay/widget') ? (
        <div className={`tw-w-full tw-transition-all tw-h-full ${noto.className}`}>
          <BackgroundVideoComponent />

          <main className="tw-mx-5 tw-text-sm" style={{ marginLeft: '14.25rem', marginBottom: '3rem', marginTop: '4rem' }} data-bs-theme="dark">
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
              }}
            />
            <SidebarComponent />
            <FooterComponent />
          </main>

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
      ) : router.pathname.includes('/projectRa/overlay/widget') ? (
        <Component {...pageProps} />
      ) : (
        <div className={`tw-flex tw-w-screen tw-h-screen flex-equal tw-flex-col tw-gap-10 tw-items-center tw-justify-center ${noto.className}`}>
          <Image src="/images/logo.svg" height={240} width={240} alt="Logo" />
          <span className="tw-text-xs tw-font-bold">프로젝트 RA 실행에 필요한 데이터를 불러오고 있습니다. 잠시만 기다려주세요.</span>
          <SyncLoader color="#ffffff" size={8} />
        </div>
      )}
    </Provider>
  )
}

export default MyApp
