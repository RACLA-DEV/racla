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
import Image from 'next/image'

import 'bootstrap/dist/css/bootstrap.min.css'
import '@styles/globals.css'
import { FaGear, FaRotate, FaX } from 'react-icons/fa6'
import { FiX } from 'react-icons/fi'
import SettingComponent from '@/components/layout/SettingComponent'
import { IconContext } from 'react-icons'

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
    setTimeout(() => window.ipc.send('getSettingData'), 3000)
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
  const [backgroundBgaName, setBackgroundBgaName] = useState<string>('')

  const { notifications, addNotification, removeNotification } = useNotifications()

  const [isSetting, setIsSetting] = useState<boolean>(false)
  const [settingData, setSettingData] = useState<any>(null)

  const cookies = new Cookies()

  const [uploadedData, setUploadedData] = useState<any>(null)
  const [isDetectedGame, setIsDetectedGame] = useState<boolean>(false)

  const [cached, setCached] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/db/songs.json`)
      console.log(data)
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
    window.ipc.on('screenshot-uploaded', (data: any) => {
      if (data.isVerified) {
        setUploadedData(data)
        if (selectedGame === 'DJMAX_RESPECT_V') {
          if (!router.asPath.includes('/vArchive/regScore')) {
            router.push('/vArchive/regScore')
          }
        }
      } else {
        setUploadedData(data)
      }
    })

    return () => {
      window.ipc.removeListener('screenshot-uploaded', (data: any) => {
        if (data.isVerified) {
          setUploadedData(data)
          if (selectedGame === 'DJMAX_RESPECT_V') {
            if (!router.asPath.includes('/vArchive/regScore')) {
              router.push('/vArchive/regScore')
            }
          }
        } else {
          setUploadedData(data)
        }
      })
    }
  }, [])

  useEffect(() => {
    window.ipc.send('startCache')

    window.ipc.on('isDetectedGame', (data: boolean) => {
      setIsDetectedGame(data)
    })

    window.ipc.on('IPC_RENDERER_GET_SETTING_DATA', (data) => {
      setSettingData(data)
    })

    window.ipc.on('cacheResponse', (data: any) => {
      setCached(data)
    })

    window.ipc.on('isDetectedResultScreen', (data: string) => {
      addNotification('DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.', 'tw-bg-blue-600')
    })

    return () => {
      window.ipc.removeListener('isDetectedGame', (data: boolean) => {
        setIsDetectedGame(data)
      })

      window.ipc.removeListener('IPC_RENDERER_GET_SETTING_DATA', (data) => {
        setSettingData(data)
      })

      window.ipc.on('cacheResponse', (data: any) => {
        if (data) {
          setCached(true)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (isDetectedGame) {
      addNotification(
        isDetectedGame
          ? 'DJMAX RESPECT V(게임) 실행이 감지되어 게임 모드(배경 BGA 미표시)가 활성화 되었습니다.'
          : 'DJMAX RESPECT V(게임) 종료가 감지되어 게임 모드(배경 BGA 미표시)가 비활성화 되었습니다.',
        'tw-bg-blue-600',
      )
    }
  }, [isDetectedGame])

  useEffect(() => {
    const fetchSessionData = () => {
      setUserLoading(true)
      window.ipc.getSession()

      console.log('Session Requested.')
      window.ipc.on('IPC_RENDERER_GET_SESSION', (data: any) => {
        if (data.userNo !== '' && data.userToken !== '') {
          setUserNo(data.userNo)
          setUserToken(data.userToken)
        } else {
          setUserLoading(false)
        }
      })
    }
    setTimeout(fetchSessionData, 3000)
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
              window.ipc.send('logined')
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

  const router = useRouter()

  useEffect(() => {
    if (!router.pathname.includes('/db/title')) {
      setBackgroundBgaName('')
    }
    if (!router.pathname.includes('/regScore')) {
      setUploadedData(null)
    }
  }, [router])

  useEffect(() => {
    if (settingData !== null && cached) {
      window.ipc.send('PROGRAM_LOADED')
    }
  }, [settingData, cached])

  return settingData !== null && cached ? (
    <div className={`tw-w-full tw-transition-all tw-h-full ${noto.className}`}>
      {/* 배경 이미지 레이어 */}
      <div className="background-image-base" />
      <div className={'background-image tw-transition-all tw-duration-1000 tw-animate-fadeInLeft'} />
      {/* <div className={'background-image tw-transition-all tw-duration-1000 ' + (selectedGame === 'DJMAX_RESPECT_V' ? 'tw-opacity-100' : 'tw-opacity-0')} /> */}
      {backgroundVideoName !== '' && !isDetectedGame && settingData.visibleBga ? (
        <video
          src={`https://project-ra.lunatica.kr/${selectedGame.toLowerCase()}/${backgroundVideoName}.mp4`}
          autoPlay={true}
          muted={true}
          loop={true}
          className={'background-video tw-transition-all tw-h-screen tw-duration-1000 ' + (backgroundBgaName !== '' ? ' tw-opacity-0' : ' tw-opacity-100')}
        />
      ) : selectedGame === 'DJMAX_RESPECT_V' ? (
        null
      ) : (
        <div className={'tw-bg-gray-950 tw-transition-all tw-duration-1000 tw-animate-fadeInLeft'} />
      )}

      {backgroundBgaName !== '' && settingData.visibleBga ? (
        <video
          src={`https://project-ra.lunatica.kr/${selectedGame.toLowerCase()}/preview/title/${backgroundBgaName}.webm`}
          autoPlay={true}
          muted={true}
          loop={true}
          className={
            'background-video tw-transition-all tw-h-screen tw-duration-1000 tw-animate-fadeInLeft ' +
            (backgroundBgaName === '' ? ' tw-opacity-0' : ' tw-opacity-100')
          }
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
            <div id="ContentHeader" />
            <Component
              {...pageProps}
              songData={vArchiveSongData}
              addNotificationCallback={addNotification}
              fontFamily={noto.className}
              userData={{ userName, userNo, userToken }}
              setBackgroundBgaName={setBackgroundBgaName}
              uploadedData={uploadedData}
              settingData={settingData}
              setSettingData={setSettingData}
            />
            <div id="ContentFooter" />
          </motion.div>
        </AnimatePresence>
        <HeaderComponent
          className={noto.className}
          user={{ userNo, userToken, userName, randomTitle }}
          logoutCallback={() => {
            setUserNo('')
            setUserToken('')
            setUserName('')
            setUploadedData(null)
          }}
          selectedGame={selectedGame}
          selectedGameCallback={setSelectedGame}
          addNotificationCallback={addNotification}
          settingData={settingData}
        />
        <SidebarComponent addNotificationCallback={addNotification} toggleSettingCallback={setIsSetting} selectedGame={selectedGame} />
        <FooterComponent className={noto.className} selectedGame={selectedGame} />
      </main>

      {/* 알림 컴포넌트(우측 하단) */}
      <NotificationComponent notifications={notifications} removeNotificationCallback={removeNotification} />

      {/* 설정 모달 */}
      <SettingComponent isSetting={isSetting} toggleSettingCallback={setIsSetting} settingData={settingData} settingDataCallback={setSettingData} />
    </div>
  ) : (
    <div className={`tw-flex tw-w-screen tw-h-screen flex-equal tw-flex-col tw-gap-10 tw-items-center tw-justify-center ${noto.className}`}>
      <Image src="/images/logo.svg" height={240} width={240} alt="Logo" />
      <span className="tw-text-xs tw-font-bold">프로젝트 RA 실행에 필요한 데이터를 불러오고 있습니다. 잠시만 기다려주세요.</span>
      <div className="tw-relative tw-text-center tw-animate-spin">
        <IconContext.Provider value={{ className: '' }}>
          <FaRotate />
        </IconContext.Provider>
      </div>
    </div>
  )
}

export default MyApp
