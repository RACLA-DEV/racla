import React, { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import { Noto_Sans_KR } from 'next/font/google'
import axios, { AxiosResponse } from 'axios'
import NavComponent from '@/components/NavComponent'
import FooterComponent from '@/components/FooterComponent'
import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import { useNotifications } from '@/libs/client/useNotifications'
import NotificationComponent from '@/components/NotificationComponent'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'

const noto = Noto_Sans_KR({
  subsets: ['latin'], // 또는 preload: false
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--noto-sans-kr',
})

import 'bootstrap/dist/css/bootstrap.min.css'
import '@styles/globals.css'
import SidebarComponent from '@/components/SidebarComponent'

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

  const { notifications, addNotification, removeNotification } = useNotifications()

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(body: R): Promise<T> => {
    const { data } = await axios.post<T, AxiosResponse<T>, R>('https://cors.lunatica.kr/proxy?url=https://v-archive.net/client/login', body, {
      withCredentials: false,
    })
    return data
  }

  useEffect(() => {
    const fetchSessionData = () => {
      setUserLoading(true)
      const userData = window.ipc.getSession()
      userData.then((data) => {
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
        const userData = window.ipc.getSession()
        userData.then((data) => {
          if (data.userNo !== '' && data.userToken !== '') {
            setUserNo(data.userNo)
            setUserToken(data.userToken)
          }
        })
      }
    }

    window.ipc.on('IPC_RENDERER_IS_LOGINED', handleLogined)

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
              addNotification(`${result.nickname}님 프로젝트 RA에 오신 것을 환영합니다.`)
            } else {
              window.ipc.logout()
              addNotification(`유효하지 않은 사용자 세션으로 자동 로그인에 실패하였습니다.`)
            }
          })
        } catch (error) {
          window.ipc.logout()
          addNotification(`알 수 없는 오류로 인해 사용자 정보 조회에 실패하였습니다. ${String(error)}`)
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
      <div className="background-image" />
      {/* 배경 색상 레이어 */}
      <div className="background-image-color" />

      {/* 메인 콘텐츠 */}
      <main className="tw-mx-5 tw-text-sm" style={{ marginLeft: '14.25rem', marginBottom: '4rem', marginTop: '4rem' }} data-bs-theme="dark">
        <NavComponent
          className={noto.className}
          user={{ userNo, userToken, userName }}
          logoutCallback={() => {
            setUserNo('')
            setUserToken('')
            setUserName('')
          }}
          addNotificationCallback={addNotification}
        />
        <SidebarComponent />
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={asPath} // 페이지가 변경될 때마다 새 key로 애니메이션을 트리거
            initial={{ x: 10, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
            transition={{ duration: 0.3 }} // 애니메이션 지속 시간
            style={{ width: '100%' }} // 위치와 너비를 설정
          >
            <Component {...pageProps} addNotificationCallback={addNotification} />
          </motion.div>
        </AnimatePresence>
        <FooterComponent className={noto.className} />
      </main>

      {/* 알림 컴포넌트(우측 하단) */}
      <NotificationComponent notifications={notifications} removeNotificationCallback={removeNotification} />
    </div>
  )
}

export default MyApp
