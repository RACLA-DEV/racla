import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { setOpenExternalLink } from '@render/store/slices/uiSlice'
import type { IUserNameRequest, IUserNameResponse } from '@src/types/common/IUserName'
import { ProxyResponse } from '@src/types/dto/proxy/ProxyResponse'
import { useEffect, useRef, useState } from 'react'
import { FaCircleInfo, FaDiscord, FaLink, FaV } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../../libs/apiClient'
import { useAuth } from '../../hooks/useAuth'
import { useNotificationSystem } from '../../hooks/useNotifications'
export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn } = useAuth()
  const { showNotification } = useNotificationSystem()
  const [isRegistering, setIsRegistering] = useState<boolean>(false)
  const [isLoginView, setIsLoginView] = useState<boolean>(true)
  const [nickname, setNickname] = useState<string>('')
  const userData = useSelector((state: RootState) => state.app.userData)
  const dispatch = useDispatch()

  const raFileInputRef = useRef<HTMLInputElement>(null)
  const vArchiveFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home')
    }
  }, [isLoggedIn, navigate])

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(
    body: R,
  ): Promise<ProxyResponse<T>> => {
    const { data } = await apiClient.postProxy<ProxyResponse<T>>(
      `https://v-archive.net/client/login`,
      body,
    )
    return data
  }

  const handleError = (error: string) => {
    // 실제 알림 시스템 구현 시 사용
    createLog('error', error)
    showNotification(error, 'error')
    window.electron.logout()
  }

  const onRaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileReader = new FileReader()

    fileReader.onload = async () => {
      const text = fileReader.result?.toString().trim() || ''

      try {
        if (
          // account.txt 유효성 검증
          text.includes('|') &&
          text.split('|').length === 2 &&
          !Number.isNaN(Number(text.split('|')[0])) &&
          text.split('|')[1].includes('-') &&
          text.split('|')[1].split('-')[0].length === 8 &&
          text.split('|')[1].split('-')[1].length === 4 &&
          text.split('|')[1].split('-')[2].length === 4 &&
          text.split('|')[1].split('-')[3].length === 4 &&
          text.split('|')[1].split('-')[4].length === 12
        ) {
          const [userNo, userToken] = text.split('|')
          if (userNo && userToken) {
            const success = await login({
              userNo,
              userToken,
              userName: '',
              vArchiveUserNo: null,
              vArchiveUserToken: '',
            })

            if (success) {
              showNotification(`${nickname}님 RACLA에 오신 것을 환영합니다.`, 'success')
              navigate('/home')
            }
            return
          }
        }
        handleError(
          '유효하지 않은 사용자 정보입니다. RACLA 데스크톱 앱으로 생성한 로그인 데이터(player.txt) 파일을 선택해주세요.',
        )
      } catch (error) {
        createLog('error', 'Error in onRaFileChange:', error.message)
        handleError(
          '유효하지 않은 사용자 정보입니다. RACLA 데스크톱 앱으로 생성한 로그인 데이터(player.txt) 파일을 선택해주세요.',
        )
      }
    }

    try {
      fileReader.readAsText(file)
    } catch (error) {
      createLog('error', 'Error reading file:', error.message)
      handleError('알 수 없는 오류가 발생했습니다. 다시 시도해주세요.')
      if (raFileInputRef.current) {
        raFileInputRef.current.value = ''
      }
      if (vArchiveFileInputRef.current) {
        vArchiveFileInputRef.current.value = ''
      }
    }
  }

  const onVArchiveFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileReader = new FileReader()

    fileReader.onload = async () => {
      const text = fileReader.result?.toString().trim() || ''

      try {
        if (
          // account.txt 유효성 검증
          text.includes(' ') &&
          text.split(' ').length === 2 &&
          !Number.isNaN(Number(text.split(' ')[0])) &&
          text.split(' ')[1].includes('-') &&
          text.split(' ')[1].split('-')[0].length === 8 &&
          text.split(' ')[1].split('-')[1].length === 4 &&
          text.split(' ')[1].split('-')[2].length === 4 &&
          text.split(' ')[1].split('-')[3].length === 4 &&
          text.split(' ')[1].split('-')[4].length === 12
        ) {
          try {
            const userNo = text.split(' ')[0]
            const token = text.split(' ')[1]

            // V-ARCHIVE API로 유저 이름 가져오기
            const result = await getUserName({ userNo, token })

            if (result.data.success) {
              // RACLA 서버 API에 V-ARCHIVE 정보로 로그인
              const response = await apiClient.post<any>(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/v2/racla/user/login/oauth/vArchive`,
                { userNo, userToken: token },
              )

              if (response.status === 200 && response.data) {
                const success = await login({
                  userNo: response.data.userNo,
                  userToken: response.data.userToken,
                  userName: response.data.userName || '',
                  discordUid: response.data.discordUid || '',
                  discordLinked: response.data.discordLinked || false,
                  vArchiveUserNo: Number(userNo),
                  vArchiveUserToken: token,
                  vArchiveUserName: result.data.nickname,
                  vArchiveLinked: true,
                })

                if (success) {
                  showNotification(
                    `${response.data.userName}님 RACLA에 오신 것을 환영합니다.`,
                    'success',
                  )
                  navigate('/home')
                }
              } else {
                handleError('V-ARCHIVE 로그인 실패')
              }
            } else {
              handleError(
                '유효하지 않은 사용자 정보입니다. V-ARCHIVE 공식 클라이언트로 생성한 로그인 데이터(account.txt) 파일을 선택해주세요.',
              )
            }
          } catch (error) {
            createLog('error', 'V-ARCHIVE 로그인 오류:', error.message)
            handleError('V-ARCHIVE 서버 연결 중 오류가 발생했습니다.')
          }
        } else {
          handleError(
            '유효하지 않은 사용자 정보입니다. V-ARCHIVE 공식 클라이언트로 생성한 로그인 데이터(account.txt) 파일을 선택해주세요.',
          )
        }
      } catch (error) {
        createLog('error', 'Error in onVArchiveFileChange:', error.message)
        handleError('알 수 없는 오류가 발생했습니다. 다시 시도해주세요.')
        if (vArchiveFileInputRef.current) {
          vArchiveFileInputRef.current.value = ''
        }
        if (raFileInputRef.current) {
          raFileInputRef.current.value = ''
        }
      }
    }

    try {
      fileReader.readAsText(file)
    } catch (error) {
      createLog('error', 'Error reading file:', error.message)
      handleError('알 수 없는 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const handleVArchiveFileSelect = () => {
    createLog('debug', 'V-ARCHIVE 공식 클라이언트로 생성한 account.txt 파일을 선택해주세요.')
    vArchiveFileInputRef.current?.click()
  }

  const handleDiscordLogin = async () => {
    try {
      const code = await window.electron.openDiscordLogin()
      createLog('debug', 'Received Discord OAuth Code:', code)

      if (!code) {
        handleError('Discord 로그인 취소됨')
        return
      }

      const response = await apiClient.post<any>(`/v2/racla/user/login/oauth/discord`, { code })

      if (response.status === 200 && response.data) {
        const success = await login({
          userNo: response.data.userNo,
          userToken: response.data.userToken,
          userName: response.data.userName || '',
          discordUid: response.data.discordUid || '',
          discordLinked: true,
          vArchiveUserNo: response.data.varchiveUserNo || '',
          vArchiveUserToken: response.data.varchiveUserToken || '',
          vArchiveUserName:
            response.data.varchiveUserNo && response.data.varchiveUserToken
              ? (
                  await getUserName({
                    userNo: response.data.varchiveUserNo,
                    token: response.data.varchiveUserToken,
                  })
                ).data.nickname
              : '',
          vArchiveLinked: response.data.varchiveLinked || false,
        })

        if (success) {
          showNotification(`${response.data.userName}님 RACLA에 오신 것을 환영합니다.`, 'success')
          navigate('/home')
        }
      } else {
        handleError('Discord 로그인 실패')
      }
    } catch (error) {
      createLog('error', 'Discord 로그인 오류:', error.message)
      handleError('Discord로 로그인 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className='tw:flex tw:h-[calc(100vh-7rem)] tw:items-center tw:justify-center tw:px-4 tw:py-12'>
      <div className='tw:w-full tw:max-w-md'>
        <div className='tw:flex tw:flex-col tw:gap-1 tw:overflow-hidden tw:rounded-lg tw:bg-slate-800 tw:p-8 tw:shadow-lg dark:tw:bg-slate-800'>
          {/* 상단 */}
          <div className='tw:mb-6 tw:flex tw:w-full'>
            <span className='tw:me-auto tw:text-2xl tw:font-bold'>
              {isLoginView ? '로그인' : '계정 생성'}
            </span>
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className='tw:text-sm tw:text-slate-300 tw:transition-colors hover:tw:text-white'
            >
              {isLoginView ? '계정 생성' : '로그인으로 돌아가기'}
            </button>
          </div>

          {/* 컨텐츠 */}
          <div className='tw:relative' style={{ minHeight: 'auto' }}>
            {isLoginView ? (
              <div className='tw:w-full'>
                {/* 로그인 섹션 내용 */}
                <div className='tw:space-y-4'>
                  <div className='tw:flex tw:flex-col tw:gap-4'>
                    {/* 숨겨진 파일 input */}
                    <input
                      ref={raFileInputRef}
                      type='file'
                      accept='.txt'
                      onChange={onRaFileChange}
                      className='tw:hidden'
                    />
                    <input
                      ref={vArchiveFileInputRef}
                      type='file'
                      accept='.txt'
                      onChange={onVArchiveFileChange}
                      className='tw:hidden'
                    />

                    {/* 로그인 버튼 */}
                    <button
                      onClick={handleDiscordLogin}
                      className='tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-md tw:bg-[#5865F2] tw:px-4 tw:py-3 tw:text-white tw:transition-colors hover:tw:bg-[#4752C4]'
                    >
                      <FaDiscord className='tw:text-lg' />
                      Discord로 로그인
                    </button>

                    <button
                      onClick={handleVArchiveFileSelect}
                      className='tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-md tw:bg-amber-600 tw:px-4 tw:py-3 tw:text-white tw:transition-colors hover:tw:bg-amber-700'
                    >
                      <FaV className='tw:text-base' />
                      V-ARCHIVE로 로그인
                    </button>

                    {/* <button
                      onClick={handleRaFileSelect}
                      className='tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-md tw:bg-blue-600 tw:px-4 tw:py-3 tw:text-white tw:transition-colors hover:tw:bg-blue-700'
                    >
                      RACLA로 로그인
                    </button> */}
                  </div>

                  <div className='tw:mt-6 tw:flex tw:items-start tw:justify-center tw:gap-3 tw:border-t tw:border-slate-700 tw:pt-8 tw:text-sm tw:text-slate-300'>
                    <FaCircleInfo className='tw:mt-1 tw:min-w-3 tw:text-blue-400' />
                    <div className='tw:flex tw:flex-col tw:gap-1 tw:break-keep'>
                      <span>
                        RACLA는 V-ARCHIVE와 Discord의 사용자 데이터를 수집 및 사용하고 있습니다.
                      </span>
                      <span>
                        V-ARCHIVE 계정 미연동 시 DJMAX RESPECT V 서비스 중 일부 기능은 사용할 수
                        없습니다.
                      </span>
                      <span>
                        V-ARCHIVE 또는 Discord로 최초 로그인 시 자동으로 RACLA 계정이 생성되며
                        해당되는 서비스의 계정 정보와 연동됩니다.
                      </span>
                      <span>연동 관련 설정은 로그인 후 설정 페이지에서 확인할 수 있습니다.</span>
                      <span
                        className='tw:flex tw:cursor-pointer tw:items-center tw:gap-1 tw:text-blue-400 tw:transition-colors hover:tw:text-blue-300'
                        onClick={() =>
                          dispatch(setOpenExternalLink('https://v-archive.net/downloads'))
                        }
                      >
                        V-ARCHIVE 공식 클라이언트 다운로드 바로가기 <FaLink />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='tw:w-full'>
                {/* 계정가입 섹션 내용 */}
                <div className='tw:space-y-4'>
                  <div className='tw:flex tw:flex-col tw:gap-4 tw:pb-4'>
                    <input
                      type='text'
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder='닉네임을 입력해주세요(최대 20자)'
                      className='tw:bg-opacity-50 tw:w-full tw:rounded-md tw:border tw:border-slate-600 tw:bg-slate-700 tw:px-4 tw:py-3 tw:text-white tw:outline-none focus:tw:border-blue-500'
                      maxLength={20}
                    />

                    {/* <button
                      onClick={handleRegister}
                      disabled={isRegistering}
                      className='tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-md tw:bg-blue-600 tw:px-4 tw:py-3 tw:text-white tw:transition-colors hover:tw:bg-blue-700 disabled:tw:cursor-not-allowed disabled:tw:opacity-50'
                    >
                      {isRegistering ? '가입 중...' : '계정 생성'}
                    </button> */}
                  </div>

                  <div className='tw:mt-6 tw:flex tw:items-start tw:justify-center tw:gap-3 tw:border-t tw:border-slate-700 tw:pt-8 tw:text-sm tw:text-slate-300'>
                    <FaCircleInfo className='tw:mt-1 tw:min-w-3 tw:text-blue-400' />
                    <div className='tw:flex tw:flex-col tw:gap-1 tw:break-keep'>
                      <span>
                        계정 생성 시 자동으로 생성된 로그인 데이터가 담긴 player.txt 파일이 사용
                        중인 운영체제의 사용자 계정 문서 폴더에 위치한 RACLA에 저장되며 추후 로그인
                        시 사용됩니다.
                      </span>
                      <span>
                        계정 생성 시 서비스를 이용을 위한 플레이 데이터, 닉네임 정보, 접속 환경의
                        IP를 RACLA가 수집하는 것을 동의한 것으로 간주합니다. 해당 정보는 제3자에게
                        사용자의 동의 없이 제공되지 않습니다.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
