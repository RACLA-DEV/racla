import Link from 'next/link'
import { FaTriangleExclamation } from 'react-icons/fa6'
import { useRouter } from 'next/router'
import FooterLicenseDjmaxRespectV from './license/DjmaxRespectV'
import FooterLicenseTjmax from './license/Tjmax'
import FooterLicenseWjmax from './license/Wjmax'
import { useSelector } from 'react-redux'
import type { RootState } from 'store'
import { globalDictionary } from '@/libs/server/globalDictionary'

interface IFooterComponent {
  className?: string
}

const FooterComponent = ({ className }: IFooterComponent) => {
  const router = useRouter()
  const { selectedGame } = useSelector((state: RootState) => state.app)

  const renderGameSpecificContent = (game: string) => {
    switch (game) {
      case 'DJMAX_RESPECT_V':
        return <FooterLicenseDjmaxRespectV />
      case 'WJMAX':
        return <FooterLicenseWjmax />
      case 'TJMAX':
        return <FooterLicenseTjmax />
      default:
        return null
    }
  }

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
              프로젝트 RA · {globalDictionary.version}
            </span>
            {/* - <FaTriangleExclamation /> 해당 버전은 개발 중인 화면으로 최종적인 버전이 아닙니다. */}
            - <FaTriangleExclamation /> 개발자 빌드
          </span>
        </span>
      </div>
      <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pr-2">
        {router.pathname !== '/projectRa/home' && (
          <>
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
            {selectedGame && renderGameSpecificContent(selectedGame)}
            <span> · </span>
          </>
        )}
        <Link href="/license" className="tw-text-xs">
          라이선스
        </Link>
      </div>
    </div>
  )
}

export default FooterComponent
