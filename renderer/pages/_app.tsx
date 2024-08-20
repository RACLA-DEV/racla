import React, { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import { Noto_Sans_KR } from 'next/font/google'
import axios, { AxiosResponse } from 'axios'
import HeaderComponent from '@/components/header/HeaderComponent'
import FooterComponent from '@/components/footer/FooterComponent'
import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import { useNotifications } from '@/libs/client/useNotifications'
import NotificationComponent from '@/components/notification/NotificationComponent'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import SidebarComponent from '@/components/sidebar/SidebarComponent'
import Cookies from 'universal-cookie'

import 'bootstrap/dist/css/bootstrap.min.css'
import '@styles/globals.css'
import { FaGear, FaX } from 'react-icons/fa6'
import { FiX } from 'react-icons/fi'

const noto = Noto_Sans_KR({
  subsets: ['latin'], // 또는 preload: false
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--noto-sans-kr',
})

function MyApp({ Component, pageProps }: AppProps) {
  const { asPath } = useRouter()

  useEffect(() => {
    // Bootstrap
    require('bootstrap/dist/js/bootstrap.bundle.min.js')
    // preload.ts 에서 정의된 ipc 로드
  }, [])

  const [userNo, setUserNo] = useState<string>('')
  const [userToken, setUserToken] = useState<string>('')
  const [userError, setUserError] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userLoading, setUserLoading] = useState<boolean>(false)
  const [randomTitle, setRandomTitle] = useState<string>('0')
  const [vArchiveSongData, setVArchiveSongData] = useState<any[]>([])

  const [selectedGame, setSelectedGame] = useState<string>('DJMAX_RESPECT_V')
  const [backgroundVideoName, setBackgroundVideoName] = useState<string>('bg_title')

  const { notifications, addNotification, removeNotification } = useNotifications()

  const [isSetting, setIsSetting] = useState<boolean>(false)

  const cookies = new Cookies()

  // 쿠키 설정 함수
  const setCookie = (userNo, userToken) => {
    cookies.set('Authorization', `${userNo}|${userToken}`, {
      path: 'https://dev-proxy.lunatica.kr',
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    })
    // console.log('쿠키가 설정되었습니다.')
  }

  // 쿠키 읽기 함수
  const getCookie = () => {
    const value = cookies.get('Authorization')
  }

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
        setVArchiveSongData(value)
      })
      .catch(() => {
        window.ipc.getSongData()

        window.ipc.on('IPC_RENDERER_GET_SONG_DATA', (value: any) => {
          if (vArchiveSongData.length === 0) {
            setVArchiveSongData(value)
          }
        })
      })
  }, [])

  useEffect(() => {
    if (vArchiveSongData.length > 0) {
      setRandomTitle(String(Math.floor(Math.random() * (vArchiveSongData.length - 1 - 0 + 1)) + 0))
    }
  }, [vArchiveSongData, userName]) // 빈 배열을 넣어 한 번만 실행되도록 합니다.

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(body: R): Promise<T> => {
    const { data } = await axios.post<T, AxiosResponse<T>, R>(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`, body, {
      withCredentials: false,
    })
    return data
  }

  useEffect(() => {
    const fetchSessionData = () => {
      setUserLoading(true)
      window.ipc.getSession()

      window.ipc.on('IPC_RENDERER_GET_SESSION', (data: any) => {
        if (data.userNo !== '' && data.userToken !== '') {
          setUserNo(data.userNo)
          setUserToken(data.userToken)
        } else {
          setUserLoading(false)
        }
      })
    }
    fetchSessionData()
  }, [])

  useEffect(() => {
    const handleLogined = (value) => {
      if (value !== undefined && Boolean(value)) {
        window.ipc.getSession()

        window.ipc.on('IPC_RENDERER_GET_SESSION', (data: any) => {
          if (data.userNo !== '' && data.userToken !== '') {
            setUserNo(data.userNo)
            setUserToken(data.userToken)
          } else {
            setUserLoading(false)
          }
        })
      }
    }

    window.ipc.on('IPC_RENDERER_IS_LOGINED', (value) => {
      handleLogined(value)
    })

    // 메모리 누수 방지
    return () => {
      window.ipc.removeListener('IPC_RENDERER_IS_LOGINED', handleLogined)
    }
  }, [])

  useEffect(() => {
    const fetchUserName = async () => {
      if (userNo !== '' && userToken !== '') {
        try {
          const response = getUserName({ userNo, token: userToken })
          response.then((result) => {
            if (result.success) {
              setUserName(result.nickname)
              window.ipc.setAuthorization({ userNo, userToken })
              addNotification(`${result.nickname}님 프로젝트 RA에 오신 것을 환영합니다.`, 'tw-bg-lime-600')
            } else {
              window.ipc.logout()
              addNotification(`유효하지 않은 사용자 세션으로 자동 로그인에 실패하였습니다.`, 'tw-bg-red-600')
            }
          })
        } catch (error) {
          window.ipc.logout()
          addNotification(`알 수 없는 오류로 인해 사용자 정보 조회에 실패하였습니다. ${String(error)}`, 'tw-bg-red-600')
        } finally {
          setUserLoading(false)
        }
      }
    }
    fetchUserName()
  }, [userNo, userToken])

  return (
    <div className={`tw-w-full tw-h-full ${noto.className}`}>
      {/* 배경 이미지 레이어 */}
      {/* <div className={'background-image tw-transition-all tw-duration-1000 ' + (selectedGame === 'DJMAX_RESPECT_V' ? 'tw-opacity-100' : 'tw-opacity-0')} /> */}
      {backgroundVideoName !== '' ? (
        <video
          src={`https://project-ra.lunatica.kr/${selectedGame.toLowerCase()}/${backgroundVideoName}.mp4`}
          autoPlay={true}
          muted={true}
          loop={true}
          className="background-video tw-opacity-100"
        />
      ) : null}

      {/* 배경 색상 레이어 */}
      <div className="background-image-color" />

      {/* 메인 콘텐츠 */}
      <main className="tw-mx-5 tw-text-sm" style={{ marginLeft: '14.25rem', marginBottom: '3rem', marginTop: '4rem' }} data-bs-theme="dark">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={asPath} // 페이지가 변경될 때마다 새 key로 애니메이션을 트리거
            initial={{ x: 10, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
            transition={{ duration: 0.3 }} // 애니메이션 지속 시간
            style={{ width: '100%' }} // 위치와 너비를 설정
          >
            <Component
              {...pageProps}
              songData={vArchiveSongData}
              addNotificationCallback={addNotification}
              fontFamily={noto.className}
              userData={{ userName, userNo, userToken }}
            />
          </motion.div>
        </AnimatePresence>
        <HeaderComponent
          className={noto.className}
          user={{ userNo, userToken, userName, randomTitle }}
          logoutCallback={() => {
            setUserNo('')
            setUserToken('')
            setUserName('')
          }}
          selectedGame={selectedGame}
          selectedGameCallback={setSelectedGame}
          addNotificationCallback={addNotification}
        />
        <SidebarComponent addNotificationCallback={addNotification} toggleSettingCallback={setIsSetting} selectedGame={selectedGame} />
        <FooterComponent className={noto.className} selectedGame={selectedGame} />
      </main>

      {/* 알림 컴포넌트(우측 하단) */}
      <NotificationComponent notifications={notifications} removeNotificationCallback={removeNotification} />

      {/* 설정 모달 */}
      <div
        className={`tw-bg-gray-950 tw-backdrop-blur-sm tw-h-full tw-w-full tw-fixed tw-transition-all tw-bg-opacity-75 tw-shadow-lg ${
          isSetting ? ' tw-opacity-100 tw-z-50 tw-animate-fadeInDown' : 'tw-opacity-0'
        }`}
      >
        <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-w-full">
          <div className="tw-flex tw-gap-3 tw-flex-col tw-h-4/6 tw-w-3/6 tw-bg-gray-900 tw-rounded-md tw-p-4 tw-border-gray-700 tw-border">
            <div className="tw-flex tw-items-center">
              <span className="tw-flex tw-gap-2 tw-items-center tw-text-lg tw-font-bold me-auto">
                <FaGear />
                설정
              </span>
              <button
                className="tw-text-xl"
                type="button"
                onClick={() => {
                  setIsSetting(false)
                }}
              >
                <FiX />
              </button>
            </div>
            <div className="tw-flex tw-gap-3 tw-flex-col tw-overflow-y-auto tw-scroll-smooth">
              <div className="tw-flex tw-flex-col tw-gap-1">
                <div className="tw-flex tw-items-center">
                  <span className="tw-text-sm">하드웨어 가속 활성화</span>
                  <button
                    className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                      true ? 'tw-bg-blue-600' : 'tw-bg-gray-300'
                    }`}
                  >
                    <span
                      className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-shadow tw-transform tw-transition-transform tw-duration-300 ${
                        true ? 'tw-translate-x-9' : 'tw-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                  하드웨어 가속은 GPU를 사용하여 프로젝트 RA가 더 부드럽게 동작하게 해줍니다. 프로젝트 RA의 화면에 문제가 발생한다면 이 설정을 비활성화 해보시기
                  바랍니다. 설정을 변경하면 앱이 다시 시작됩니다.
                </span>
                <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
              </div>
              <div className="tw-flex tw-flex-col tw-gap-1">
                <div className="tw-flex tw-items-center">
                  <span className="tw-text-sm">상단바 홈 버튼을 오른쪽으로 정렬</span>
                  <button
                    className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                      false ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                    }`}
                  >
                    <span
                      className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-shadow tw-transform tw-transition-transform tw-duration-300 ${
                        false ? 'tw-translate-x-9' : 'tw-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                  뒤로가기와 새로고침 버튼을 홈 버튼보다 우선으로 배치되도록 설정합니다.
                </span>
                <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
              </div>
              <div className="tw-flex tw-flex-col tw-gap-1">
                <div className="tw-flex tw-items-center">
                  <span className="tw-text-sm">BGA 영상 표시</span>
                  <button
                    className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                      true ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                    }`}
                  >
                    <span
                      className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-shadow tw-transform tw-transition-transform tw-duration-300 ${
                        true ? 'tw-translate-x-9' : 'tw-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                  기본적인 배경 BGA 영상과 BGA가 존재하는 곡의 이미지(자켓)에 마우스 커서를 올려둔 경우 해당 곡의 BGA 영상을 표시합니다.
                </span>
                <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
              </div>
              <div className="tw-flex tw-flex-col tw-gap-1">
                <div className="tw-flex tw-items-center">
                  <span className="tw-text-sm">자동 업데이트</span>
                  <button
                    className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                      true ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                    }`}
                  >
                    <span
                      className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-shadow tw-transform tw-transition-transform tw-duration-300 ${
                        true ? 'tw-translate-x-9' : 'tw-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                  자동 업데이트 활성화 시 프로젝트 RA를 실행할 때마다 업데이트를 확인합니다.
                </span>
                <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
              </div>
              <div className="tw-flex tw-flex-col tw-gap-1">
                <div className="tw-flex tw-items-center">
                  <span className="tw-text-sm">언어</span>
                  {/* <button
                  className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                    false ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                  }`}
                >
                  <span
                    className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-shadow tw-transform tw-transition-transform tw-duration-300 ${
                      false ? 'tw-translate-x-9' : 'tw-translate-x-1'
                    }`}
                  />
                </button> */}
                </div>
                <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                  프로젝트 RA의 언어를 변경합니다. 일부 화면은 언어 데이터가 미존재 시 한국어 또는 영어를 우선하여 표시합니다. 설정을 변경하면 앱이 다시
                  시작됩니다.
                </span>
                <select className="form-select tw-my-1 tw-text-xs tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36" defaultValue="ko">
                  <option value="ko">한국어(Korean)</option>
                  <option value="en" disabled>
                    영어(English)
                  </option>
                </select>
                <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
              </div>
              <div className="tw-mt-1">
                <button
                  className="tw-ms-2 tw-px-3 tw-py-2 tw-bg-gray-600 tw-text-xs tw-shadow-sm tw-rounded-md"
                  type="button"
                  onClick={() => {
                    window.ipc.send('reload-app')
                  }}
                >
                  앱 재시작
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyApp
