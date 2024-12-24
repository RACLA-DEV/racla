// SidebarComponent.tsx
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { FaBug, FaGear, FaNoteSticky, FaChevronLeft, FaChevronRight, FaSliders, FaList, FaTableList } from 'react-icons/fa6'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'
import { renderNavigation } from './renderNavigation'
import RenderUpdateSection from './renderUpdateSection'
import { useSelector } from 'react-redux'
import type { RootState } from 'store'
import { useDispatch } from 'react-redux'
import { setIsSetting, setIsMiniMode, setSettingData } from 'store/slices/appSlice'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const SidebarComponent: React.FC = () => {
  const { showNotification } = useNotificationSystem()
  const router = useRouter()
  const { selectedGame, isMiniMode, settingData } = useSelector((state: RootState) => state.app)
  const dispatch = useDispatch()

  const handleSettingChange = (newSettings: any) => {
    window.ipc.send('changeSettingData', newSettings)
    dispatch(setSettingData({ ...settingData, ...newSettings }))
  }

  // useEffect(() => {
  //   const handleUpdateAvailable = (info: string) => {
  //     console.log('update-available', info)
  //     setUpdateVersion(info)
  //   }

  //   const handleDownloadProgress = (info: { percent: string }) => {
  //     console.log('download-progress', info)
  //     setDownloadProgress(info)
  //   }

  //   const handleUpdateDownloaded = () => {
  //     console.log('update-downloaded')
  //     setIsDownloaded(true)
  //   }

  //   window.ipc.on('update-available', handleUpdateAvailable)
  //   window.ipc.on('download-progress', handleDownloadProgress)
  //   window.ipc.on('update-downloaded', handleUpdateDownloaded)

  //   return () => {
  //     window.ipc.removeListener('update-available', handleUpdateAvailable)
  //     window.ipc.removeListener('download-progress', handleDownloadProgress)
  //     window.ipc.removeListener('update-downloaded', handleUpdateDownloaded)
  //   }
  // }, [])

  // useEffect(() => {
  //   if (updateVersion) {
  //     console.log('updateVersion', updateVersion)
  //     showNotification(`R-ARCHIVE 데스크톱 앱의 업데이트(${updateVersion})가 존재합니다. 자동 업데이트를 준비합니다.`, 'tw-bg-blue-600')
  //   }
  // }, [updateVersion, showNotification])

  return (
    <>
      <div
        className={`tw-flex tw-fixed tw-animate-fadeInLeft tw-transition-all tw-flex-col tw-bg-gray-600 tw-bg-opacity-10 ${
          isMiniMode ? 'tw-w-auto tw-px-2 tw-py-2' : 'tw-w-52 tw-p-4'
        } tw-left-0 tw-top-12 tw-h-[calc(100vh-5.125rem)] tw-z-50 tw-ease-in-out`}
      >
        {renderNavigation('projectRa', router)}
        {renderNavigation(selectedGame, router)}

        {/* 기타 */}
        <div className="tw-flex tw-flex-col tw-gap-0.5 tw-mt-auto">
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id={`tooltip-bug-report`} className="tw-text-xs">
                피드백 센터
              </Tooltip>
            }
          >
            <Link
              href="/bug"
              className={`tw-text-sm tw-text-gray-400 tw-font-bold tw-flex tw-items-center tw-gap-2 tw-cursor-pointer group relative hover:tw-bg-gray-700 hover:tw-bg-opacity-30 tw-rounded   ${
                !isMiniMode ? 'tw-p-1.5' : 'tw-my-1'
              }`}
            >
              <div className={`${isMiniMode ? 'tw-bg-gray-700 tw-bg-opacity-30 tw-p-2 tw-rounded-md' : ''}`}>
                <FaBug size={isMiniMode ? 16 : 12} />
              </div>
              {!isMiniMode ? (
                <button type="button" className="tw-flex tw-gap-1 tw-w-full tw-items-center tw-text-xs">
                  피드백 센터
                </button>
              ) : (
                <div className="tw-invisible group-hover:tw-visible tw-absolute tw-left-12 tw-bg-gray-800 tw-text-white tw-px-2 tw-py-1 tw-rounded tw-whitespace-nowrap tw-text-xs tw-z-50">
                  피드백 센터
                </div>
              )}
            </Link>
          </OverlayTrigger>
          {/* <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id={`tooltip-developer-note`} className="tw-text-xs">
                개발자 노트
              </Tooltip>
            }
          >
            <span
              className={`tw-text-sm tw-text-gray-400 tw-font-bold tw-flex tw-items-center tw-gap-2 tw-cursor-pointer group relative hover:tw-bg-gray-700 hover:tw-bg-opacity-30 tw-rounded   ${
                !isMiniMode ? 'tw-p-1.5' : 'tw-my-1'
              }`}
            >
              <div className={`${isMiniMode ? 'tw-bg-gray-700 tw-bg-opacity-30 tw-p-2 tw-rounded-md' : ''}`}>
                <FaNoteSticky size={isMiniMode ? 16 : 12} />
              </div>
              {!isMiniMode ? (
                <span className="tw-flex tw-gap-1 tw-w-full tw-items-center tw-text-xs">
                  개발자 노트 <span className="tw-ms-auto tw-text-[10px] tw-font-light tw-bg-gray-600 tw-rounded-full tw-px-2">공사중</span>
                </span>
              ) : (
                <div className="tw-invisible group-hover:tw-visible tw-absolute tw-left-12 tw-bg-gray-800 tw-text-white tw-px-2 tw-py-1 tw-rounded tw-whitespace-nowrap tw-text-xs tw-z-50">
                  개발자 노트
                </div>
              )}
            </span>
          </OverlayTrigger> */}
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id={`tooltip-setting`} className="tw-text-xs">
                설정
              </Tooltip>
            }
          >
            <span
              className={`tw-text-sm tw-text-gray-400 tw-font-bold tw-flex tw-items-center tw-gap-2 tw-cursor-pointer group relative hover:tw-bg-gray-700 hover:tw-bg-opacity-30 tw-rounded   ${
                !isMiniMode ? 'tw-p-1.5' : 'tw-my-1'
              }`}
              onClick={() => dispatch(setIsSetting(true))}
            >
              <div className={`${isMiniMode ? 'tw-bg-gray-700 tw-bg-opacity-30 tw-p-2 tw-rounded-md' : ''}`}>
                <FaGear size={isMiniMode ? 16 : 12} />
              </div>
              {!isMiniMode ? (
                <span className="tw-text-xs">설정</span>
              ) : (
                <div className="tw-invisible group-hover:tw-visible tw-absolute tw-left-12 tw-bg-gray-800 tw-text-white tw-px-2 tw-py-1 tw-rounded tw-whitespace-nowrap tw-text-xs tw-z-50">
                  설정
                </div>
              )}
            </span>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id={`tooltip-sidebar-toggle`} className="tw-text-xs">
                {isMiniMode ? '사이드바 최대화' : '사이드바 최소화'}
              </Tooltip>
            }
          >
            <span
              className={`tw-text-sm tw-text-gray-400 tw-font-bold tw-flex tw-items-center tw-gap-2 tw-cursor-pointer group relative hover:tw-bg-gray-700 hover:tw-bg-opacity-30 tw-rounded ${
                !isMiniMode ? 'tw-p-1.5' : 'tw-my-1'
              }`}
              onClick={() => handleSettingChange({ isMiniMode: !isMiniMode })}
            >
              {true && (
                <div className={`${isMiniMode ? 'tw-bg-gray-700 tw-bg-opacity-30 tw-p-2 tw-rounded-md' : ''}`}>
                  {isMiniMode ? <FaTableList size={isMiniMode ? 16 : 12} /> : <FaTableList size={isMiniMode ? 16 : 12} />}
                </div>
              )}
              {!isMiniMode ? (
                <span className="tw-text-xs">사이드바 최소화</span>
              ) : (
                <div className="tw-invisible group-hover:tw-visible tw-absolute tw-left-12 tw-bg-gray-800 tw-text-white tw-px-2 tw-py-1 tw-rounded tw-whitespace-nowrap tw-text-xs tw-z-50">
                  사이드바 최대화
                </div>
              )}
            </span>
          </OverlayTrigger>
        </div>
      </div>
    </>
  )
}

export default SidebarComponent
