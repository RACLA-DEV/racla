import { createLog } from '@render/libs/logger'
import type { SessionData } from '@src/types/sessions/SessionData'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { logout as logoutAction, setIsLoggedIn, setUserData } from '../store/slices/appSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const isLoggedIn = useSelector((state: RootState) => state.app.isLoggedIn)
  const userData = useSelector((state: RootState) => state.app.userData)

  // 로그인 처리
  const login = async (loginData: SessionData) => {
    try {
      createLog('debug', '로그인 시도 중...', loginData.playerId)
      // 백엔드에 세션 저장 - 슬래시 제거하여 정확한 채널명 사용
      const success = await window.electron.login({
        playerId: loginData.playerId,
        playerToken: loginData.playerToken,
      })

      if (success) {
        createLog('debug', '로그인 성공', loginData)
        dispatch(setUserData(loginData))
        dispatch(setIsLoggedIn(true))
        return true
      }
      createLog('debug', '로그인 실패')
      return false
    } catch (error) {
      createLog('error', 'Login error:', error.message)
      return false
    }
  }

  // 로그아웃 처리
  const logout = async () => {
    try {
      // 백엔드에서 세션 제거
      const success = await window.electron.logout()

      if (success) {
        // 리덕스 스토어에서 사용자 데이터 제거
        dispatch(logoutAction())
        dispatch(setIsLoggedIn(false))
        return true
      }
      return false
    } catch (error) {
      createLog('error', 'Logout error:', error.message)
      return false
    }
  }

  // 로그인 상태 확인
  const checkLoginStatus = async () => {
    try {
      return await window.electron.checkLoggedIn()
    } catch (error) {
      createLog('error', 'Check login status error:', error.message)
      return false
    }
  }

  return {
    isLoggedIn,
    userData,
    login,
    logout,
    checkLoginStatus,
  }
}
