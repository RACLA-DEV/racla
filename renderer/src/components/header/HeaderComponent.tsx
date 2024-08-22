// HeaderComponent.tsx
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import * as R from 'ramda'
import { renderGameButtons } from './renderGameButtons'
import { renderUserDropdown } from './renderUserDropdown'
import { renderUtilityButtons } from './renderUtilityButtons'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FaArrowDown, FaArrowDownUpAcrossLine, FaArrowLeft, FaArrowUp, FaConnectdevelop, FaRotate } from 'react-icons/fa6'

interface IHeaderComponentProps {
  className?: string
  user?: User
  logoutCallback: () => void
  addNotificationCallback: (message: string, color?: string) => void
  selectedGame: string
  selectedGameCallback: (game: string) => void
}

interface User {
  userNo: string
  userToken: string
  userName: string
  randomTitle: string
}

const HeaderComponent: React.FC<IHeaderComponentProps> = ({ className, user, logoutCallback, addNotificationCallback, selectedGame, selectedGameCallback }) => {
  const router = useRouter()
  const [isMaximized, setIsMaximized] = useState(false)
  const [ipcRenderer, setIpcRenderer] = useState(null)

  useEffect(() => {
    setIpcRenderer(window.ipc)

    const handleResize = (value: boolean) => {
      setIsMaximized(value)
    }

    window.ipc.on('IPC_RENDERER_RESIZE_IS_MAXIMIZED', handleResize)

    return () => {
      window.ipc.removeListener('IPC_RENDERER_RESIZE_IS_MAXIMIZED', handleResize)
    }
  }, [])

  const handleGameSelection = (game: string) => {
    if (selectedGame !== game) {
      selectedGameCallback(game)
      if (!router.pathname.startsWith('/vArchive') || router.pathname !== '/') {
        router.push('/')
      }
    }
  }

  return (
    <div className="tw-flex tw-fixed tw-w-full tw-bg-gray-900 tw-items-center tw-top-0 tw-h-12 tw-items-center tw-left-0 tw-bg-opacity-50 tw-px-2 tw-border-b tw-border-opacity-50 tw-border-gray-600">
      {/* 홈 로고 */}
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id="btn-nav-home" className={className + ' tw-text-xs'}>
            홈으로 돌아가기
          </Tooltip>
        }
      >
        <Link href="/" className="tw-px-2 tw-py-2 btn-ipc tw-mr-2">
          <Image src="/images/logo.svg" height={24} width={24} alt="Logo" />
        </Link>
      </OverlayTrigger>

      {/* 뒤로가기 */}
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id="btn-nav-home" className={className + ' tw-text-xs'}>
            뒤로가기
          </Tooltip>
        }
      >
        <button type="button" className="tw-px-2 tw-py-2 btn-ipc tw-mr-2" onClick={() => router.back()}>
          <FaArrowLeft />
        </button>
      </OverlayTrigger>

      {/* 새로고침 */}
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id="btn-nav-home" className={className + ' tw-text-xs'}>
            새로고침
          </Tooltip>
        }
      >
        <button type="button" className="tw-px-2 tw-py-2 btn-ipc tw-mr-2" onClick={() => router.push(`/refresh?url=${router.asPath}`)}>
          <FaRotate />
        </button>
      </OverlayTrigger>

      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id="btn-nav-home" className={className + ' tw-text-xs'}>
            콘텐츠 최상단으로 이동
          </Tooltip>
        }
      >
        <a href={`#ContentHeader`} className="tw-px-2 tw-py-2 btn-ipc tw-mr-2">
          <FaArrowUp />
        </a>
      </OverlayTrigger>

      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id="btn-nav-home" className={className + ' tw-text-xs'}>
            콘텐츠 최하단으로 이동
          </Tooltip>
        }
      >
        <a href={`#ContentFooter`} type="button" className="tw-px-2 tw-py-2 btn-ipc tw-mr-2">
          <FaArrowDown />
        </a>
      </OverlayTrigger>

      {/* 창 드래그 할당 부분 */}
      <div
        className="tw-flex tw-items-center flex-equal dragable tw-gap-2"
        onDoubleClick={() => {
          setIsMaximized(true)
        }}
      >
        {/* 게임 선택 버튼 */}
        {renderGameButtons('DJMAX_RESPECT_V', '/images/djmax_respect_v/logo.png', 'DJMAX RESPECT V', selectedGame, handleGameSelection)}
        {renderGameButtons('WJMAX', '/images/wjmax/logo.png', 'WJMAX', selectedGame, handleGameSelection)}
        {renderGameButtons('TJMAX', '/images/tjmax/logo.png', 'TJMAX', selectedGame, handleGameSelection)}

        {/* 버튼 */}
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id="btn-select-game-respect-v" className={className + ' tw-text-xs'}>
              Life is too short, You need Project RA
            </Tooltip>
          }
        >
          <button type="button" className="tw-flex tw-justify-center tw-items-center btn-select-game tw-gap-1 tw-rounded-sm tw-text-xs tw-bg-gray-800">
            <FaConnectdevelop />
            <span className="tw-text-xs">WHO'S NEXT?</span>
          </button>
        </OverlayTrigger>
      </div>
      <button
        className={
          'btn btn-secondary btn-select-game active tw-text-xs tw-mr-2 tw-flex tw-items-center tw-gap-1 tw-rounded-sm tw-border-0 tw-h-8 dropdown-toggle'
        }
        type="button"
        id="btn-nav-user"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {user.userNo !== '' && user.userToken !== '' && user.userName !== '' ? (
          <>
            <Image
              src={`https://v-archive.net/static/images/jackets/${user.randomTitle}.jpg`}
              height="24"
              width="24"
              className="tw-rounded-full"
              alt="Profile Image"
            />
            {user.userName}
          </>
        ) : (
          '로그인해주세요'
        )}
      </button>
      {renderUserDropdown(user, logoutCallback, addNotificationCallback, ipcRenderer, router)}

      {/* 우측 유틸리티 버튼 */}
      {renderUtilityButtons(ipcRenderer, isMaximized, setIsMaximized)}
    </div>
  )
}

export default HeaderComponent
