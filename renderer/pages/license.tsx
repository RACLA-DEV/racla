import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

export default function LicensePage() {
  return (
    <React.Fragment>
      <Head>
        <title>라이센스 - 프로젝트 RA</title>
      </Head>
      <div className="tw-flex tw-flex-col tw-gap-0">
        <span className="tw-text-2xl tw-font-bold">라이선스</span>
        <span className="tw-mb-2">
          프로젝트 RA는 아래의 명시된 출처(게임)의 팬 애플리케이션이며, 애플리케이션 내 사용된 모든 컨텐츠(이미지, 문구 등)의 저작권은 명시된 저작권자에게
          있습니다.
        </span>
        <span className="tw-text-lg tw-font-bold">저작권 출처</span>
        <span>DJMAX RESPECT V(게임) - NEOWIZ</span>
        <span className="tw-mb-2">V-ARCHIVE(DJMAX RESPECT V의 유저 제작 웹 성과 관리 도구) - V-ARCHIVE</span>
        <span className="tw-text-lg tw-font-bold">외부 연동 API</span>
        <span>V-ARCHIVE Open API - V-ARCHIVE</span>
        <span className="tw-mb-2">LunaticaLuna CORS Free Proxy API - LunaticaLuna</span>
      </div>
    </React.Fragment>
  )
}
