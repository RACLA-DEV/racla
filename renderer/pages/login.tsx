import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import axios, { AxiosResponse } from 'axios'
import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import { useRouter } from 'next/router'
import { useParams } from 'next/navigation'
import { FaCircleInfo, FaLink, FaTriangleExclamation } from 'react-icons/fa6'

export default function VArchiveLoginPage({ addNotificationCallback, userData }) {
  const router = useRouter()

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(body: R): Promise<T> => {
    const { data } = await axios.post<T, AxiosResponse<T>, R>(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`, body, {
      withCredentials: false,
    })
    return data
  }

  const handleError = (error?: string) => {
    addNotificationCallback(
      '유효하지 않은 사용자 정보입니다. V-ARCHIVE 공식 클라이언트 실행 파일이 위치한 폴더의 account.txt 파일을 선택해주세요.',
      'tw-bg-red-600',
    )
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
              router.push(`${String(router.query.url)}`)
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

  if (userData.userName !== '') {
    if (router.query.url !== undefined) {
      router.push(`${String(router.query.url)}`)
    } else {
      router.push('/')
    }
  } else {
    return (
      <React.Fragment>
        <Head>
          <title>DJMAX REPSECT V(V-ARCHIVE) 로그인 - 프로젝트 RA</title>
        </Head>
        <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-mb-4">
          {/* 상단 */}
          <div className="tw-flex tw-w-full">
            {/* 제목 */}
            <span className="tw-text-lg tw-font-bold me-auto">로그인</span>
            <div className="tw-flex tw-gap-2"></div>
          </div>

          {/* 내용 */}
          <span>프로젝트 RA는 V-ARCHIVE과 동일한 포맷의 사용자 데이터를 수집 및 사용하고 있습니다.</span>
          <span>V-ARCHIVE 공식 클라이언트 실행 파일이 위치한 폴더의 account.txt 파일 또는 프로젝트 RA로 생성한 account.txt 파일을 선택해주세요.</span>
          <input
            className="form-control tw-mt-2 tw-text-sm tw-bg-gray-900 tw-bg-opacity-20"
            placeholder="account.txt"
            type="file"
            accept=".txt"
            onChange={onFileChange}
          />
          <br />

          <span className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold tw-mt-4">
            <FaCircleInfo />
            <div className="tw-flex tw-flex-col">
              <span>현재 회원가입은 V-ARCHIVE 공식 클라이언트에서만 가능합니다.</span>
              <span>추후 V-ARCHIVE와 연동된 회원가입이 제공될 예정입니다.</span>
              <span className="tw-flex tw-items-center tw-cursor-pointer" onClick={() => window.ipc.send('openBrowser', 'https://v-archive.net/downloads')}>
                V-ARCHIVE 공식 클라이언트 다운로드 바로가기(
                <FaLink />)
              </span>
            </div>
          </span>
        </div>
      </React.Fragment>
    )
  }
}
