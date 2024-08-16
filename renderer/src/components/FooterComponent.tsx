import Link from 'next/link'

interface IFooterComponent {
  className?: string
}

const FooterComponent = ({ className }: IFooterComponent) => {
  return (
    <div className="tw-flex tw-fixed tw-w-full tw-bg-gray-900 tw-items-center tw-bottom-0 tw-h-8 tw-bg-opacity-50 tw-left-0 tw-px-2 tw-border-t tw-border-opacity-50 tw-border-gray-600">
      <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pl-2 tw-me-auto">
        <span className="tw-text-xs">
          프로젝트 RA · V0.0.1.20240814 0000 · Brunch: Development · CORS Proxy:{' '}
          <span className="tw-text-lime-600">Online(https://cors.lunatica.kr/proxy)</span>
        </span>
      </div>
      <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pr-2">
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
