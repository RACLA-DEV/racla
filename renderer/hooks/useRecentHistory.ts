import axios from 'axios'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { logRendererError } from '../utils/rendererLoggerUtils'

// hooks/useRecentHistory.ts

interface RecentHistoryItem {
  historyId: number
  playedAt: string
  score: number
  maxCombo: boolean
  judgementType: string
  gameCode: string
  keyType: string
  difficultyType: string
  level: number
  floor: number | null
  songId: number
  songName: string
  composer: string
  dlcCode: string
  dlc: string
  folderName: string | null
}

export const useRecentHistory = () => {
  const [isLoadingRecentHistory, setIsLoadingRecentHistory] = useState<boolean>(false)
  const [errorRecentHistory, setErrorRecentHistory] = useState<string | null>(null)
  const [recentHistory, setRecentHistory] = useState<RecentHistoryItem[]>([])

  const { userData, selectedGame } = useSelector((state: RootState) => state.app)

  const fetchRecentHistory = async () => {
    if (!userData.userNo || !userData.userToken) {
      setErrorRecentHistory('로그인이 필요합니다.')
      return
    }

    setIsLoadingRecentHistory(true)
    setErrorRecentHistory(null)

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/racla/play/history/${userData.userNo}/${selectedGame}`,
        {
          headers: {
            Authorization: `${userData.userNo}|${userData.userToken}`,
          },
          withCredentials: true,
        },
      )

      if (response.data.success) {
        setRecentHistory(response.data.recentHistory)
      } else {
        setErrorRecentHistory(response.data.message || '기록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      logRendererError(error, { message: 'Error fetching recent history', ...userData })
      console.error('Recent history fetch error:', error)
      setErrorRecentHistory('기록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingRecentHistory(false)
    }
  }

  return {
    recentHistory,
    isLoadingRecentHistory,
    errorRecentHistory,
    fetchRecentHistory,
  }
}
