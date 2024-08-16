import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  FaCompactDisc,
  FaRankingStar,
  FaDatabase,
  FaDumbbell,
  FaGraduationCap,
  FaGear,
  FaNoteSticky,
  FaDice,
  FaRobot,
  FaTableCells,
  FaMobileScreen,
  FaList,
  FaUpload,
  FaWindowMaximize,
  FaWandMagicSparkles,
} from 'react-icons/fa6'

const SidebarComponent = () => {
  const router = useRouter()

  return (
    <div className="tw-flex tw-fixed tw-px-4 tw-py-5 tw-flex-col tw-bg-gray-600 tw-bg-opacity-10 tw-w-52 tw-left-0 tw-top-12 tw-bottom-8 tw-z-50">
      {/* V-ARCHIVE */}
      <span className="tw-font-semibold tw-text-xs tw-mb-4">V-ARCHIVE</span>
      <div className="tw-flex tw-flex-col tw-gap-1 tw-mb-4">
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaUpload />
          <span className="tw-me-auto">기록 등록</span>
          <span className="tw-py-1 tw-px-2 tw-rounded-full tw-bg-gray-500 tw-text-xs tw-text-white tw-font-medium">NEW</span>
        </span>
        <Link
          href="/djpower"
          className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar ${
            router.pathname.includes('/djpower') ? 'active' : ''
          }`}
        >
          <FaCompactDisc />
          <span>
            <sup>MAX </sup>DJ POWER
          </span>
        </Link>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaRankingStar />
          서열표
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaDatabase />
          데이터베이스
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaDumbbell />
          트레이닝
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaGraduationCap />
          안내
        </span>
      </div>

      {/* 프로젝트 RA */}
      <span className="tw-font-semibold tw-text-xs tw-mb-4">프로젝트 RA</span>
      <div className="tw-flex tw-flex-col tw-gap-1 tw-mb-4">
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaRankingStar />
          <span className="tw-me-auto">리더보드_랭킹</span>
          <span className="tw-py-1 tw-px-2 tw-rounded-full tw-bg-gray-500 tw-text-xs tw-text-white tw-font-medium">NEW</span>
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaWandMagicSparkles />
          <span className="tw-me-auto">코스 메이커</span>
          <span className="tw-py-1 tw-px-2 tw-rounded-full tw-bg-gray-500 tw-text-xs tw-text-white tw-font-medium">NEW</span>
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaWindowMaximize />
          <span className="tw-me-auto">오버레이</span>
          <span className="tw-py-1 tw-px-2 tw-rounded-full tw-bg-gray-500 tw-text-xs tw-text-white tw-font-medium">NEW</span>
        </span>
      </div>

      {/* 유틸리티 */}
      <span className="tw-font-semibold tw-text-xs tw-mb-4">유틸리티</span>
      <div className="tw-flex tw-flex-col tw-gap-1 tw-mb-4">
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaRobot />
          <span>V-ARCHIVE 매크로</span>
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaDice />
          <span>랜덤 선곡기</span>
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaList />
          <span>V-SCOUTER</span>
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaTableCells />
          <span>BEST 30</span>
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaMobileScreen />
          <span>모바일 앱(AOS)</span>
        </span>
      </div>

      {/* 기타 */}
      <div className="tw-flex tw-flex-col tw-gap-1 tw-mt-auto">
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaNoteSticky />
          <span>개발자 노트</span>
        </span>
        <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
          <FaGear />
          <span>설정</span>
        </span>
      </div>
    </div>
  )
}

export default SidebarComponent
