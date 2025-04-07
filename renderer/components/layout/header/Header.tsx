import { useCallback, useEffect, useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowUp,
  FaConnectdevelop,
  FaGamepad,
  FaPlay,
  FaRotate,
  FaUser,
} from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'

import { globalDictionary } from '@constants/globalDictionary'
import { useNotificationSystem } from '@hooks/useNotifications'
import { logRendererError } from '@utils/rendererLoggerUtils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { RootState } from 'store'
import { setSelectedGame } from 'store/slices/appSlice'
import { setBackgroundBgaName } from 'store/slices/uiSlice'
import { renderGameButtons } from './HeaderGameButtons'
import HomePanelButton from './HeaderImportantModalButton'
import { renderUserDropdown } from './HeaderUserDropdown'
import { renderUtilityButtons } from './HeaderUtilityButtons'

// HeaderComponent.tsx

interface IHeaderComponentProps {
  className?: string
  callback: () => void
  refreshKeyHandle: any
}

const HeaderComponent: React.FC<IHeaderComponentProps> = ({
  refreshKeyHandle,
  className,
  callback,
}) => {
  const { showNotification } = useNotificationSystem()
  const router = useRouter()
  const dispatch = useDispatch()
  const { selectedGame, settingData, userData, isDetectedGame, isMiniMode } = useSelector(
    (state: RootState) => state.app,
  )
  const [isMaximized, setIsMaximized] = useState(false)
  const [ipcRenderer, setIpcRenderer] = useState(null)
  const vArchiveUserData = useSelector((state: RootState) => state.app.vArchiveUserData)
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
    router.push(`/`)
    dispatch(setSelectedGame(game))
    dispatch(setBackgroundBgaName(''))
  }

  const handleBack = () => {
    router.back()
  }

  const refreshComponent = useCallback(() => {
    refreshKeyHandle((prev) => prev + 1)
  }, [])

  useEffect(() => {
    console.log(selectedGame)
  }, [selectedGame])

  useEffect(() => {
    const audio = new Audio('https://cdn.racla.app/project_ra/notification.mp3')

    const handleNotificationSound = () => {
      audio.currentTime = 0
      if (settingData.isNotificationSound) {
        audio.play().catch((error) => {
          logRendererError(error, { message: 'Error playing notification', ...userData })
          console.error('Error playing notification:', error)
        })
      }
    }

    const cleanup = window.ipc.on('PLAY_NOTIFICATION_SOUND', handleNotificationSound)

    return () => {
      cleanup()
      audio.pause()
      audio.currentTime = 0
    }
  }, [settingData.isNotificationSound])

  return (
    <div
      className={`tw-flex tw-transition-all tw-duration-300 tw-fixed tw-w-full tw-bg-gray-800 tw-bg-opacity-90 tw-backdrop-blur-lg tw-border-b tw-border-gray-700 tw-items-center tw-top-0 tw-h-12 tw-left-0 tw-z-[1000] ${
        settingData.platform === 'darwin' ? 'tw-pl-[5rem]' : 'tw-px-2'
      }`}
    >
      {settingData.platform === 'darwin' && (
        <>
          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='btn-nav-back' className={className + ' tw-text-xs'}>
                뒤로가기
              </Tooltip>
            }
          >
            <button
              type='button'
              className='tw-px-0.5 tw-py-0.5 btn-ipc mac tw-mr-2 btn btn-secondary tw-text-sm btn-select-game tw-bg-gray-800/90 tw-border-0'
              onClick={handleBack}
            >
              <FaArrowLeft />
            </button>
          </OverlayTrigger>

          {/* 새로고침 */}
          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='btn-nav-refresh' className={className + ' tw-text-xs'}>
                새로고침
              </Tooltip>
            }
          >
            <button
              type='button'
              className='tw-px-0.5 tw-py-0.5 btn-ipc mac tw-mr-2 btn btn-secondary tw-text-sm btn-select-game tw-bg-gray-800/90 tw-border-0'
              onClick={refreshComponent}
            >
              <FaRotate />
            </button>
          </OverlayTrigger>

          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='btn-nav-top' className={className + ' tw-text-xs'}>
                콘텐츠 최상단으로 이동
              </Tooltip>
            }
          >
            <a
              href='#ContentHeader'
              className='tw-px-0.5 tw-py-0.5 btn-ipc mac tw-mr-2 btn btn-secondary tw-text-sm btn-select-game tw-bg-gray-800/90 tw-border-0'
            >
              <FaArrowUp />
            </a>
          </OverlayTrigger>

          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='btn-nav-bottom' className={className + ' tw-text-xs'}>
                콘텐츠 최하단으로 이동
              </Tooltip>
            }
          >
            <a
              href='#ContentFooter'
              className='tw-px-0.5 tw-py-0.5 btn-ipc mac tw-mr-2 btn btn-secondary tw-text-sm btn-select-game tw-bg-gray-800/90 tw-border-0'
            >
              <FaArrowDown />
            </a>
          </OverlayTrigger>
        </>
      )}

      {settingData.platform !== 'darwin' && (
        <>
          {/* 홈 로고 */}
          {!settingData.homeButtonAlignRight && settingData.platform !== 'darwin' && (
            <OverlayTrigger
              placement='bottom'
              overlay={
                <Tooltip id='btn-nav-home' className={className + ' tw-text-xs'}>
                  홈으로 돌아가기
                </Tooltip>
              }
            >
              <Link
                onClick={() => {
                  dispatch(setSelectedGame('djmax_respect_v'))
                }}
                href='/'
                className='tw-px-2 tw-py-2 btn-ipc tw-mr-2'
              >
                <Image
                  src='https://cdn.racla.app/logo.svg'
                  color='white'
                  height={24}
                  width={24}
                  alt='Logo'
                />
              </Link>
            </OverlayTrigger>
          )}

          {/* 뒤로가기 */}
          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='btn-nav-back' className={className + ' tw-text-xs'}>
                뒤로가기
              </Tooltip>
            }
          >
            <button type='button' className='tw-px-2 tw-py-2 btn-ipc tw-mr-2' onClick={handleBack}>
              <FaArrowLeft />
            </button>
          </OverlayTrigger>

          {/* 새로고침 */}
          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='btn-nav-refresh' className={className + ' tw-text-xs'}>
                새로고침
              </Tooltip>
            }
          >
            <button
              type='button'
              className='tw-px-2 tw-py-2 btn-ipc tw-mr-2'
              onClick={refreshComponent}
            >
              <FaRotate />
            </button>
          </OverlayTrigger>

          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='btn-nav-top' className={className + ' tw-text-xs'}>
                콘텐츠 최상단으로 이동
              </Tooltip>
            }
          >
            <a href='#ContentHeader' className='tw-px-2 tw-py-2 btn-ipc tw-mr-2'>
              <FaArrowUp />
            </a>
          </OverlayTrigger>

          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='btn-nav-bottom' className={className + ' tw-text-xs'}>
                콘텐츠 최하단으로 이동
              </Tooltip>
            }
          >
            <a href='#ContentFooter' className='tw-px-2 tw-py-2 btn-ipc tw-mr-2'>
              <FaArrowDown />
            </a>
          </OverlayTrigger>

          {settingData.homeButtonAlignRight && settingData.platform !== 'darwin' && (
            <OverlayTrigger
              placement='bottom'
              overlay={
                <Tooltip id='btn-nav-home' className={className + ' tw-text-xs'}>
                  홈으로 돌아가기
                </Tooltip>
              }
            >
              <Link href='/' className='tw-px-2 tw-py-2 btn-ipc tw-mr-2'>
                <Image
                  src='https://cdn.racla.app/logo.svg'
                  color='white'
                  height={24}
                  width={24}
                  alt='Logo'
                />
              </Link>
            </OverlayTrigger>
          )}
        </>
      )}

      {/* 창 드래그 할당 부분 */}
      <div
        className='tw-flex tw-items-center flex-equal dragable tw-gap-2'
        onDoubleClick={() => {
          setIsMaximized(true)
        }}
      >
        {/* 게임 선택 버튼 */}
        {renderGameButtons(
          'djmax_respect_v',
          'https://cdn.racla.app/djmax_respect_v/logo.png',
          'DJMAX RESPECT V',
          selectedGame,
          handleGameSelection,
        )}
        {renderGameButtons(
          'wjmax',
          'https://cdn.racla.app/wjmax/logo.png',
          'WJMAX',
          selectedGame,
          handleGameSelection,
        )}
        {/* {renderGameButtons('TJMAX', 'https://cdn.racla.app/tjmax/logo.png', 'TJMAX', selectedGame, handleGameSelection)} */}

        {/* 버튼 */}
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip id='btn-select-game-respect-v' className={className + ' tw-text-xs'}>
              Coming Soon! - RACLA 자체 제공 서비스
            </Tooltip>
          }
        >
          <button
            type='button'
            className='tw-flex tw-justify-center tw-items-center btn-select-game tw-gap-1 tw-rounded-sm tw-text-xs'
          >
            <Image
              loading='lazy' // "lazy" | "eager"
              blurDataURL={globalDictionary.blurDataURL}
              src={`https://cdn.racla.app/platina_lab/download.svg`}
              height={16}
              width={16}
              alt={'PLATiNA :: LAB'}
            />
            <span className='tw-text-xs'>PLATiNA :: LAB</span>
          </button>
        </OverlayTrigger>

        {/* 버튼 */}
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip id='btn-select-game-respect-v' className={className + ' tw-text-xs'}>
              Life is too short, You need RACLA
            </Tooltip>
          }
        >
          <button
            type='button'
            className='tw-flex tw-justify-center tw-items-center btn-select-game tw-gap-1 tw-rounded-sm tw-text-xs'
          >
            <FaConnectdevelop />
            <span className='tw-text-xs'>WHO'S NEXT?</span>
          </button>
        </OverlayTrigger>
      </div>
      {/* {settingData.platform !== 'darwin' && <HomePanelButton />} */}
      {settingData.platform !== 'darwin' && (
        <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip id='btn-select-game-respect-v' className={className + ' tw-text-xs'}>
              {selectedGame === 'djmax_respect_v'
                ? 'DJMAX RESPECT V(Steam) 게임을 실행합니다.'
                : 'WJMAX 게임을 실행합니다.'}
            </Tooltip>
          }
        >
          {!isDetectedGame ? (
            <button
              onClick={() => {
                if (selectedGame === 'djmax_respect_v') {
                  window.ipc.send('startGameDjmaxRespectV')
                } else if (selectedGame === 'wjmax') {
                  if (settingData.autoStartGameWjmaxPath !== '') {
                    window.ipc.send('startGameWjmax')
                  } else {
                    showNotification(
                      'WJMAX 게임을 실행하는 경로를 설정(게임)에서 지정해주세요.',
                      'tw-bg-red-600',
                    )
                  }
                }
              }}
              className={
                'tw-px-3 tw-text-white tw-bg-blue-600 tw-bg-opacity-90 hover:tw-bg-opacity-100 hover:tw-bg-blue-800 tw-transition-colors tw-duration-300 tw-text-xs tw-mr-2 tw-flex tw-items-center tw-gap-1 tw-rounded-sm tw-border-0 tw-h-8'
              }
            >
              <FaPlay /> 게임 시작
            </button>
          ) : (
            <button
              disabled
              className={
                'btn btn-secondary btn-select-game active tw-text-xs tw-mr-2 tw-flex tw-items-center tw-gap-1 tw-rounded-sm tw-border-0 tw-h-8'
              }
            >
              <FaGamepad /> 게임 실행 중
            </button>
          )}
        </OverlayTrigger>
      )}

      <button
        className={
          'btn btn-secondary btn-select-game active tw-text-xs tw-mr-2 tw-flex tw-items-center tw-gap-1 tw-rounded-sm tw-border-0 tw-h-8'
        }
        type='button'
        id='btn-nav-user'
        data-bs-toggle='dropdown'
        aria-expanded='false'
      >
        {userData.userNo !== '' && userData.userToken !== '' && userData.userName !== '' ? (
          <>
            <Image
              loading='lazy' // "lazy" | "eager"
              blurDataURL={globalDictionary.blurDataURL}
              src={`https://cdn.racla.app/djmax_respect_v/jackets/${userData.randomTitle}.jpg`}
              height='24'
              width='24'
              className='tw-rounded-full'
              alt='Profile Image'
            />
            {userData.userName}
            {/* {vArchiveUserData.userName !== '' ? `(${vArchiveUserData.userName})` : ''} */}
          </>
        ) : (
          <>
            <FaUser className='tw-text-xs' />
            <span className='tw-text-xs'>로그인</span>
          </>
        )}
      </button>
      {renderUserDropdown(
        userData,
        vArchiveUserData,
        ipcRenderer,
        router,
        callback,
        refreshKeyHandle,
      )}

      {settingData.platform == 'darwin' && <HomePanelButton />}

      {/* 우측 유틸리티 버튼 - macOS에서는 숨김 */}
      {settingData.platform !== 'darwin' &&
        renderUtilityButtons(ipcRenderer, isMaximized, setIsMaximized)}
    </div>
  )
}

export default HeaderComponent
