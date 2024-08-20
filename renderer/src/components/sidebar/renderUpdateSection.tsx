// renderUpdateSection.tsx
import React from 'react'
import { FaDownload, FaRotate } from 'react-icons/fa6'
import { IconContext } from 'react-icons'

export const renderUpdateSection = (updateVersion: string | null, downloadProgress: { percent: string } | null, isDownloaded: boolean) => {
  if (updateVersion) {
    return (
      <div
        className={`tw-flex tw-fixed tw-px-4 tw-py-5 tw-items-center tw-gap-3 tw-bg-gray-400 tw-bg-opacity-10 tw-w-52 tw-left-0 tw-h-20 tw-bottom-8 tw-z-40 tw-transition-all ${
          updateVersion ? 'tw-opacity-100' : 'tw-opacity-0'
        } ${isDownloaded ? 'tw-animate-fadeInOut tw-cursor-pointer' : ''}`}
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
            {updateVersion ? `V${updateVersion}${downloadProgress ? `(${Math.floor(Number(downloadProgress.percent))})` : ``}` : null}
          </span>
        </div>
        <div
          className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50
            tw-transition-all tw-duration-1000`}
          style={{
            width: downloadProgress ? `${Math.floor(Number(downloadProgress.percent))}%` : `${isDownloaded ? 100 : 0}%`,
          }}
        />
      </div>
    )
  }
  return null
}
