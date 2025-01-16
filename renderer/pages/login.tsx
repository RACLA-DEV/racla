import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import axios, { AxiosResponse } from 'axios'
import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import { useRouter } from 'next/router'
import { useParams } from 'next/navigation'
import { FaCircleInfo, FaLink, FaTriangleExclamation, FaUpload, FaV } from 'react-icons/fa6'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import { useDispatch } from 'react-redux'
import { setUserData, setVArchiveUserData } from 'store/slices/appSlice'
import { motion, AnimatePresence } from 'framer-motion'

export default function VArchiveLoginPage() {
  const { showNotification } = useNotificationSystem()
  const router = useRouter()
  const userData = useSelector((state: RootState) => state.app.userData)
  const vArchiveUserData = useSelector((state: RootState) => state.app.vArchiveUserData)
  const [isLogin, setIsLogin] = useState<boolean>(false)
  const [nickname, setNickname] = useState<string>('')
  const [isRegistering, setIsRegistering] = useState<boolean>(false)
  const [isLoginView, setIsLoginView] = useState<boolean>(true)
  const dispatch = useDispatch()

  useEffect(() => {
    if (isLogin) {
      router.push('/')
    }
  }, [isLogin])

  useEffect(() => {
    if (userData.userName !== '') {
      router.push('/')
    } else {
      dispatch(setVArchiveUserData({ userToken: '', userName: '', userNo: '' }))
      dispatch(setUserData({ userToken: '', userName: '', userNo: '' }))
    }
  }, [])

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(body: R): Promise<T> => {
    const { data } = await axios.post<T, AxiosResponse<T>, R>(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`, body, {
      withCredentials: false,
    })
    return data
  }

  const handleError = (error: string) => {
    showNotification(error, 'tw-bg-red-600')
    const ipcResult = window.ipc.logout()
  }

  const onRaFileChange = async (e) => {
    const file = e.target.files[0]
    const fileReader = new FileReader()
    fileReader.onload = () => {
      const text = fileReader.result.toString().trim()
      try {
        if (
          // account.txt 유효성 검증
          // 구분자(공백)이 존재하는지
          text.includes('|') &&
          // 구분자(공백)으로 나눈 후 배열의 길이가 2 인지(userNo, token)
          text.split('|').length === 2 &&
          // userNo로 추정되는 부분 인덱스(0)이 숫자로만 구성되어 있는지
          !Number.isNaN(Number(text.split('|')[0])) &&
          // token(uuidv4)으로 추정되는 부분 인덱스(1)에 - 문자가 포함되는지
          text.split('|')[1].includes('-') &&
          // uuid 구조상 첫 번째(time-low) 필드의 문자열 길이가 8인지
          text.split('|')[1].split('-')[0].length === 8 &&
          // uuid 구조상 두 번째(time-mid) 필드의 문자열 길이가 4인지
          text.split('|')[1].split('-')[1].length === 4 &&
          // uuid 구조상 세 번째(time-hight-and-version) 필드의 문자열 길이가 4인지
          text.split('|')[1].split('-')[2].length === 4 &&
          // uuid 구조상 네 번째(clock-seq-hi-and-reserved & clock-seq-low) 필드의 문자열 길이가 4인지
          text.split('|')[1].split('-')[3].length === 4 &&
          // uuid 구조상 다섯 번째(node) 필드의 문자열 길이가 12인지
          text.split('|')[1].split('-')[4].length === 12
        ) {
          const [userNo, userToken] = text.split('|')
          if (userNo && userToken) {
            const ipcResult = window.ipc.login({
              userNo: userNo,
              userToken: userToken,
              vArchiveUserNo: '',
              vArchiveUserToken: '',
            })
            setIsLogin(true)
            return
          }
        }
        handleError('유효하지 않은 사용자 정보입니다. RACLA 데스크톱 앱으로 생성한 로그인 데이터(player.txt) 파일을 선택해주세요.')
      } catch (e) {
        handleError('유효하지 않은 사용자 정보입니다. RACLA 데스크톱 앱으로 생성한 로그인 데이터(player.txt) 파일을 선택해주세요.')
      }
    }
    try {
      fileReader.readAsText(file)
    } catch (error) {
      handleError('알 수 없는 오류가 발생했습니다. 다시 시도해주세요. ' + String(error))
      if (raFileInputRef.current) {
        raFileInputRef.current.value = ''
      }
      if (vArchiveFileInputRef.current) {
        vArchiveFileInputRef.current.value = ''
      }
    }
  }

  const onVArchiveFileChange = async (e) => {
    const file = e.target.files[0]
    const fileReader = new FileReader()
    fileReader.onload = () => {
      const text = fileReader.result.toString().trim()
      try {
        if (
          // account.txt 유효성 검증
          // 구분자(공백)이 존재하는지
          text.includes(' ') &&
          // 구분자(공백)으로 나눈 후 배열의 길이가 2 인지(userNo, token)
          text.split(' ').length === 2 &&
          // userNo로 추정되는 부분 인덱스(0)이 숫자로만 구성되어 있는지
          !Number.isNaN(Number(text.split(' ')[0])) &&
          // token(uuidv4)으로 추정되는 부분 인덱스(1)에 - 문자가 포함되는지
          text.split(' ')[1].includes('-') &&
          // uuid 구조상 첫 번째(time-low) 필드의 문자열 길이가 8인지
          text.split(' ')[1].split('-')[0].length === 8 &&
          // uuid 구조상 두 번째(time-mid) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[1].length === 4 &&
          // uuid 구조상 세 번째(time-hight-and-version) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[2].length === 4 &&
          // uuid 구조상 네 번째(clock-seq-hi-and-reserved & clock-seq-low) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[3].length === 4 &&
          // uuid 구조상 다섯 번째(node) 필드의 문자열 길이가 12인지
          text.split(' ')[1].split('-')[4].length === 12
        ) {
          const data = getUserName({ userNo: text.split(' ')[0], token: text.split(' ')[1] })
          data.then((result) => {
            if (result.success) {
              const ipcResult = window.ipc.login({ vArchiveUserNo: text.split(' ')[0], vArchiveUserToken: text.split(' ')[1], userNo: '', userToken: '' })
              setIsLogin(true)
            } else {
              handleError('유효하지 않은 사용자 정보입니다. V-ARCHIVE 공식 클라이언트로 생성한 로그인 데이터(account.txt) 파일을 선택해주세요.')
            }
          })
        } else {
          handleError('유효하지 않은 사용자 정보입니다. V-ARCHIVE 공식 클라이언트로 생성한 로그인 데이터(account.txt) 파일을 선택해주세요.')
        }
      } catch (e) {
        handleError('알 수 없는 오류가 발생했습니다. 다시 시도해주세요. ' + String(e))
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
      handleError(String(error))
    }
  }

  const raFileInputRef = useRef<HTMLInputElement>(null)
  const vArchiveFileInputRef = useRef<HTMLInputElement>(null)

  // 각각의 파일 선택 핸들러
  const handleRaFileSelect = () => {
    showNotification('RACLA 데스크톱 앱으로 생성한 player.txt 파일을 선택해주세요.', 'tw-bg-blue-600')
    raFileInputRef.current?.click()
  }

  const handleVArchiveFileSelect = () => {
    showNotification('V-ARCHIVE 공식 클라이언트로 생성한 account.txt 파일을 선택해주세요.', 'tw-bg-blue-600')
    vArchiveFileInputRef.current?.click()
  }

  const handleRegister = async () => {
    if (!nickname.trim()) {
      showNotification('닉네임을 입력해주세요.', 'tw-bg-red-600')
      return
    }

    setIsRegistering(true)
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/user/register`, {
        userName: nickname,
      })

      if (response.status === 200) {
        const ipcResult = window.ipc.send('create-player-file', { userNo: response.data.userNo, userToken: response.data.userToken })
        showNotification('계정 생성이 완료되었습니다.', 'tw-bg-lime-600')
        setNickname('')
        const ipcResult2 = window.ipc.login({ userNo: response.data.userNo, userToken: response.data.userToken, vArchiveUserNo: null, vArchiveUserToken: null })
        setIsLogin(true)
      }
    } catch (error) {
      showNotification('계정 생성 중 오류가 발생했습니다.', 'tw-bg-red-600')
    }
    setIsRegistering(false)
  }

  return userData.userName === '' ? (
    <React.Fragment>
      <Head>
        <title>로그인 - RACLA</title>
      </Head>
      <div className="tw-h-[calc(100vh-7rem)] tw-flex tw-items-center tw-justify-center tw-py-12 tw-px-4">
        <div className="tw-w-full tw-max-w-md">
          <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-8 tw-overflow-hidden">
            {/* 상단 */}
            <div className="tw-flex tw-w-full tw-mb-6">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isLoginView ? 'login' : 'register'}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="tw-text-2xl tw-font-bold tw-text-white tw-me-auto"
                >
                  {isLoginView ? '로그인' : '계정 생성'}
                </motion.span>
              </AnimatePresence>
              <button onClick={() => setIsLoginView(!isLoginView)} className="tw-text-sm tw-text-gray-300 hover:tw-text-white tw-transition-colors">
                {isLoginView ? '계정 생성' : '로그인으로 돌아가기'}
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="tw-relative" style={{ minHeight: 'auto' }}>
              <AnimatePresence mode="wait">
                {isLoginView ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="tw-w-full"
                  >
                    {/* 로그인 섹션 내용 */}
                    <div className="tw-space-y-4">
                      <div className="tw-flex tw-flex-col tw-gap-4">
                        {/* 숨겨진 파일 input */}
                        <input ref={raFileInputRef} type="file" accept=".txt" onChange={onRaFileChange} className="tw-hidden" />
                        <input ref={vArchiveFileInputRef} type="file" accept=".txt" onChange={onVArchiveFileChange} className="tw-hidden" />

                        {/* 커스텀 버튼 */}
                        <button
                          onClick={handleRaFileSelect}
                          className="tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-3 tw-rounded-md tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-transition-colors"
                        >
                          <Image src="/images/logo.svg" alt="RACLA" width={20} height={20} className="tw-mt-1" />
                          RACLA 계정으로 로그인
                        </button>

                        <button
                          onClick={handleVArchiveFileSelect}
                          className="tw-w-full tw-mb-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-3 tw-rounded-md tw-bg-amber-600 hover:tw-bg-amber-700 tw-text-white tw-transition-colors"
                        >
                          <FaV className="tw-text-lg" />
                          V-ARCHIVE 계정으로 로그인
                        </button>
                      </div>

                      <div className="tw-flex tw-justify-center tw-gap-3 tw-items-start tw-text-sm tw-text-gray-300 tw-mt-6 tw-pt-8 tw-border-t tw-border-gray-700">
                        <FaCircleInfo className="tw-mt-1 tw-min-w-3 tw-text-blue-400" />
                        <div className="tw-flex tw-flex-col tw-gap-1 tw-break-keep">
                          <span>RACLA는 DJMAX RESPECT V 서비스에 한하여 V-ARCHIVE의 사용자 데이터를 수집 및 사용하고 있습니다.</span>
                          <span>V-ARCHIVE 계정 미연동 시 DJMAX RESPECT V 서비스는 사용할 수 없습니다.</span>
                          <span>V-ARCHIVE 계정으로 최초 로그인 시 자동으로 RACLA 계정이 자동으로 생성되며 V-ARCHIVE 계정 정보와 연동됩니다.</span>
                          <span
                            className="tw-flex tw-items-center tw-gap-1 tw-text-blue-400 hover:tw-text-blue-300 tw-cursor-pointer tw-transition-colors"
                            onClick={() => window.ipc.send('openBrowser', 'https://v-archive.net/downloads')}
                          >
                            V-ARCHIVE 공식 클라이언트 다운로드 바로가기 <FaLink />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="tw-w-full"
                  >
                    {/* 계정가입 섹션 내용 */}
                    <div className="tw-space-y-4">
                      <div className="tw-flex tw-flex-col tw-gap-4 tw-pb-4">
                        <input
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="닉네임을 입력해주세요(최대 20자)"
                          className="tw-w-full tw-px-4 tw-py-3 tw-rounded-md tw-bg-gray-700 tw-bg-opacity-50 tw-text-white tw-border tw-border-gray-600 focus:tw-border-blue-500 tw-outline-none"
                          maxLength={20}
                        />

                        <button
                          onClick={handleRegister}
                          disabled={isRegistering}
                          className="tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-3 tw-rounded-md tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                        >
                          {isRegistering ? '가입 중...' : '계정 생성'}
                        </button>
                      </div>

                      <div className="tw-flex tw-justify-center tw-gap-3 tw-items-start tw-text-sm tw-text-gray-300 tw-mt-6 tw-pt-8 tw-border-t tw-border-gray-700">
                        <FaCircleInfo className="tw-mt-1 tw-text-blue-400 tw-min-w-3" />
                        <div className="tw-flex tw-flex-col tw-gap-1 tw-break-keep">
                          <span>
                            계정 생성 시 자동으로 생성된 로그인 데이터가 담긴 player.txt 파일이 사용 중인 운영체제의 사용자 계정 문서 폴더에 위치한 RACLA에
                            저장되며 추후 로그인 시 사용됩니다.
                          </span>
                          <span>
                            계정 생성 시 서비스를 이용을 위한 플레이 데이터, 닉네임 정보, 접속 환경의 IP를 RACLA가 수집하는 것을 동의한 것으로 간주합니다. 해당
                            정보는 제3자에게 사용자의 동의 없이 제공되지 않습니다.
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  ) : (
    <></>
  )
}
