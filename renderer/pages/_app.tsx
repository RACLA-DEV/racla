import React, { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import { Noto_Sans_KR } from 'next/font/google'
import axios, { AxiosResponse } from 'axios'

interface IUserNameRequest {
  token: string
  userNo: string
}

interface IUserNameResponse {
  success: boolean
  nickname: string
}

const noto = Noto_Sans_KR({
  subsets: ['latin'], // 또는 preload: false
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--noto-sans-kr',
})

import 'bootstrap/dist/css/bootstrap.min.css'
import '@styles/globals.css'
import NavComponent from '@/components/NavComponent'
import FooterComponent from '@/components/FooterComponent'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Bootstrap
    require('bootstrap/dist/js/bootstrap.bundle.min.js')
    // preload.ts 에서 정의된 ipc 로드
  }, [])

  const [userNo, setUserNo] = useState<string>('')
  const [userToken, setUserToken] = useState<string>('')
  const [userError, setUserError] = useState<string>('')
  const [userName, setUserName] = useState<string>('')

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(body: R): Promise<T> => {
    const { data } = await axios.post<T, AxiosResponse<T>, R>('https://cors.lunatica.kr/proxy?url=https://v-archive.net/client/login', body, {
      withCredentials: false,
    })
    return data
  }

  // const getUserName = async (body) => {
  //   const data = await fetch('/varchive/client/login', {
  //     method: 'post',
  //     credentials: 'include',
  //     body: JSON.stringify(body),
  //   }).then((res) => {
  //     console.log(res)
  //   })
  //   return data
  // }

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
              setUserNo(text.split(' ')[0])
              setUserToken(text.split(' ')[1])
              setUserError('')
              setUserName(result.nickname)
            } else {
              setUserNo('')
              setUserToken('')
              setUserError('유효하지 않은 유저 정보입니다. V-ARCHIVE 클라이언트 실행 파일이 위치한 폴더의 account.txt 파일을 선택해주세요.')
              setUserName('')
            }
          })
        } else {
          setUserNo('')
          setUserToken('')
          setUserError('유효하지 않은 유저 정보입니다. V-ARCHIVE 클라이언트 실행 파일이 위치한 폴더의 account.txt 파일을 선택해주세요.')
          setUserName('')
        }
      } catch (e) {
        setUserNo('')
        setUserToken('')
        setUserError('유효하지 않은 유저 정보입니다. V-ARCHIVE 클라이언트 실행 파일이 위치한 폴더의 account.txt 파일을 선택해주세요.')
        setUserName('')
      }
    }
    try {
      fileReader.readAsText(file)
    } catch (error) {
      setUserNo('')
      setUserToken('')
      setUserError(String(error))
      setUserName('')
    }
  }

  return (
    <>
      <div className="background-image" />
      <div className="background-image-color" />
      <main className={noto.className + ' tw-mx-2 tw-my-12 tw-text-sm'} data-bs-theme="dark">
        <NavComponent
          className={noto.className}
          user={{ userNo, userToken, userName }}
          logoutCallback={() => {
            setUserNo('')
            setUserToken('')
            setUserName('')
          }}
        />
        <Component {...pageProps} />
        <input className="form-control" type="file" accept=".txt" onChange={onFileChange} />
        <div className="tw-flex tw-flex-col">
          <div>
            <span>userNo : </span>
            <span>{userNo}</span>
          </div>
          <div>
            <span>userToken : </span>
            <span>{userToken}</span>
          </div>
          <div>
            <span>userError : </span>
            <span>{userError}</span>
          </div>
          <div>
            <span>userName : </span>
            <span>{userName}</span>
          </div>
        </div>
        <FooterComponent className={noto.className} />
      </main>
    </>
  )
}

export default MyApp
