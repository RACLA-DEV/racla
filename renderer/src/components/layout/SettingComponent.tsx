import { FaGear } from 'react-icons/fa6'
import { FiX } from 'react-icons/fi'

const SettingComponent = ({ isSetting, toggleSettingCallback, settingData, settingDataCallback }) => {
  return (
    <div
      className={`tw-bg-gray-950 tw-backdrop-blur-sm tw-h-full tw-w-full tw-fixed tw-transition-all tw-bg-opacity-75 tw-shadow-lg ${
        isSetting ? ' tw-opacity-100 tw-z-50 tw-animate-fadeInDown' : 'tw-opacity-0'
      }`}
    >
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-w-full">
        <div className="tw-flex tw-gap-3 tw-flex-col tw-h-4/6 tw-w-3/6 tw-bg-gray-900 tw-rounded-md tw-p-4 tw-border-gray-700 tw-border">
          <div className="tw-flex tw-items-center">
            <span className="tw-flex tw-gap-2 tw-items-center tw-text-lg tw-font-bold me-auto">
              <FaGear />
              설정
            </span>
            <button
              className="tw-text-xl"
              type="button"
              onClick={() => {
                toggleSettingCallback(false)
              }}
            >
              <FiX />
            </button>
          </div>
          <div className="tw-flex tw-gap-3 tw-flex-col tw-overflow-y-auto tw-scroll-smooth">
            <div className="tw-flex tw-flex-col tw-gap-1">
              <div className="tw-flex tw-items-center">
                <span className="tw-text-sm">하드웨어 가속 활성화</span>
                <button
                  className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                    settingData.hardwareAcceleration ? 'tw-bg-blue-600' : 'tw-bg-gray-300'
                  }`}
                >
                  <span
                    className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                      settingData.hardwareAcceleration ? 'tw-right-1' : 'tw-left-1'
                    }`}
                  />
                </button>
              </div>
              <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                하드웨어 가속은 GPU를 사용하여 프로젝트 RA가 더 부드럽게 동작하게 해줍니다. 프로젝트 RA의 화면에 문제가 발생한다면 이 설정을 비활성화 해보시기
                바랍니다. 설정을 변경하면 앱이 다시 시작됩니다.
              </span>
              <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <div className="tw-flex tw-items-center">
                <span className="tw-text-sm">상단바 홈 버튼을 오른쪽으로 정렬</span>
                <button
                  className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                    settingData.homeButtonAlignRight ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                  }`}
                  onClick={() => {
                    window.ipc.send('changeSettingData', { homeButtonAlignRight: !settingData.homeButtonAlignRight })
                    settingDataCallback({ ...settingData, homeButtonAlignRight: !settingData.homeButtonAlignRight })
                  }}
                >
                  <span
                    className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                      settingData.homeButtonAlignRight ? 'tw-right-1' : 'tw-left-1'
                    }`}
                  />
                </button>
              </div>
              <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                뒤로가기와 새로고침 버튼을 홈 버튼보다 우선으로 배치되도록 설정합니다.
              </span>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <div className="tw-flex tw-items-center">
                <span className="tw-text-sm">BGA 영상 표시</span>
                <button
                  className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                    settingData.visibleBga ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                  }`}
                  onClick={() => {
                    window.ipc.send('changeSettingData', { visibleBga: !settingData.visibleBga })
                    settingDataCallback({ ...settingData, visibleBga: !settingData.visibleBga })
                  }}
                >
                  <span
                    className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                      settingData.visibleBga ? 'tw-right-1' : 'tw-left-1'
                    }`}
                  />
                </button>
              </div>
              <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                기본적인 배경 BGA 영상과 BGA가 존재하는 곡의 이미지(자켓)에 마우스 커서를 올려둔 경우 해당 곡의 BGA 영상을 표시합니다.
              </span>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <div className="tw-flex tw-items-center">
                <span className="tw-text-sm">자동 업데이트</span>
                <button
                  className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                    true ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                  }`}
                >
                  <span
                    className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                      true ? 'tw-right-1' : 'tw-left-1'
                    }`}
                  />
                </button>
              </div>
              <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                자동 업데이트 활성화 시 프로젝트 RA를 실행할 때마다 업데이트를 확인합니다.
              </span>
              <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <div className="tw-flex tw-items-center">
                <span className="tw-text-sm">언어</span>
                {/* <button
                className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
                  false ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                }`}
              >
                <span
                  className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                    false ? 'tw-right-1' : 'tw-left-1'
                  }`}
                />
              </button> */}
              </div>
              <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
                프로젝트 RA의 언어를 변경합니다. 일부 화면은 언어 데이터가 미존재 시 한국어 또는 영어를 우선하여 표시합니다. 설정을 변경하면 앱이 다시
                시작됩니다.
              </span>
              <select className="form-select tw-my-1 tw-text-xs tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36" defaultValue="ko">
                <option value="ko">한국어(Korean)</option>
                <option value="en" disabled>
                  영어(English)
                </option>
              </select>
              <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
            </div>
            <div className="tw-mt-1">
              <button
                className="tw-ms-2 tw-px-3 tw-py-2 tw-bg-gray-600 tw-text-xs tw-shadow-sm tw-rounded-md"
                type="button"
                onClick={() => {
                  window.ipc.send('reload-app')
                }}
              >
                앱 재시작
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingComponent
