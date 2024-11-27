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

      <div className="tw-h-[calc(100vh-7rem)] tw-flex tw-items-start tw-justify-center">
        <div className="tw-w-full tw-max-w-4xl">
          <div className="tw-flex tw-flex-col tw-gap-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-8">
            {/* 헤더 */}
            <div className="tw-flex tw-w-full tw-mb-2">
              <span className="tw-text-2xl tw-font-bold tw-text-white">라이선스</span>
            </div>

            {/* 주요 라이선스 내용 */}
            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-6 tw-rounded-lg tw-space-y-4">
              <p className="tw-leading-relaxed">
                1. 프로젝트 RA는 아래의 명시된 출처(게임)의 성과 관리 도구 애플리케이션(이하 팬 애플리케이션)이며, 애플리케이션 내 사용된 모든 컨텐츠(이미지,
                문구 등)의 저작권은 명시된 저작권자에게 있습니다.
              </p>
              <p className="tw-leading-relaxed">2. 명시된 콘텐츠 내부에 포함된 저작권 또한 각각의 콘텐츠의 저작권자에게 있습니다.</p>
              <p className="tw-leading-relaxed">
                3. 해당 애플리케이션은 개인적인 사용을 위한 비상업적인 용도로만 서비스가 제공됩니다. 애플리케이션 내부의 콘텐츠를 상업적이거나 공공의 목적으로
                다운로드, 수정, 유통하는 등 어떠한 방식으로도 사용할 수 없습니다.
              </p>
            </div>

            {/* 저작권 출처 섹션 */}
            <div className="tw-space-y-4">
              <h2 className="tw-text-lg tw-font-bold">저작권 출처</h2>
              <div className="tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500">
                <div
                  className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-400 tw-transition-colors"
                  onClick={() => window.ipc.send('openBrowser', 'https://store.steampowered.com/app/960170')}
                >
                  <FaLink className="tw-text-sm" />
                  <span>DJMAX RESPECT V(게임)</span>
                  <span>-</span>
                  <span
                    className="hover:tw-text-blue-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.ipc.send('openBrowser', 'https://www.neowiz.com/')
                    }}
                  >
                    네오위즈(NEOWIZ)
                  </span>
                </div>

                <hr className="tw-my-4 tw-border-blue-500 tw-border-opacity-50" />

                <div
                  className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-400 tw-transition-colors"
                  onClick={() => window.ipc.send('openBrowser', 'https://v-archive.net/')}
                >
                  <FaLink className="tw-text-sm" />
                  <span>V-ARCHIVE(DJMAX RESPECT V의 유저 제작 웹 성과 관리 도구) - V-ARCHIVE</span>
                </div>
              </div>
            </div>

            {/* API 섹션 */}
            <div className="tw-space-y-4">
              <h2 className="tw-text-lg tw-font-bold">외부 연동 API</h2>
              <div className="tw-bg-green-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-green-500">
                <div
                  className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-green-400 tw-transition-colors"
                  onClick={() => window.ipc.send('openBrowser', 'https://github.com/djmax-in/openapi?tab=readme-ov-file')}
                >
                  <FaLink className="tw-text-sm" />
                  <span>V-ARCHIVE Open API - V-ARCHIVE</span>
                </div>
              </div>
            </div>

            {/* 하단 경고문 */}
            <div className="tw-flex tw-justify-end tw-gap-2 tw-items-start tw-text-xs tw-font-semibold tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-700">
              <FaTriangleExclamation className="tw-mt-1 tw-text-yellow-500" />
              <div className="tw-flex tw-flex-col tw-gap-1 tw-text-gray-300">
                <span>해당 라이선스는 최종적인 버전이 아닙니다.</span>
                <span>명시된 라이선스에 대한 이의 제기/수정 요청은 개발자에게 문의바랍니다.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
