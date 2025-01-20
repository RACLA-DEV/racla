import Head from 'next/head'
import React from 'react'
import { FaLink } from 'react-icons/fa6'

export default function LicensePage() {
  return (
    <React.Fragment>
      <Head>
        <title>라이선스 및 이용약관 - RACLA</title>
      </Head>

      <div className='tw-w-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4'>
        <div className='tw-w-full tw-max-w-4xl'>
          <div className='tw-flex tw-flex-col tw-gap-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-8'>
            {/* 헤더 */}
            <div className='tw-flex tw-w-full tw-mb-2'>
              <span className='tw-text-2xl tw-font-bold tw-text-white'>라이선스</span>
            </div>

            {/* 주요 라이선스 내용 */}
            <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-6 tw-rounded-lg tw-space-y-4'>
              <p className='tw-leading-relaxed'>
                1. RACLA는 아래의 명시된 출처(게임)의 성과 관리 도구 애플리케이션(이하 팬
                애플리케이션)입니다. RACLA에서 제공되는 리소스는 각 저작권자의 2차 창작 가이드라인을
                준수하여 사용되고 있으며, 일부 리소스는 사전 허가를 받아 사용하고 있습니다.
                애플리케이션 내 사용된 모든 컨텐츠(이미지, 문구 등)의 저작권은 명시된 저작권자에게
                있습니다.
              </p>
              <p className='tw-leading-relaxed'>
                2. 명시된 콘텐츠 내부에 포함된 저작권 또한 각각의 콘텐츠의 저작권자에게 있습니다.
              </p>
              <p className='tw-leading-relaxed'>
                3. 해당 애플리케이션은 비상업적인 용도로 제공되며, RACLA를 통한 제3자의 직접적인
                상업적 행위(재배포, 판매 등)를 금지합니다. 다만, 게임 스트리밍 방송, 게임 플레이
                영상 제작, 게임 관련 콘텐츠 제작 등 일반적인 창작 활동에서 화면에 포함되는 경우는
                예외로 합니다.
              </p>
              <p className='tw-leading-relaxed'>
                4. 본 서비스의 유지를 위한 모든 비용은 GGDRN0 STUDIO가 부담합니다. 다만, 서비스 운영
                및 유지 비용을 충당하기 위해 필요한 최소한의 광고가 저작권자와의 협의하에 게재될 수
                있습니다.
              </p>
            </div>

            {/* 저작권 출처 섹션 */}
            <div className='tw-space-y-4'>
              <h2 className='tw-text-lg tw-font-bold'>저작권 출처</h2>
              <div className='tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500'>
                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-400 tw-transition-colors'
                  onClick={() =>
                    window.ipc.send('openBrowser', 'https://store.steampowered.com/app/960170')
                  }
                >
                  <FaLink className='tw-text-sm' />
                  <span>DJMAX RESPECT V(디제이맥스 리스펙트 V, 게임)</span>
                  <span>-</span>
                  <span
                    className='hover:tw-text-blue-300'
                    onClick={(e) => {
                      e.stopPropagation()
                      window.ipc.send('openBrowser', 'https://www.neowiz.com/')
                    }}
                  >
                    네오위즈(NEOWIZ)
                  </span>
                </div>

                <hr className='tw-my-4 tw-border-blue-500 tw-border-opacity-50' />

                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-400 tw-transition-colors'
                  onClick={() => window.ipc.send('openBrowser', 'https://v-archive.net/')}
                >
                  <FaLink className='tw-text-sm' />
                  <span>V-ARCHIVE(DJMAX RESPECT V의 유저 제작 웹 성과 관리 도구)</span>
                  <span>-</span>
                  <span>V-ARCHIVE</span>
                </div>

                <hr className='tw-my-4 tw-border-blue-500 tw-border-opacity-50' />

                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-400 tw-transition-colors'
                  onClick={() =>
                    window.ipc.send('openBrowser', 'https://waktaverse.games/gameDetail/wjmax/')
                  }
                >
                  <FaLink className='tw-text-sm' />
                  <span>WJMAX(왁제이맥스, 게임)</span>
                  <span>-</span>
                  <span
                    className='hover:tw-text-blue-300'
                    onClick={(e) => {
                      e.stopPropagation()
                      window.ipc.send('openBrowser', 'https://waktaverse.games/')
                    }}
                  >
                    WJMAX STUDIO, WAKTAVERSE GAMES
                  </span>
                </div>
              </div>
            </div>

            {/* API 섹션 */}
            <div className='tw-space-y-4'>
              <h2 className='tw-text-lg tw-font-bold'>외부 연동 API 서비스</h2>
              <div className='tw-bg-green-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-green-500'>
                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-green-400 tw-transition-colors'
                  onClick={() =>
                    window.ipc.send(
                      'openBrowser',
                      'https://github.com/djmax-in/openapi?tab=readme-ov-file',
                    )
                  }
                >
                  <FaLink className='tw-text-sm' />
                  <span>V-ARCHIVE API - V-ARCHIVE</span>
                </div>
                <hr className='tw-my-4 tw-border-green-500 tw-border-opacity-50' />
                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-green-400 tw-transition-colors'
                  onClick={() => window.ipc.send('openBrowser', 'https://hard-archive.com')}
                >
                  <FaLink className='tw-text-sm' />
                  <span>전일 아카이브 API - 전일 아카이브</span>
                </div>
              </div>
            </div>

            <div className='tw-space-y-4'>
              <h2 className='tw-text-lg tw-font-bold'>Special Thanks</h2>
              <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-6 tw-rounded-lg tw-space-y-4'>
                <p className='tw-leading-relaxed'>
                  1. 동기 부여를 해준 디제이맥스 리스펙트 V 마이너 갤러리
                </p>
                <p className='tw-leading-relaxed'>
                  2. 리소스 사용을 허락해주신 V-ARCHIVE 개발자님을 포함한 V-ARCHIVE 관계자분들
                </p>
                <p className='tw-leading-relaxed'>
                  3. 리소스 사용을 허락해주신 전일 아카이브 개발자님을 포함한 전일 아카이브
                  관계자분들
                </p>
                <p className='tw-leading-relaxed'>
                  4. 리소스 사용을 허락해주신 WJMAX 개발자님을 포함한 WJMAX STUDIO 관계자분들
                </p>
                <p className='tw-leading-relaxed'>5. RACLA 운영과 개발을 도와주는 회사와 팀원들</p>
                <p className='tw-leading-relaxed'>
                  6. 매달 50 SGD 상당의 서버 자산을 정기적으로 후원해주시는 KIHARU 후원자님
                </p>
                <p className='tw-leading-relaxed'>
                  7. 마지막으로 RACLA를 사용해주시는 모든 사용자 여러분들께 감사합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className='tw-w-full tw-max-w-4xl'>
          <div className='tw-flex tw-flex-col tw-gap-6 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-8'>
            {/* 헤더 */}
            <div className='tw-flex tw-w-full tw-mb-2'>
              <span className='tw-text-2xl tw-font-bold tw-text-white'>이용약관</span>
            </div>
            {/* 주요 라이선스 내용 */}
            <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-6 tw-rounded-lg tw-space-y-4'>
              <div className='tw-space-y-6'>
                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제1조 (목적)</h3>
                  <p className='tw-leading-relaxed'>
                    본 약관은 GGDRN0 STUDIO와 R-ARCHIVE TEAM(이하 "개발팀")이 제공하는 RACLA
                    서비스(이하 "서비스")의 이용과 관련하여 개발팀과 이용자 간의 권리, 의무,
                    책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
                  </p>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제2조 (정의)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      "서비스"란 GGDRN0 STUDIO에 소속된 R-ARCHIVE TEAM이 개발하여 제공하는 디지털
                      콘텐츠 및 관련 서비스를 말합니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      "이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      "비상업적 사용"이란 개인적이고 상업적 이익을 추구하지 않는 사용을 의미합니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제3조 (약관의 효력 및 변경)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      본 약관은 이용자가 서비스에 접속하여 약관에 동의함으로써 효력이 발생합니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      개발팀은 필요하다고 인정되는 경우 관련 법령을 위반하지 않는 범위에서 본 약관을
                      변경할 수 있습니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      변경된 약관은 서비스 내 공지사항에 게시되며, 이용자가 변경된 약관에 동의하지
                      않을 경우 서비스 이용을 중단할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제4조 (서비스의 제공 및 제한)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      본 서비스는 비상업적 사용으로만 제한되며, 상업적 목적으로 사용할 수 없습니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      서비스의 일시적 중단, 수정 또는 종료는 개발팀의 재량에 따라 이루어질 수
                      있습니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제5조 (개인정보의 수집 및 이용)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      개발팀은 서비스 제공 및 개선을 위해 최소한의 개인정보를 수집합니다. 수집
                      항목은 다음과 같습니다:
                    </p>
                    <ul className='tw-list-disc tw-ml-6 tw-space-y-1'>
                      <li>닉네임</li>
                      <li>게임 플레이 데이터</li>
                      <li>IP 주소</li>
                    </ul>
                    <p className='tw-leading-relaxed'>
                      수집된 개인정보는 서비스 제공 및 통계 분석 목적으로만 사용됩니다.
                    </p>
                    {/* <p className="tw-leading-relaxed">개발팀은 이용자의 개인정보를 관련 법령에 따라 보호하며, 자세한 내용은 개인정보 처리방침을 따릅니다.</p> */}
                    <p className='tw-leading-relaxed'>
                      개발팀은 이용자의 개인정보를 관련 법령에 따라 보호합니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제6조 (이용자의 의무)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      이용자는 서비스를 비상업적 용도로만 이용해야 하며, 상업적 이익을 위해 사용할
                      수 없습니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      이용자는 서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제7조 (광고 게재)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      서비스 운영 및 유지 비용을 충당하기 위해 서비스 내에 광고가 게재될 수
                      있습니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      단 서비스외의 제3자의 리소스가 사용 중인 경우 광고는 저작권자의 허락을 받은
                      경우에만 게재됩니다.
                    </p>
                    {/* <p className="tw-leading-relaxed">광고는 서비스의 지속적인 제공을 위한 최소한의 조치로, 이용자는 이를 이해하고 수용합니다.</p> */}
                  </div>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제8조 (책임 제한)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      개발팀은 서비스 이용 중 발생한 손해에 대해 책임을 지지 않습니다. 단, 개발팀의
                      고의 또는 중대한 과실로 인한 경우는 예외로 합니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      이용자는 본인의 과실로 인해 발생한 손해에 대해 전적인 책임을 집니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>제9조 (분쟁 해결)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      서비스 이용과 관련하여 분쟁이 발생한 경우, 개발팀과 이용자는 성실히 협의하여
                      해결합니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-font-bold tw-mb-2'>부칙</h3>
                  <p className='tw-leading-relaxed'>본 약관은 2024년 12월 25일부터 적용됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
