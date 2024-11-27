import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import axios, { AxiosResponse } from 'axios'
import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import { useRouter } from 'next/router'
import { useParams } from 'next/navigation'
import { FaCircleInfo, FaLink, FaTriangleExclamation, FaUpload } from 'react-icons/fa6'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { useNotificationSystem } from '@/libs/client/useNotifications'

export default function VArchiveLoginPage() {
  const { showNotification } = useNotificationSystem()
  const router = useRouter()
  const userData = useSelector((state: RootState) => state.app.userData)
  const [isLogin, setIsLogin] = useState<boolean>(false)

  useEffect(() => {
    if (isLogin) {
      router.push(`${String(router.query.url)}`)
    }
  }, [isLogin])

  useEffect(() => {
    if (userData.userName !== '') {
      router.push('/projectRa/home')
    }
  }, [])

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(body: R): Promise<T> => {
    const { data } = await axios.post<T, AxiosResponse<T>, R>(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`, body, {
      withCredentials: false,
    })
    return data
  }

  const handleError = (error?: string) => {
    showNotification('유효하지 않은 사용자 정보입니다. V-ARCHIVE 공식 클라이언트로 생성한 로그인 데이터(account.txt) 파일을 선택해주세요.', 'tw-bg-red-600')
    const ipcResult = window.ipc.logout()
  }

  const onFileChange = async (e) => {
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
              const ipcResult = window.ipc.login({ userNo: text.split(' ')[0], userToken: text.split(' ')[1] })
              setIsLogin(true)
            } else {
              handleError()
            }
          })
        } else {
          handleError()
        }
      } catch (e) {
        handleError()
      }
    }
    try {
      fileReader.readAsText(file)
    } catch (error) {
      handleError(String(error))
    }
  }

  // useRef 추가
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 선택 핸들러 추가
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <React.Fragment>
      <Head>
        <title>DJMAX REPSECT V(V-ARCHIVE) 로그인 - 프로젝트 RA</title>
      </Head>
      <div className="tw-h-[calc(100vh-7rem)] tw-flex tw-items-center tw-justify-center tw-py-12 tw-px-4">
        <div className="tw-w-full tw-max-w-md">
          <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-8">
            {/* 상단 */}
            <div className="tw-flex tw-w-full tw-mb-6">
              {/* 제목 */}
              <span className="tw-text-2xl tw-font-bold tw-text-white tw-me-auto">로그인</span>
              <div className="tw-flex tw-gap-2"></div>
            </div>

            {/* 내용 */}
            <div className="tw-space-y-4">
              <div className="tw-flex tw-flex-col tw-gap-4">
                <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded">
                  <p>V-ARCHIVE 공식 클라이언트로 생성한 로그인 데이터 파일을 선택해주세요.</p>
                </div>

                {/* 숨겨진 파일 input */}
                <input ref={fileInputRef} type="file" accept=".txt" onChange={onFileChange} className="tw-hidden" />

                {/* 커스텀 버튼 */}
                <button
                  onClick={handleFileSelect}
                  className="tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-3 tw-rounded-md tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-transition-colors"
                >
                  <FaUpload className="tw-text-lg" />
                  파일 선택(account.txt)
                </button>

                <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
                  <p className="tw-mb-2">프로젝트 RA는 V-ARCHIVE의 사용자 데이터를 수집 및 사용하고 있습니다.</p>
                </div>
              </div>

              <div className="tw-flex tw-justify-center tw-gap-3 tw-items-start tw-text-xs tw-text-gray-300 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-700">
                <FaCircleInfo className="tw-mt-1 tw-text-blue-400" />
                <div className="tw-flex tw-flex-col tw-gap-1">
                  <span>현재 회원가입은 V-ARCHIVE 공식 클라이언트에서만 가능합니다.</span>
                  <span>추후 V-ARCHIVE와 연동된 회원가입이 제공될 예정입니다.</span>
                  <span
                    className="tw-flex tw-items-center tw-gap-1 tw-text-blue-400 hover:tw-text-blue-300 tw-cursor-pointer tw-transition-colors"
                    onClick={() => window.ipc.send('openBrowser', 'https://v-archive.net/downloads')}
                  >
                    V-ARCHIVE 공식 클라이언트 다운로드 바로가기 <FaLink />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
