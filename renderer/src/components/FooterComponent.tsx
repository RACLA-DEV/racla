import Link from 'next/link'
import { FaTriangleExclamation } from 'react-icons/fa6'

interface IFooterComponent {
  className?: string
  selectedGame?: any
}

const FooterComponent = ({ className, selectedGame }: IFooterComponent) => {
  return (
    <div className="tw-flex tw-fixed tw-w-full tw-bg-gray-900 tw-items-center tw-bottom-0 tw-h-8 tw-bg-opacity-50 tw-left-0 tw-px-2 tw-border-t tw-border-opacity-50 tw-border-gray-600">
      <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pl-2 tw-me-auto">
        <span className="tw-text-xs tw-flex tw-items-center">
          <span className="tw-flex tw-items-center tw-gap-1">
            <span
              className="tw-cursor-pointer"
              onClick={() => {
                window.ipc.openBrowser('https://github.com/Lunatica-Luna/project-ra/releases')
              }}
            >
              프로젝트 RA · V0.2.2.20240819 2028
              {/* {' '}· Brunch: Development */}
            </span>
            {/* - <FaTriangleExclamation /> 해당 버전은 개발 중인 화면으로 최종적인 버전이 아닙니다. */}
            {/* - <FaTriangleExclamation /> 해당 버전은 테스트를 위한 배포본으로 최종적인 버전이 아닙니다. */}
          </span>
          {/* CORS Proxy:{' '}<span className="tw-text-lime-600">Online(https://proxy.lunatica.kr/proxy)</span> */}
        </span>
      </div>
      <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pr-2">
        {selectedGame !== undefined && selectedGame !== null && selectedGame === 'DJMAX_RESPECT_V' ? (
          <span className="tw-text-xs tw-animate-fadeInLeft tw-cursor-pointer">
            <span onClick={() => window.ipc.openBrowser('https://store.steampowered.com/app/960170')}>Resources from DJMAX RESPECT V</span> /{' '}
            <span onClick={() => window.ipc.openBrowser('https://www.youtube.com/@DJMAXARCHIVE')}>DJMAX ARCHIVE</span> /{' '}
            <span onClick={() => window.ipc.openBrowser('https://www.neowiz.com/')}>©NEOWIZ</span>
          </span>
        ) : null}
        {selectedGame !== undefined && selectedGame !== null && selectedGame === 'WJMAX' ? (
          <span className="tw-text-xs tw-animate-fadeInLeft tw-cursor-pointer">
            <span onClick={() => window.ipc.openBrowser('https://waktaverse.games/gameDetail/wjmax/')}>Resources from WJMAX / ©WJMAX STUDIO</span> /{' '}
            <span onClick={() => window.ipc.openBrowser('https://www.neowiz.com/')}>©NEOWIZ</span>
          </span>
        ) : null}
        {selectedGame !== undefined && selectedGame !== null && selectedGame === 'TJMAX' ? (
          <span className="tw-text-xs tw-animate-fadeInLeft tw-cursor-pointer">
            <span onClick={() => window.ipc.openBrowser('https://cafe.naver.com/tteokbokk1/533412')}>Resources from TJMAX</span> /{' '}
            <span onClick={() => window.ipc.openBrowser('https://www.youtube.com/@stellive_official')}>StelLive Official</span> /{' '}
            <span onClick={() => window.ipc.openBrowser('https://stellive.me/')}>©StelLive</span>
          </span>
        ) : null}
        <span> · </span>
        <button
          className="tw-text-xs"
          type="button"
          onClick={() => {
            window.ipc.send('openBrowser', 'https://github.com/djmax-in/openapi?tab=readme-ov-file')
          }}
        >
          Powered by V-ARCHIVE Open API
        </button>
        <span> · </span>
        <Link href="/license" className="tw-text-xs">
          라이선스
        </Link>
      </div>
    </div>
  )
}

export default FooterComponent
