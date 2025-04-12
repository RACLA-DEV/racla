import { globalDictionary } from '@/constants/globalDictionary'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { FaCircle } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import type { RootState } from 'store'
import FooterLicenseDjmaxRespectV from './FooterLicenseDjmax'
import FooterLicenseTjmax from './FooterLicenseTjmax'
import FooterLicenseWjmax from './FooterLicenseWjmax'

interface IFooterComponent {
  className?: string
}

interface ServerStatus {
  message: string
  version: string
  timestamp: number
}

const FooterComponent = ({ className }: IFooterComponent) => {
  const router = useRouter()
  const { selectedGame } = useSelector((state: RootState) => state.app)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(false)

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v2/racla/ping`)
        if (response.ok) {
          const data = await response.json()
          setServerStatus(data)
          setIsOnline(true)
        } else {
          setIsOnline(false)
        }
      } catch (error) {
        setIsOnline(false)
      }
    }

    checkServerStatus()
    const interval = setInterval(checkServerStatus, 30000) // 30초마다 체크
    return () => clearInterval(interval)
  }, [])

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
    <div className='tw-flex tw-fixed tw-w-full tw-bg-gray-800 tw-bg-opacity-90 tw-backdrop-blur-lg tw-border-t tw-border-gray-700 tw-items-center tw-bottom-0 tw-h-8 tw-left-0 tw-px-2'>
      <div className='tw-flex tw-justify-center tw-items-center tw-gap-1 tw-pl-1 tw-h-8 tw-me-auto'>
        <span className='tw-text-xs tw-flex tw-items-center'>
          <span className='tw-flex tw-items-center tw-gap-1'>
            <span
              onClick={() => {
                window.ipc.openBrowser('https://racla.app')
              }}
              className='tw-cursor-pointer tw-flex tw-items-center tw-gap-1'
            >
              <div className='tw-relative tw-flex tw-items-center tw-justify-center tw-mr-1'>
                <FaCircle
                  className={`tw-text-xs ${isOnline ? 'tw-text-green-500' : 'tw-text-red-500'} tw-relative tw-z-10 tw-align-middle`}
                />
                {isOnline && (
                  <div className='tw-absolute tw-w-3 tw-h-3 tw-rounded-full tw-bg-white tw-opacity-30 tw-animate-ping' />
                )}
              </div>
              <span className='tw-leading-none'>
                {isOnline
                  ? `Server Connected - ${serverStatus?.version} - ${globalDictionary.version}`
                  : `Server Disconnected - ${globalDictionary.version}`}
              </span>
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
