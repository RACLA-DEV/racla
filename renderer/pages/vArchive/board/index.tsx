import { useNotificationSystem } from '@/libs/client/useNotifications'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

const BoardHome = () => {
  const router = useRouter()

  const userData = useSelector((state: RootState) => state.app.userData)
  const vArchiveUserData = useSelector((state: RootState) => state.app.vArchiveUserData)
  const { showNotification } = useNotificationSystem()

  useEffect(() => {
    if (vArchiveUserData.userName !== '') {
      router.push('/vArchive/board/4/1')
    } else {
      router.push('/')
      showNotification('성과표 조회 기능은 로그인 또는 V-ARCHIVE 계정 연동이 필요합니다.', 'tw-bg-red-600')
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
