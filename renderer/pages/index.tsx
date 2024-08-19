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
          <span className="tw-text-lg tw-font-bold me-auto">🙋‍♂️ 환영합니다.</span>
          <div className="tw-flex tw-gap-2"></div>
        </div>

        {/* 내용 */}
        <span>프로젝트 RA는 지속적으로 개발 중인 애플리케이션으로 사용자 여러분의 소중한 의견을 수집하여 서비스가 제공됩니다.</span>
        <span>애플리케이션의 UI/UX를 개선하고, 사용자 경험을 향상시키기 위해 여러분의 피드백이 필요합니다.</span>
        <span>사용 중 문제를 발견하거나 개선할 점이 있다면, 개발자에게 피드백을 남겨 주세요.</span>
        <span>여러분의 참여가 프로젝트 RA를 더 나은 방향으로 발전시키는 데 큰 도움이 됩니다. 감사합니다.</span>
        <br />

        <span className="tw-text-base tw-font-bold">공지사항</span>
        <span>1. 서열표 데이터 조회 시 애플리케이션 문제가 발생하여 일시적으로 접근 제한 조치하였습니다.</span>
        <span className="tw-flex tw-gap-1 tw-items-center">
          2. 애플리케이션 내 제공되는 콘텐츠가 많아짐에 따라 최소 요구 해상도가 <span className="tw-font-bold">1440x810</span>으로 변경되었습니다.
        </span>
        <span>
          3. 애플리케이션 확장성 테스트를 위해 WJMAX(왁제이맥스), TJMAX(텔제이맥스)가 서비스 항목에 추가되었습니다. 추후 메이저(또는 마이너) 업데이트를 통해
          사용이 가능합니다.
        </span>
        <span>4. BGA 또는 프리뷰 영상을 배경으로 표시하기 위한 기능을 준비 중에 있습니다.</span>
        <span>5. 라이선스 고지 내용이 업데이트 되었습니다.</span>

        <br />

        <span className="tw-text-base tw-font-bold">업데이트 내용</span>
        <span
          className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer"
          onClick={() => window.ipc.send('openBrowser', 'https://github.com/Lunatica-Luna/project-ra/releases')}
        >
          <FaGithub /> 업데이트 내용 확인하러 가기(Github)
        </span>
        <br />

        <span className="tw-text-base tw-font-bold">피드백 & 버그 신고</span>
        <span
          className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer"
          onClick={() => window.ipc.send('openBrowser', 'https://open.kakao.com/me/LunaticaLuna')}
        >
          <FaLink /> 개발자 오픈프로필 바로가기
        </span>

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
