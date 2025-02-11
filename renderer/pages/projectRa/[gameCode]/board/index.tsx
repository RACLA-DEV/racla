import Head from 'next/head'
import { RootState } from 'store'
import { useEffect } from 'react'
import { useNotificationSystem } from '@hooks/useNotifications'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'

const BoardHome = () => {
  const router = useRouter()

  const userData = useSelector((state: RootState) => state.app.userData)
  const { showNotification } = useNotificationSystem()

  useEffect(() => {
    if (userData.userName !== '') {
      router.push('/projectRa/wjmax/board/4B/1')
    } else {
      router.push('/')
      showNotification('성과표 조회 기능은 로그인이 필요합니다.', 'tw-bg-red-600')
    }
  }, [])

  return (
    <>
      <Head>
        <title>성과표 - RACLA</title>
      </Head>
    </>
  )
}

export default BoardHome
