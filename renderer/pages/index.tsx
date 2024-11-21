import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { FaGithub, FaLink, FaTriangleExclamation } from 'react-icons/fa6'

export default function HomePage() {
  return (
    <React.Fragment>
      <Head>
        <title>홈 - 프로젝트 RA</title>
      </Head>

      <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-mb-4">
        {/* 상단 */}
        <div className="tw-flex tw-w-full">
          {/* 제목 */}
          <span className="tw-text-lg tw-font-bold me-auto">
            🙋‍♂️
            {new Date().getHours() >= 6 && new Date().getHours() < 12
              ? '좋은 아침입니다.'
              : new Date().getHours() >= 12 && new Date().getHours() < 18
              ? '오늘도 힘내세요. 멋진 오후가 되시길 바랍니다.'
              : new Date().getHours() >= 18 && new Date().getHours() < 24
              ? '오늘 하루도 고생하셨습니다.'
              : '고요한 새벽입니다. 평온한 시간 되시길 바랍니다.'}
          </span>
          <div className="tw-flex tw-gap-2"></div>
        </div>

        <span className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold tw-mt-4">
          <FaTriangleExclamation />
          <div className="tw-flex tw-flex-col">
            <span>해당 버전은 최종적인 버전이 아닙니다.</span>
            <span>추가적인 개발, 피드백 반영 사항 등에 따라 기능이 일부 변경될 수 있습니다.</span>
          </div>
        </span>
      </div>
    </React.Fragment>
  )
}
