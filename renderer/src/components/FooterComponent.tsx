import Link from 'next/link'

interface IFooterComponent {
  className?: string
}

const FooterComponent = ({ className }: IFooterComponent) => {
  return (
    <div className="tw-flex tw-fixed tw-w-full tw-bg-gray-900 tw-items-center tw-bottom-0 tw-h-8 tw-bg-opacity-50 tw-left-0 tw-px-2">
      <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pl-2 tw-me-auto">
        <span className="tw-text-xs">프로젝트 RA / V0.0.1.20240814 0000 / Brunch: Development</span>
      </div>
      <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pr-2">
        {/* <span className="tw-text-xs">라이센스</span> */}
        <Link href="/license" className="tw-text-xs">
          라이센스
        </Link>
      </div>
    </div>
  )
}

export default FooterComponent
