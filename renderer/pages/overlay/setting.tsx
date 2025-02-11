import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

import { FaCircleInfo } from 'react-icons/fa6'
import Head from 'next/head'
import Image from 'next/image'
import { RootState } from 'store'
import { setSettingData } from 'store/slices/appSlice'

const OverlaySetting = ({ setSelectedImage }: { setSelectedImage: (image: string) => void }) => {
  const dispatch = useDispatch()
  const { settingData, songData } = useSelector((state: RootState) => state.app)
  const [data, setData] = useState<any | null>(null)
  const [image, setImage] = useState<string | null>('RESULT_OVERLAY_EXAMPLE.png')

  useEffect(() => {
    if (songData) {
      setData(songData[16])
    }
  }, [songData])

  const handleSettingChange = (newSettings: any) => {
    window.ipc.send('changeSettingData', newSettings)
    dispatch(setSettingData({ ...settingData, ...newSettings }))
  }

  return (
    data && (
      <>
        <Head>
          <title>오버레이 설정 - RACLA</title>
        </Head>
        <div id='ContentHeader' />
        <div className='tw-flex tw-gap-4'>
          <div className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-4 tw-flex-1'>
            <div className='tw-flex tw-w-full tw-items-end tw-justify-between'>
              <span className='tw-text-xl tw-font-bold tw-text-white'>🎮 오버레이 설정</span>
            </div>

            <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2'>
              <p className='tw-leading-relaxed'>
                게임 실행 중 표시되는 오버레이의 설정을 변경할 수 있습니다.
              </p>
            </div>

            <div className='tw-flex tw-justify-end tw-gap-2 tw-items-start tw-text-xs tw-font-semibold'>
              <FaCircleInfo className='tw-mt-0.5 tw-text-blue-500' />
              <div className='tw-flex tw-flex-col tw-gap-1 tw-text-gray-300'>
                <span>추후 더 많은 오버레이 기능을 제공할 예정입니다.</span>
              </div>
            </div>
          </div>
        </div>
        <div className='tw-flex tw-gap-4'>
          <div className='tw-flex tw-flex-col tw-gap-4 tw-flex-1'>
            <div
              className='tw-flex-1 tw-flex tw-flex-col tw-gap-1 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md p-4'
              onMouseEnter={() => setImage('RESULT_OVERLAY_EXAMPLE_UPLOAD.png')}
              onMouseLeave={() => setImage('RESULT_OVERLAY_EXAMPLE.png')}
            >
              <div className='tw-flex tw-flex-col tw-gap-1'>
                <div className='tw-flex tw-items-center'>
                  <span className='tw-text-sm'>결과 오버레이 표시</span>
                  <button
                    className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                      settingData.resultOverlay ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                    }`}
                    onClick={() => {
                      handleSettingChange({ resultOverlay: !settingData.resultOverlay })
                    }}
                  >
                    <span
                      className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                        settingData.resultOverlay ? 'tw-right-1' : 'tw-left-1'
                      }`}
                    />
                  </button>
                </div>
                <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep tw-mb-2'>
                  DJMAX RESPECT V, WJMAX 에서 자동 캡쳐 또는 수동 캡쳐 모드에서 캡쳐한 결과와 처리
                  과정을 인게임 오버레이로 표시합니다. DJMAX RESPECT V는 V-ARCHIVE와 연동이
                  필요하며, 버서스/래더 매치 화면은 지원하지 않습니다.
                </span>
              </div>
            </div>

            <div
              className='tw-flex-1 tw-flex tw-flex-col tw-gap-1 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md p-4'
              onMouseEnter={() => setImage('RESULT_OVERLAY_EXAMPLE_HJA.png')}
              onMouseLeave={() => setImage('RESULT_OVERLAY_EXAMPLE.png')}
            >
              <div className='tw-flex tw-flex-col tw-gap-1'>
                <div className='tw-flex tw-items-center'>
                  <span className='tw-text-sm'>결과 오버레이 표시 시 전일 기록 오버레이 표시</span>
                  <button
                    className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                      settingData.hjaOverlay ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                    }`}
                    onClick={() => {
                      handleSettingChange({ hjaOverlay: !settingData.hjaOverlay })
                    }}
                  >
                    <span
                      className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                        settingData.hjaOverlay ? 'tw-right-1' : 'tw-left-1'
                      }`}
                    />
                  </button>
                </div>
                <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep tw-mb-2'>
                  DJMAX RESPECT V의 결과 오버레이 표시 시 전일 아카이브에 등록된 최고 기록 정보를
                  표시합니다. WJMAX는 RACLA 기록을 바탕으로로 추후 지원 예정입니다.
                </span>
              </div>
            </div>

            <div
              className='tw-flex-1 tw-flex tw-flex-col tw-gap-1 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md p-4'
              onMouseEnter={() => setImage('RESULT_OVERLAY_EXAMPLE_RECENT.png')}
              onMouseLeave={() => setImage('RESULT_OVERLAY_EXAMPLE.png')}
            >
              <div className='tw-flex tw-flex-col tw-gap-1'>
                <div className='tw-flex tw-items-center'>
                  <span className='tw-text-sm'>결과 오버레이 표시 시 최근 기록 오버레이 표시</span>
                  <button
                    className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                      settingData.recentOverlay ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                    }`}
                    onClick={() => {
                      handleSettingChange({ recentOverlay: !settingData.recentOverlay })
                    }}
                  >
                    <span
                      className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                        settingData.recentOverlay ? 'tw-right-1' : 'tw-left-1'
                      }`}
                    />
                  </button>
                </div>
                <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep tw-mb-2'>
                  DJMAX RESPECT V의 결과 오버레이 표시 시 해당 수록곡 패턴의 RACLA 최근 기록 정보를
                  표시합니다. WJMAX는 RACLA 기록을 바탕으로 추후 지원 예정입니다.
                </span>
              </div>
            </div>
          </div>
          <div className='tw-flex tw-flex-col tw-gap-1 tw-justify-center tw-items-center tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-md p-4'>
            <div className='tw-min-w-[512px] tw-w-[512px] tw-max-w-[512px] tw-min-h-[384px] tw-h-[384px] tw-max-h-[384px]'>
              <div className='tw-relative tw-w-full tw-h-full tw-rounded tw-overflow-hidden'>
                <Image
                  src='https://ribbon.r-archive.zip/project_ra/RESULT_OVERLAY_EXAMPLE.png'
                  alt='overlay-base'
                  className='tw-cursor-pointer tw-rounded-lg tw-transition-opacity tw-duration-300'
                  fill
                  style={{
                    objectFit: 'contain',
                    opacity: image !== 'RESULT_OVERLAY_EXAMPLE.png' ? 0 : 1,
                  }}
                  onClick={() =>
                    setSelectedImage(
                      `https://ribbon.r-archive.zip/project_ra/RESULT_OVERLAY_EXAMPLE.png?full=1`,
                    )
                  }
                  referrerPolicy='origin'
                />

                <Image
                  src='https://ribbon.r-archive.zip/project_ra/RESULT_OVERLAY_EXAMPLE_UPLOAD.png'
                  alt='overlay-upload'
                  className='tw-cursor-pointer tw-rounded-lg tw-transition-opacity tw-duration-300 tw-absolute tw-inset-0'
                  style={{
                    objectFit: 'contain',
                    opacity: image !== 'RESULT_OVERLAY_EXAMPLE_UPLOAD.png' ? 0 : 1,
                  }}
                  fill
                  onClick={() =>
                    setSelectedImage(
                      `https://ribbon.r-archive.zip/project_ra/RESULT_OVERLAY_EXAMPLE.png?full=1`,
                    )
                  }
                  referrerPolicy='origin'
                />

                <Image
                  src='https://ribbon.r-archive.zip/project_ra/RESULT_OVERLAY_EXAMPLE_HJA.png'
                  alt='overlay-hja'
                  className='tw-cursor-pointer tw-rounded-lg tw-transition-opacity tw-duration-300 tw-absolute tw-inset-0'
                  style={{
                    objectFit: 'contain',
                    opacity: image !== 'RESULT_OVERLAY_EXAMPLE_HJA.png' ? 0 : 1,
                  }}
                  fill
                  onClick={() =>
                    setSelectedImage(
                      `https://ribbon.r-archive.zip/project_ra/RESULT_OVERLAY_EXAMPLE.png?full=1`,
                    )
                  }
                  referrerPolicy='origin'
                />

                <Image
                  src='https://ribbon.r-archive.zip/project_ra/RESULT_OVERLAY_EXAMPLE_RECENT.png'
                  alt='overlay-recent'
                  className='tw-cursor-pointer tw-rounded-lg tw-transition-opacity tw-duration-300 tw-absolute tw-inset-0'
                  style={{
                    objectFit: 'contain',
                    opacity: image !== 'RESULT_OVERLAY_EXAMPLE_RECENT.png' ? 0 : 1,
                  }}
                  fill
                  onClick={() =>
                    setSelectedImage(
                      `https://ribbon.r-archive.zip/project_ra/RESULT_OVERLAY_EXAMPLE.png?full=1`,
                    )
                  }
                  referrerPolicy='origin'
                />
              </div>
            </div>
          </div>
        </div>
        <div id='ContentFooter' />
      </>
    )
  )
}

export default OverlaySetting
