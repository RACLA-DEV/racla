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

        <span className="tw-text-base tw-font-bold">9월부터 10월까지 업데이트가 중단된 내용</span>
        <span>프로젝트 RA는 개발자의 여유 시간에 개발 중인 개인 프로젝트로서 본업에 대한 중요한 일정이 발생하여 작업을 일시적으로 중단하였습니다.</span>
        <span>9월부터 10월까지 업데이트에 대한 로드맵이 있었으나 중단된 것에 대하여 아래와 같은 내용을 공지합니다.</span>
        <span>기존에 계획된 로드맵은 다시 정리하여 추후 제공될 업데이트를 통해 사용자 여러분께 제공할 예정입니다.</span>
        <span>사용자 여러분께 미리 공지하지 못한 점에 대하여 늦게나마 깊은 사과의 말씀을 드립니다.</span>
        <span>앞으로 더 나은 서비스를 제공할 수 있도록 노력하겠습니다. 감사합니다.</span>
        <br />

        <span className="tw-text-base tw-font-bold">0.4.X 주요 업데이트 내용</span>
        <span>1. DJMAX RESPECT V의 TEKKEN PACK DLC(이하 철권 DLC)를 대응할 수 있도록 기능을 추가하였습니다. 단 BGA는 일시적으로 제공되지 않습니다.</span>
        <span>2. MAX DJ POWER 데이터를 V-ARCHIVE 2024년 11월 18일 오전 03시 45분 기준으로 업데이트하였습니다.</span>
        <span>3. 기존의 개발자가 사용하던 서버의 계약 만료로 인해 새로운 서버를 구축 후 서비스를 지속할 수 있도록 하였습니다.</span>
        <span>4. XCap API를 통해 게임 화면을 캡쳐하는 기능을 추가하였습니다. Electron API 대비 캡쳐 속도와 캡쳐 화면의 인식율이 개선되었습니다.</span>
        <span>5. 일부 디자인 요소와 리소스가 누락되어 있던 부분을 수정하였습니다.</span>
        <span
          className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer"
          onClick={() => window.ipc.send('openBrowser', 'https://github.com/Lunatica-Luna/project-ra/releases')}
        >
          <FaGithub />업데이트 내역 확인하러 가기(Github)
        </span>
        <br />

        <span className="tw-text-base tw-font-bold">현재 작업 중인 내용</span>
        {/* <span>
          1. 애플리케이션 확장성 테스트를 위해 WJMAX(왁제이맥스), TJMAX(텔제이맥스)가 서비스 항목 탭에 추가되었습니다. 추후 제공될 업데이트를 통해 사용이
          가능합니다.
        </span> */}
        <span>1. 라이벌 사용자를 등록하여 DJ 코멘트 외 콘텐츠에서도 점수 비교 등을 할 수 있는 기능을 작업을 진행 중에 있습니다.</span>
        <span>2. 추천 옵션과 코멘트(팁)을 표시하기 위한 게임 화면 인식 오버레이을 작업을 진행 중에 있습니다.</span>
        <span>3. 성과 기록 성과표(V-ARCHIVE)를 컨버팅 작업 중에 있습니다.</span>
        <span>4. 가독성 향상 작업을 지속적으로 진행 중에 있습니다.</span>
        <span>5. 철권 DLC의 BGA 제공을 위한 작업을 진행 중에 있습니다.</span>
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
