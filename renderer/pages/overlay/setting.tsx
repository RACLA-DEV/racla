import { globalDictionary } from '@/libs/server/globalDictionary'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { IconContext } from 'react-icons'
import { FaCircleCheck, FaCircleInfo, FaCircleXmark, FaCrown, FaTriangleExclamation } from 'react-icons/fa6'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { setSettingData } from 'store/slices/appSlice'

const OverlaySetting = () => {
  const dispatch = useDispatch()
  const { settingData, songData } = useSelector((state: RootState) => state.app)
  const [data, setData] = useState<any | null>(null)

  useEffect(() => {
    if (songData) {
      setData(songData[Math.floor(Math.random() * songData.length)])
    }
  }, [songData])

  const handleSettingChange = (newSettings: any) => {
    window.ipc.send('changeSettingData', newSettings)
    dispatch(setSettingData({ ...settingData, ...newSettings }))
  }

  return (
    data && (
      <>
        <div id="ContentHeader" />
        <div className="tw-flex tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-4 tw-flex-1">
            <div className="tw-flex tw-w-full tw-items-end tw-justify-between">
              <span className="tw-text-xl tw-font-bold tw-text-white">🎮 오버레이 설정</span>
            </div>

            <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2">
              <p className="tw-leading-relaxed">게임 실행 중 표시되는 오버레이의 설정을 변경할 수 있습니다.</p>
            </div>

            <div className="tw-flex tw-justify-end tw-gap-2 tw-items-start tw-text-xs tw-font-semibold">
              <FaCircleInfo className="tw-mt-0.5 tw-text-blue-500" />
              <div className="tw-flex tw-flex-col tw-gap-1 tw-text-gray-300">
                <span>추후 더 많은 오버레이 기능을 제공할 예정입니다.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4 tw-mb-4">
          <div className="tw-flex tw-flex-col tw-gap-1">
            <div className="tw-flex tw-items-center">
              <span className="tw-text-sm">결과 오버레이 표시</span>
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
            <span className="tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep tw-mb-2">
              자동 캡쳐 또는 수동 캡쳐 모드에서 캡쳐한 결과와 처리 과정을 예시와 같이 인게임 오버레이(중앙 하단 최대 600px)로 표시합니다. 단 버서스/래더 매치는
              현재 지원하지 않습니다. 해당 오버레이 크기는 피드백에 따라 추후 변경될 수 있습니다.
            </span>
          </div>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md p-4">
          <div className="tw-flex tw-gap-2">
            <div
              className={`tw-bg-lime-600
            tw-flex-1 tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg tw-mb-2`}
            >
              <div className="tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-center">
                <IconContext.Provider value={{ size: '60px', className: 'tw-text-gray-200' }}>
                  <FaCircleCheck />
                </IconContext.Provider>
                <div className="tw-flex tw-flex-col tw-gap-1">
                  <div className="tw-flex tw-gap-3">
                    <span className="tw-text-sm tw-font-light tw-text-gray-200 tw-break-keep">
                      게임 결과창 인식을 시작합니다. 잠시만 기다려주세요. (Ctrl+Alt+Insert 단축키 사용 시)
                    </span>
                  </div>
                </div>
              </div>
              <div className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50`} style={{ transform: 'translateX(-100%)' }} />
            </div>
            <div
              className={`tw-bg-blue-600 tw-flex-1
            tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg tw-mb-2`}
            >
              <div className="tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-center">
                <IconContext.Provider value={{ size: '60px', className: 'tw-text-gray-200' }}>
                  <FaCircleInfo />
                </IconContext.Provider>
                <div className="tw-flex tw-flex-col tw-gap-1">
                  <div className="tw-flex tw-gap-3">
                    <span className="tw-text-sm tw-font-light tw-text-gray-200 tw-break-keep">
                      DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. <br />
                      잠시만 기다려주세요. (자동 캡쳐 모드 사용 시)
                    </span>
                  </div>
                </div>
              </div>
              <div className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50`} style={{ transform: 'translateX(-100%)' }} />
            </div>
          </div>
          <div className="tw-flex tw-gap-2">
            <div
              className={`tw-bg-red-600 tw-flex-1
            tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg`}
            >
              <div className="tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-center">
                <IconContext.Provider value={{ size: '60px', className: 'tw-text-gray-200' }}>
                  <FaCircleXmark />
                </IconContext.Provider>
                <div className="tw-flex tw-flex-col tw-gap-1">
                  <div className="tw-flex tw-gap-3">
                    <span className="tw-text-sm tw-font-light tw-text-gray-200 tw-break-keep">
                      게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. <br />
                      다시 시도해주시길 바랍니다. (캡쳐 인식 불가 시)
                    </span>
                  </div>
                </div>
              </div>
              <div className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50`} style={{ transform: 'translateX(-100%)' }} />
            </div>
            <div
              className={`tw-bg-yellow-700 tw-flex-1
            tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg`}
            >
              <div className="tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-center">
                <IconContext.Provider value={{ size: '60px', className: 'tw-text-gray-200' }}>
                  <FaCrown />
                </IconContext.Provider>
                <div className="tw-flex tw-flex-col tw-gap-1">
                  <div className="tw-flex tw-gap-3">
                    <span className="tw-text-sm tw-font-light tw-text-gray-200 tw-break-keep">방금 전에 업로드된 곡의 성과로 TOP50이 갱신되었습니다.</span>
                  </div>
                </div>
              </div>
              <div className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50`} style={{ transform: 'translateX(-100%)' }} />
            </div>
            <div
              className={`respect_dlc_${data.dlcCode} respect_dlc_logo_${data.dlcCode} respect_dlc_logo_BG_${data.dlcCode}
            tw-text-xs tw-bg-opacity-80 tw-relative tw-text-white tw-rounded-lg tw-overflow-hidden tw-shadow-lg tw-flex-1`}
            >
              <div className="tw-py-3 tw-px-3 tw-flex tw-gap-3 tw-bg-gray-900 tw-bg-opacity-50 tw-items-center">
                <Image
                  loading="lazy" // "lazy" | "eager"
                  blurDataURL={globalDictionary.blurDataURL}
                  src={`/images/djmax_respect_v/jackets/${data.title}.jpg`}
                  alt="title"
                  width={60}
                  height={60}
                  className="tw-rounded-lg"
                />
                <div className="tw-flex tw-flex-col tw-gap-1 tw-flex-1">
                  <span className="tw-text-lg tw-font-bold">{data.name}</span>
                  <div className="tw-flex tw-gap-3 tw-flex-1">
                    <span className="tw-text-sm tw-font-light tw-text-gray-200">4B</span>
                    <span className="tw-text-sm tw-font-light tw-text-gray-200">SC</span>
                    {100 === 100 ? (
                      <span className="tw-text-sm tw-font-light tw-text-gray-200">PERFECT</span>
                    ) : (
                      <>
                        <span className="tw-text-sm tw-font-light tw-text-gray-200">100.00%</span>
                        <span className="tw-text-sm tw-font-light tw-text-gray-200">{1 === 1 ? 'MAX COMBO' : ''}</span>
                      </>
                    )}
                    <span className="tw-ms-auto tw-text-sm tw-font-light tw-text-gray-200">업로드 성공</span>
                  </div>
                </div>
              </div>
              <div className={`tw-absolute tw-bottom-0 tw-left-0 tw-h-1 tw-w-full tw-bg-white tw-bg-opacity-50`} />
            </div>
          </div>
        </div>
        <div id="ContentFooter" />
      </>
    )
  )
}

export default OverlaySetting
