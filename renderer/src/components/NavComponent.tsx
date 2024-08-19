import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiMinus, FiMinimize, FiMaximize, FiX } from 'react-icons/fi'
import { FaArrowLeft, FaConnectdevelop, FaRotate } from 'react-icons/fa6'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useRouter } from 'next/router'
import * as R from 'ramda'

interface INavComponent {
  className?: string
  user?: TUser
  logoutCallback: any
  addNotificationCallback: any
  selectedGame: string
  selectedGameCallback: any
}

type TUser = {
  userNo: string
  userToken: string
  userName: string
  randomTitle: string
}

const NavComponent = ({ className, user, logoutCallback, addNotificationCallback, selectedGame, selectedGameCallback }: INavComponent) => {
  const router = useRouter()

  const [isMaximized, setIsMaximized] = useState(false)
  const [ipcRenderer, setIpcRenderer] = useState(null)

  useEffect(() => {
    setIpcRenderer(window.ipc)

    const handleResize = (value) => {
      if (value !== undefined && Boolean(value)) {
        setIsMaximized(true)
      } else if (value !== undefined && !Boolean(value)) {
        setIsMaximized(false)
      }
    }

    window.ipc.on('IPC_RENDERER_RESIZE_IS_MAXIMIZED', handleResize)

    // 메모리 누수 방지
    return () => {
      window.ipc.removeListener('IPC_RENDERER_RESIZE_IS_MAXIMIZED', handleResize)
    }
  }, [])

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

      {/* 창 드래그 할당 부분 */}
      <div
        className="tw-flex tw-items-center flex-equal dragable tw-gap-2"
        onDoubleClick={() => {
          setIsMaximized(true)
        }}
      >
        {/* 버튼 */}
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id="btn-select-game-respect-v" className={className + ' tw-text-xs'}>
              V-ARCHIVE에 기록된 정보를 바탕으로 제공되는 서비스
            </Tooltip>
          }
        >
          <button
            onClick={() => {
              if (selectedGame !== 'DJMAX_RESPECT_V') {
                selectedGameCallback('DJMAX_RESPECT_V')
                if (!router.pathname.startsWith('/vArchive') || router.pathname !== '/') {
                  router.push('/')
                }
              }
            }}
            type="button"
            className={
              'tw-flex tw-justify-center tw-items-center btn-select-game tw-gap-1 tw-rounded-sm tw-text-xs tw-bg-gray-800 ' +
              (selectedGame === 'DJMAX_RESPECT_V' ? 'active' : '')
            }
          >
            <Image src="/images/djmax_respect_v/logo.png" height={16} width={16} alt="DJMAX RESPECT V" />
            <span className="tw-text-xs">DJMAX RESPECT V</span>
          </button>
        </OverlayTrigger>

        {/* 버튼 */}
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id="btn-select-game-respect-v" className={className + ' tw-text-xs'}>
              프로젝트 RA 제공 서비스
            </Tooltip>
          }
        >
          <button
            onClick={() => {
              if (selectedGame !== 'WJMAX') {
                selectedGameCallback('WJMAX')
                if (!router.pathname.startsWith('/vArchive') || router.pathname !== '/') {
                  router.push('/')
                }
              }
            }}
            type="button"
            className={
              'tw-flex tw-justify-center tw-items-center btn-select-game tw-gap-1 tw-rounded-sm tw-text-xs tw-bg-gray-800 ' +
              (selectedGame === 'WJMAX' ? 'active' : '')
            }
          >
            <Image src="/images/wjmax/logo.png" height={16} width={16} alt="DJMAX RESPECT V" />
            <span className="tw-text-xs">WJMAX</span>
          </button>
        </OverlayTrigger>

        {/* 버튼 */}
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id="btn-select-game-respect-v" className={className + ' tw-text-xs'}>
              프로젝트 RA 제공 서비스
            </Tooltip>
          }
        >
          <button
            onClick={() => {
              if (selectedGame !== 'TJMAX') {
                selectedGameCallback('TJMAX')
                if (!router.pathname.startsWith('/vArchive') || router.pathname !== '/') {
                  router.push('/')
                }
              }
            }}
            type="button"
            className={
              'tw-flex tw-justify-center tw-items-center btn-select-game tw-gap-1 tw-rounded-sm tw-text-xs tw-bg-gray-800 ' +
              (selectedGame === 'TJMAX' ? 'active' : '')
            }
          >
            <Image src="/images/tjmax/logo.png" height={16} width={16} alt="DJMAX RESPECT V" />
            <span className="tw-text-xs">TJMAX</span>
          </button>
        </OverlayTrigger>

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
      <ul className="dropdown-menu tw-text-xs tw-bg-gray-900 tw-bg-opacity-90 tw-p-0" aria-labelledby="btn-nav-user">
        <li>
          <button
            className="dropdown-item tw-py-2 tw-rounded-t-md"
            onClick={() => {
              ipcRenderer.send('openBrowser', 'https://v-archive.net/')
            }}
          >
            V-ARCHIVE 바로가기
          </button>
        </li>
        {user.userNo !== '' && user.userToken !== '' && user.userName !== '' ? (
          <li>
            <button
              className="dropdown-item tw-py-2"
              onClick={() => {
                ipcRenderer.send('openBrowser', `https://v-archive.net/archive/${user.userName}/board`)
              }}
            >
              성과표 바로가기
            </button>
          </li>
        ) : null}
        <li>
          <hr className="dropdown-divider tw-m-0" />
        </li>
        {user.userNo !== '' && user.userToken !== '' && user.userName !== '' ? (
          <li>
            <button
              className="dropdown-item tw-py-2 tw-rounded-b-md tw-text-red-600"
              onClick={() => {
                logoutCallback()
                ipcRenderer.logout()
                addNotificationCallback('정상적으로 로그아웃 되었습니다.', 'tw-bg-lime-600')
              }}
            >
              로그아웃
            </button>
          </li>
        ) : (
          <li>
            <Link href={`/login?url=${router.asPath}`} className="dropdown-item tw-py-2 tw-rounded-b-md">
              로그인
            </Link>
          </li>
        )}
      </ul>
      {/* 우측 유틸리티 버튼 */}
      <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pr-1">
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id="btn-select-game-respect-v" className={className + ' tw-text-xs'}>
              창 최소화
            </Tooltip>
          }
        >
          <button
            type="button"
            onClick={() => {
              ipcRenderer.send('minimizeApp')
            }}
            className="btn-ipc tw-text-md"
          >
            <FiMinus />
          </button>
        </OverlayTrigger>
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id="btn-select-game-respect-v" className={className + ' tw-text-xs'}>
              {!isMaximized ? '창 크기 최대화' : '창 크기 원래대로 되돌리기'}
            </Tooltip>
          }
        >
          <button
            type="button"
            onClick={() => {
              ipcRenderer.send('maximizeApp')
            }}
            className="btn-ipc tw-text-xs"
          >
            {!isMaximized ? <FiMaximize /> : <FiMinimize />}
          </button>
        </OverlayTrigger>
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id="btn-select-game-respect-v" className={className + ' tw-text-xs'}>
              창 닫기
            </Tooltip>
          }
        >
          <button
            type="button"
            onClick={() => {
              ipcRenderer.send('closeApp')
            }}
            className="btn-ipc tw-text-md"
          >
            <FiX />
          </button>
        </OverlayTrigger>
      </div>
    </div>
  )
}

export default NavComponent
