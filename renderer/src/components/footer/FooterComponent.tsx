import { globalDictionary } from '@/libs/server/globalDictionary'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import type { RootState } from 'store'
import FooterLicenseDjmaxRespectV from './license/DjmaxRespectV'
import FooterLicenseTjmax from './license/Tjmax'
import FooterLicenseWjmax from './license/Wjmax'

interface IFooterComponent {
  className?: string
}

const FooterComponent = ({ className }: IFooterComponent) => {
  const router = useRouter()
  const { selectedGame } = useSelector((state: RootState) => state.app)

  const renderGameSpecificContent = (game: string) => {
    switch (game) {
      case 'djmax_respect_v':
        return <FooterLicenseDjmaxRespectV />
      case 'wjmax':
        return <FooterLicenseWjmax />
      case 'tjmax':
        return <FooterLicenseTjmax />
      default:
        return null
    }
  }

  return (
    <div className='tw-flex tw-fixed tw-w-full tw-bg-gray-900 tw-items-center tw-bottom-0 tw-h-8 tw-bg-opacity-50 tw-left-0 tw-px-2 tw-border-t tw-border-opacity-50 tw-border-gray-600'>
      <div className='tw-flex tw-justify-center tw-items-center tw-gap-1 tw-pl-1 tw-h-8 tw-me-auto'>
        <span className='tw-text-xs tw-flex tw-items-center'>
          <span className='tw-flex tw-items-center tw-gap-1'>
            <span
              className='tw-cursor-pointer'
              onClick={() => {
                window.ipc.openBrowser('https://github.com/Lunatica-Luna/project-ra/releases')
              }}
            >
              RACLA 데스크톱 앱 · {globalDictionary.version}
            </span>
            {/* - <FaTriangleExclamation /> 해당 버전은 개발 중인 화면으로 최종적인 버전이 아닙니다. */}
            {/* - <FaTriangleExclamation /> 개발자 빌드 */}
          </span>
        </span>
      </div>
      <div className='tw-flex tw-text-xs tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pr-1'>
        <>
          {selectedGame === 'djmax_respect_v' && (
            <>
              <span>Powered by </span>
              <button
                className='tw-text-xs tw-animate-fadeInLeft'
                type='button'
                onClick={() => {
                  window.ipc.send(
                    'openBrowser',
                    'https://github.com/djmax-in/openapi?tab=readme-ov-file',
                  )
                }}
              >
                V-ARCHIVE
              </button>
              <span> & </span>
              <button
                className='tw-text-xs tw-animate-fadeInLeft'
                type='button'
                onClick={() => {
                  window.ipc.send('openBrowser', 'https://hard-archive.com')
                }}
              >
                전일 아카이브
              </button>
              <span> · </span>
            </>
          )}

          {selectedGame && renderGameSpecificContent(selectedGame)}
          <span> · </span>
        </>
        <Link href='/license' className='tw-text-xs'>
          라이선스 및 이용약관
        </Link>
      </div>
    </div>
  )
}

export default FooterComponent
