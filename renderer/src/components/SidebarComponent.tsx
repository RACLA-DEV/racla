import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
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
  FaDownload,
  FaRotate,
  FaBug,
} from 'react-icons/fa6'
import * as R from 'ramda'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'

const SidebarComponent = ({ addNotificationCallback, toggleSettingCallback, selectedGame }) => {
  const router = useRouter()
  const [updateVersion, setUpdateVersion] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<any>(null)
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false)

  useEffect(() => {
    window.ipc.on('update-available', (info) => {
      // console.log(info)
      setUpdateVersion(info)
    })

    return () => {
      window.ipc.removeListener('update-available', (info) => {
        setUpdateVersion(info)
      })
    }
  }, [])

  useEffect(() => {
    if (updateVersion) {
      addNotificationCallback(`프로젝트 RA의 업데이트(${String(updateVersion)})가 존재합니다. 자동 업데이트를 준비합니다.`, 'tw-bg-blue-600')
    }
  }, [updateVersion])

  useEffect(() => {
    window.ipc.on('download-progress', (info) => {
      // console.log(info)
      setDownloadProgress(info)
    })

    return () => {
      window.ipc.removeListener('download-progress', (info) => {
        setDownloadProgress(info)
      })
    }
  }, [])

  useEffect(() => {
    window.ipc.on('update-downloaded', () => {
      setIsDownloaded(true)
    })

    return () => {
      window.ipc.removeListener('update-downloaded', () => {
        setIsDownloaded(true)
      })
    }
  }, [])

  return (
    <>
      <div
        className={
          'tw-flex tw-fixed tw-px-4 tw-py-5 tw-flex-col tw-bg-gray-600 tw-bg-opacity-10 tw-w-52 tw-left-0 tw-top-12 tw-z-50 tw-transition-all ' +
          (updateVersion ? ' tw-bottom-28' : ' tw-bottom-8')
        }
      >
        {/* 동적 네비게이션 생성 */}
        {selectedGame !== undefined && selectedGame !== null && selectedGame !== ''
          ? R.keys(globalDictionary.navDictionary[selectedGame]).map((value) =>
              globalDictionary.navDictionary[selectedGame][value].isDisplay ? (
                <div key={globalDictionary.navDictionary[selectedGame][value].id + 'Main'} className="tw-flex tw-flex-col tw-animate-fadeInLeft">
                  <span key={globalDictionary.navDictionary[selectedGame][value].id + 'Head'} className="tw-font-semibold tw-text-xs tw-mb-4">
                    {globalDictionary.navDictionary[selectedGame][value].name}
                  </span>
                  <div key={globalDictionary.navDictionary[selectedGame][value].id + 'Body'} className="tw-flex tw-flex-col tw-gap-1 tw-mb-4">
                    {globalDictionary.navDictionary[selectedGame][value].pages.map((page) =>
                      page.isDisplay && page.status === 'stable' ? (
                        !page.isOpenBrowser ? (
                          // 클라이언트 내 이동
                          <Link
                            key={page.id}
                            href={globalDictionary.navDictionary[selectedGame][value].link + page.link}
                            className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar ${
                              router.pathname.includes(globalDictionary.navDictionary[selectedGame][value].link + page.link) ? 'active' : ''
                            }`}
                          >
                            {React.createElement(page.icon)}
                            <span>
                              {page.name.startWithSup ? <sup>{page.name.startWithSup} </sup> : null}
                              {page.name.base}
                            </span>
                          </Link>
                        ) : (
                          // 외부 브라우저 오픈
                          <button
                            key={page.id}
                            onClick={() => window.ipc.send('openBrowser', page.link)}
                            className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar`}
                          >
                            {React.createElement(page.icon)}
                            <span>
                              {page.name.startWithSup ? <sup>{page.name.startWithSup} </sup> : null}
                              {page.name.base}
                            </span>
                          </button>
                        )
                      ) : page.isDisplay && page.status === 'dev' ? (
                        <button key={page.id} className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar`}>
                          {React.createElement(page.icon)}
                          <span className="tw-flex tw-gap-1 tw-w-full tw-items-center">
                            {page.name.startWithSup ? <sup>{page.name.startWithSup} </sup> : null}
                            {page.name.base}
                            <span className="tw-ms-auto tw-text-xs tw-bg-gray-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                              공사중
                            </span>
                          </span>
                        </button>
                      ) : null,
                    )}
                  </div>
                </div>
              ) : null,
            )
          : null}

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

      {/* 업데이트 */}
      <div
        className={
          'tw-flex tw-fixed tw-px-4 tw-py-5 tw-items-center tw-gap-3 tw-bg-gray-400 tw-bg-opacity-10 tw-w-52 tw-left-0 tw-h-20 tw-bottom-8 tw-z-40 tw-transition-all ' +
          (updateVersion ? ' tw-opacity-100' : ' tw-opacity-0') +
          (isDownloaded ? ' tw-animate-fadeInOut tw-cursor-pointer' : '')
        }
        onClick={() => {
          if (isDownloaded) {
            window.ipc.send('update-app')
          }
        }}
      >
        <div className="tw-flex tw-items-center tw-justify-center tw-relative tw-h-3 tw-w-3">
          {updateVersion && downloadProgress && !isDownloaded ? (
            <IconContext.Provider value={{ className: 'tw-text-center tw-animate-spin tw-absolute' }}>
              <FaRotate />
            </IconContext.Provider>
          ) : (
            <FaDownload />
          )}
        </div>

        <div className="tw-flex tw-flex-col">
          <span className="tw-text-xs tw-font-bold">
            {updateVersion && downloadProgress && !isDownloaded ? '업데이트 다운로드 중' : isDownloaded ? '업데이트 가능(재시작 필요)' : '업데이트 준비 중'}
          </span>
          <span className="tw-text-xs tw-font-light tw-text-gray-200 tw-text-opacity-50">
            {updateVersion ? `V${String(updateVersion)}${downloadProgress ? `(${Math.floor(Number(downloadProgress.percent))}%)` : ``}` : null}
          </span>
        </div>
        <div
          className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50
            tw-transition-all tw-duration-1000`}
          style={{ width: downloadProgress ? `${Math.floor(Number(downloadProgress.percent))}%` : `${isDownloaded ? 100 : 0}%` }}
        />
      </div>
    </>
  )
}

export default SidebarComponent
