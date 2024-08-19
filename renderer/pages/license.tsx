import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { FaLink, FaTriangleExclamation } from 'react-icons/fa6'
import { IconContext } from 'react-icons'

export default function LicensePage() {
  return (
    <React.Fragment>
      <Head>
        <title>라이선스 - 프로젝트 RA</title>
      </Head>
      <div className="tw-flex tw-flex-col tw-gap-2 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-mb-4">
        {/* 상단 */}
        <div className="tw-flex tw-w-full">
          {/* 제목 */}
          <span className="tw-text-lg tw-font-bold me-auto">라이선스</span>
          <div className="tw-flex tw-gap-2"></div>
        </div>

        {/* 내용 */}
        <span>
          1. 프로젝트 RA는 아래의 명시된 출처(게임)의 성과 관리 도구 애플리케이션(이하 팬 애플리케이션)이며, 애플리케이션 내 사용된 모든 컨텐츠(이미지, 문구
          등)의 저작권은 명시된 저작권자에게 있습니다.
        </span>
        <span>2. 명시된 콘텐츠 내부에 포함된 저작권 또한 각각의 콘텐츠의 저작권자에게 있습니다.</span>
        <span>
          3. 해당 애플리케이션은 개인적인 사용을 위한 비상업적인 용도로만 서비스가 제공됩니다. 애플리케이션 내부의 콘텐츠를 상업적이거나 공공의 목적으로
          다운로드, 수정, 유통하는 등 어떠한 방식으로도 사용할 수 없습니다.
        </span>
        <br />

        <span className="tw-text-base tw-font-bold">저작권 출처</span>
        <span className="tw-flex tw-items-center tw-gap-1">
          <IconContext.Provider value={{ className: 'tw-flex-inline-flex' }}>
            <FaLink />
          </IconContext.Provider>
          <span
            className="tw-flex-inline-flex tw-gap-1 tw-items-center tw-cursor-pointer"
            onClick={() => window.ipc.send('openBrowser', 'https://store.steampowered.com/app/960170')}
          >
            DJMAX RESPECT V(게임)
          </span>
          <span className="tw-inline-flex"> - </span>
          <span className="tw-inline-flex tw-gap-1 tw-items-center tw-cursor-pointer" onClick={() => window.ipc.send('openBrowser', 'https://www.neowiz.com/')}>
            네오위즈(NEOWIZ)
          </span>
        </span>
        <span
          className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer"
          onClick={() => window.ipc.send('openBrowser', 'https://waktaverse.games/gameDetail/wjmax/')}
        >
          <FaLink /> WJMAX(왁제이맥스, DJMAX REPSECT V 공식 팬 게임) - 왁제이맥스 팀(WJMAX STUDIO) / 왁타버스 게임즈(Waktaverse Games)
        </span>
        <span
          className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer"
          onClick={() => window.ipc.send('openBrowser', 'https://cafe.naver.com/tteokbokk1/533412')}
        >
          <FaLink /> TJMAX(텔제이맥스, DJMAX REPSECT V 유저 팬 게임) - realKM
        </span>
        <span className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer" onClick={() => window.ipc.send('openBrowser', 'https://stellive.me/')}>
          <FaLink /> TJMAX(DJMAX REPSECT V 유저 팬 게임)에서 사용된 리소스 - 스텔라이브(StelLive)
        </span>
        <span className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer" onClick={() => window.ipc.send('openBrowser', 'https://v-archive.net/')}>
          <FaLink /> V-ARCHIVE(DJMAX RESPECT V의 유저 제작 웹 성과 관리 도구) - V-ARCHIVE
        </span>
        <br />

        <span className="tw-text-base tw-font-bold">외부 연동 API</span>
        <span
          className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer"
          onClick={() => window.ipc.send('openBrowser', 'https://github.com/djmax-in/openapi?tab=readme-ov-file')}
        >
          <FaLink /> V-ARCHIVE Open API - V-ARCHIVE
        </span>
        <span className="tw-flex tw-gap-1 tw-items-center tw-cursor-pointer" onClick={() => window.ipc.send('openBrowser', 'https://github.com/Lunatica-Luna')}>
          <FaLink /> LunaticaLuna CORS Proxy API - LunaticaLuna
        </span>
        <br />

        <span className="tw-flex tw-justify-end tw-gap-2 tw-items-center tw-text-xs tw-font-semibold tw-mt-4">
          <FaTriangleExclamation />
          <div className="tw-flex tw-flex-col">
            <span>해당 라이선스는 최종적인 버전이 아닙니다.</span>
            <span>명시된 라이선스에 대한 이의 제기/수정 요청은 개발자에게 문의바랍니다.</span>
          </div>
        </span>
      </div>
    </React.Fragment>
  )
}
