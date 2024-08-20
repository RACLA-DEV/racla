// SidebarComponent.tsx
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { FaBug, FaGear, FaNoteSticky } from 'react-icons/fa6'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'
import { renderNavigation } from './renderNavigation'
import { renderUpdateSection } from './renderUpdateSection'

interface SidebarProps {
  addNotificationCallback: (message: string, color?: string) => void
  toggleSettingCallback: (isOpen: boolean) => void
  selectedGame: string
}

const SidebarComponent: React.FC<SidebarProps> = ({ addNotificationCallback, toggleSettingCallback, selectedGame }) => {
  const router = useRouter()
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{ percent: string } | null>(null)
  const [isDownloaded, setIsDownloaded] = useState(false)

  useEffect(() => {
    const handleUpdateAvailable = (info: string) => {
      setUpdateVersion(info)
    }

    const handleDownloadProgress = (info: { percent: string }) => {
      setDownloadProgress(info)
    }

    const handleUpdateDownloaded = () => {
      setIsDownloaded(true)
    }

    window.ipc.on('update-available', handleUpdateAvailable)
    window.ipc.on('download-progress', handleDownloadProgress)
    window.ipc.on('update-downloaded', handleUpdateDownloaded)

    return () => {
      window.ipc.removeListener('update-available', handleUpdateAvailable)
      window.ipc.removeListener('download-progress', handleDownloadProgress)
      window.ipc.removeListener('update-downloaded', handleUpdateDownloaded)
    }
  }, [])

  useEffect(() => {
    if (updateVersion) {
      addNotificationCallback(`프로젝트 RA의 업데이트(${updateVersion})가 존재합니다. 자동 업데이트를 준비합니다.`, 'tw-bg-blue-600')
    }
  }, [updateVersion, addNotificationCallback])

  return (
    <>
      <div
        className={`tw-flex tw-fixed tw-px-4 tw-py-5 tw-flex-col tw-bg-gray-600 tw-bg-opacity-10 tw-w-52 tw-left-0 tw-top-12 tw-z-50 tw-transition-all ${
          updateVersion ? 'tw-bottom-28' : 'tw-bottom-8'
        }`}
      >
        {renderNavigation(selectedGame, router)}

        {/* 기타 */}
        <div className="tw-flex tw-flex-col tw-gap-1 tw-mt-auto">
          <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
            <FaBug />
            <span className="tw-flex tw-gap-1 tw-w-full tw-items-center">
              버그 신고{' '}
              <span className="tw-ms-auto tw-text-xs tw-bg-gray-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                공사중
              </span>
            </span>
          </span>
          <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar">
            <FaNoteSticky />
            <span className="tw-flex tw-gap-1 tw-w-full tw-items-center">
              개발자 노트{' '}
              <span className="tw-ms-auto tw-text-xs tw-bg-gray-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                공사중
              </span>
            </span>
          </span>
          <span className="tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar" onClick={() => toggleSettingCallback(true)}>
            <FaGear />
            <span>설정</span>
          </span>
        </div>
      </div>

      {renderUpdateSection(updateVersion, downloadProgress, isDownloaded)}
    </>
  )
}

export default SidebarComponent
