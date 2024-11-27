import { FaGear } from 'react-icons/fa6'
import { FiX } from 'react-icons/fi'
import { useSelector, useDispatch } from 'react-redux'
import { setIsSetting, setSettingData } from 'store/slices/appSlice'
import type { RootState } from 'store'
import { useEffect, useState } from 'react'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import { globalDictionary } from '@/libs/server/globalDictionary'

const SettingComponent = () => {
  const dispatch = useDispatch()
  const { isSetting, settingData } = useSelector((state: RootState) => state.app)
  const [category, setCategory] = useState<'app' | 'capture' | 'data' | 'shortcut' | 'overlay'>('app')
  const isDetectedGame = useSelector((state: RootState) => state.app.isDetectedGame)
  const { showNotification } = useNotificationSystem()
  const [captureTestMessage, setCaptureTestMessage] = useState('')

  useEffect(() => {
    setCaptureTestMessage('')
  }, [isSetting, category])

  const handleSettingChange = (newSettings: any) => {
    window.ipc.send('changeSettingData', newSettings)
    dispatch(setSettingData({ ...settingData, ...newSettings }))
  }

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSetting) {
        dispatch(setIsSetting(false))
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [isSetting])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      dispatch(setIsSetting(false))
    }
  }

  const appSection = (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm">하드웨어 가속 활성화</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.hardwareAcceleration ? 'tw-bg-blue-600' : 'tw-bg-gray-300'
            }`}
            disabled
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
              handleSettingChange({ homeButtonAlignRight: !settingData.homeButtonAlignRight })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.homeButtonAlignRight ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">뒤로가기와 새로고침 버튼을 홈 버튼보다 우선으로 배치되도록 설정합니다.</span>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm">저사양 모드(애니메이션 효과 비활성화)</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              !settingData.visibleAnimation ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({ visibleAnimation: !settingData.visibleAnimation })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                !settingData.visibleAnimation ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
          대부분의 애니메이션 효과를 비활성화 합니다. 사양이 낮은 기기에서 프로젝트 RA를 사용거나 게임 또는 다른 애플리케이션에 성능 집중시킬 경우 활성화 하는
          것을 권장합니다.
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
              handleSettingChange({ visibleBga: !settingData.visibleBga })
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
              settingData.autoUpdate ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({ autoUpdate: !settingData.autoUpdate })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoUpdate ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
          자동 업데이트 활성화 시 프로젝트 RA를 실행할 때마다 업데이트를 확인합니다.
        </span>
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
          프로젝트 RA의 언어를 변경합니다. 일부 화면은 언어 데이터가 미존재 시 한국어 또는 영어를 우선하여 표시합니다. 설정을 변경하면 앱이 다시 시작됩니다.
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
          className="tw-px-3 tw-py-2 tw-bg-gray-600 tw-text-xs tw-shadow-sm tw-rounded-md"
          type="button"
          onClick={() => {
            window.ipc.send('reload-app')
          }}
        >
          앱 재시작
        </button>
      </div>

      <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">
        DJMAX(NEOWIZ) and V-ARCHIVE, I deeply respect you. {'<'}3<br />
        PROJECT RA is dedicated to your remarkable games and services.
      </span>

      <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-break-keep">{globalDictionary.version}-main</span>
    </div>
  )

  const overlaySection = (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm">오버레이</span>
        </div>
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          오버레이 옵션은 사이드바에 위치한 프로젝트 RA 탭의 오버레이 메뉴에서 확인하실 수 있습니다.
        </span>
      </div>
    </div>
  )

  const captureSection = (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm">자동 캡쳐 모드(자동 성과 기록 등록)</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoCaptureMode ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({ autoCaptureMode: !settingData.autoCaptureMode })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoCaptureMode ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          자동 캡쳐 모드는 프로젝트 RA에서 지원하는 게임이 실행 중일 경우 주기적으로 캡쳐하여 결과 창이 인식되는 경우 캡쳐 이미지를 분석하여 서버로 성과 기록을
          갱신하는 기능입니다. 활성화 시 다른 백그라운드 애플리케이션 또는 사용 환경, 사양 등에 따라 화면 끊어짐 등의 이상 현상이 발생할 수 있습니다. 만약 화면
          끊어짐 현상 등이 발생하는 경우 아래에 제공된 부가 옵션을 환경에 맞춰 사용하는 것을 권장합니다.
        </span>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-sm">캡쳐 주기</span>
        <select
          className="form-select tw-my-1 tw-text-xs tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36"
          onChange={(e) => handleSettingChange({ autoCaptureIntervalTime: Number(e.currentTarget.value) })}
          value={String(settingData.autoCaptureIntervalTime)}
        >
          <option value="1000">1초(상남자 옵션)</option>
          <option value="2000">2초</option>
          <option value="3000">3초(추천)</option>
          <option value="5000">5초</option>
          <option value="10000">10초</option>
        </select>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm">게임 화면(창)이 포커스 된 경우에만 캡쳐</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.captureOnlyFocused ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => handleSettingChange({ captureOnlyFocused: !settingData.captureOnlyFocused })}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.captureOnlyFocused ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          게임 화면 또는 해당 창이 포커스 된 경우에만 자동 캡쳐 모드를 진행합니다. 게임 플레이 중 다른 애플리케이션 등의 활동 시 성능에 문제가 발생한다면 활성화
          하는 것을 권장합니다.
        </span>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm">스마트 흑백 여백 제거</span>
          <button
            disabled
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoRemoveBlackPixel ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => handleSettingChange({ autoRemoveBlackPixel: !settingData.autoRemoveBlackPixel })}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoRemoveBlackPixel ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          자동 캡쳐 모드에서 캡쳐 과정에서 생긴 이미지의 흑백 여백을 프로젝트 RA에서 자동으로 제거 후 재처리하여 서버로 전송합니다. 현재는 강제적으로 활성화
          되어 있습니다.
        </span>
        <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-sm">흑백 여백 제거 크기(px)</span>
        <input
          className="tw-border tw-rounded-md tw-px-3 tw-py-1.5 tw-my-1 tw-text-xs tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36"
          onChange={(e) => handleSettingChange({ removeBlackPixelPx: Number(e.currentTarget.value) })}
          value={String(settingData.removeBlackPixelPx)}
          type="number"
          disabled
        />
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          스마트 흑백 여백 제거 기능이 올바르게 작동하지 않을 경우 수동으로 흑백 여백 제거 크기를 설정합니다. 현재는 강제적으로 스마트 흑백 여백 제거 기능을
          통해 수치를 조절하며 추후 여러 환경 에서의 자동 캡쳐 모드의 성능 통계가 집계되어 안정화가 되었을 경우 해당 옵션이 잠금 해제될 예정입니다.
        </span>
        <span className="tw-text-xs tw-font-light tw-text-red-500">해당 버전에서는 변경할 수 없는 설정값입니다.</span>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-sm">캡쳐 API(Deprecated)</span>
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          0.5.0 버전 이후로는 커스터마이징된 XCap API(https://github.com/nashaofu/xcap)를 고정하여 사용합니다. 해당 설정은 더 이상 사용되지 않습니다. 추후
          삭제될 예정입니다.
        </span>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-sm">텍스트 인식(OCR) API(Deprecated)</span>
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          0.5.0 버전 이후로는 텍스트 인식을 클라이언트에서 처리하지 않으며 서버(Project RA OCR API Server)에서만 처리합니다. 해당 설정은 더 이상 사용되지
          않습니다. 추후 삭제될 예정입니다.
        </span>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <div>
          <button
            className="tw-px-3 tw-py-2 tw-bg-red-900 tw-text-xs tw-shadow-sm tw-rounded-md"
            type="button"
            onClick={() => {
              if (isDetectedGame) {
                window.ipc.send('captureTest')
                showNotification('화면 캡쳐가 요청 되었습니다. 결과 이미지는 사용자의 사진 폴더에 위치한 PROJECT-RA에서 확인할 수 있습니다.', 'tw-bg-lime-600')
                setCaptureTestMessage(
                  '화면 캡쳐가 요청 되었습니다. 결과 이미지는 사용자의 사진 폴더에 위치한 PROJECT-RA에서 확인할 수 있습니다. 상하좌우로 1px을 초과하는 여백이 포함이 된 경우 자동 캡쳐 모드가 올바르게 동작하지 않을 수 있습니다.',
                )
              } else {
                showNotification('게임이 실행 중이지 않습니다.', 'tw-bg-red-600')
                setCaptureTestMessage('게임이 실행 중이지 않습니다. 게임(DJMAX RESPECT V)을 실행한 후 다시 시도해주세요.')
              }
            }}
          >
            캡쳐 테스트
          </button>
        </div>

        <span className="tw-text-xs tw-font-light tw-text-gray-400">{captureTestMessage}</span>
      </div>
    </div>
  )

  const dataSection = (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm">캡쳐 시 이미지 저장</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.saveImageWhenCapture ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({ saveImageWhenCapture: !settingData.saveImageWhenCapture })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.saveImageWhenCapture ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          수동 캡쳐 또는 자동 캡쳐 모드에서 캡처한 이미지를 사용자 계정 경로의 사진 폴더 내에 PROJECT-RA에 저장합니다.
        </span>
      </div>
    </div>
  )

  const shortcutSection = (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-sm">수동 캡쳐(업로드) 단축키</span>
        <input
          className="tw-border tw-rounded-md tw-px-3 tw-py-1.5 tw-my-1 tw-text-xs tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36"
          // onChange={(e) => handleSettingChange({ removeBlackPixelPx: Number(e.currentTarget.value) })}
          value={'Ctrl + Alt + Insert'}
          type="text"
          disabled
        />
        <span className="tw-text-xs tw-font-light tw-text-gray-400">
          수동 캡쳐(업로드) 단축키를 설정합니다. 리절트(결과) 창에서만 사용할 수 있습니다. Ctrl + Alt + Insert 키가 먼저 예약되어 있는 다른 애플리케이션 또는
          프로그램과 동시 사용 시 정상적으로 동작하지 않습니다.
        </span>
        <span className="tw-text-xs tw-font-light tw-text-red-500">
          해당 버전에서는 변경할 수 없는 설정값입니다. 현재 Alt + Insert 키로만 사용할 수 있습니다.
        </span>
      </div>
    </div>
  )

  return (
    <div
      className={`tw-fixed tw-inset-0 tw-z-[9999] tw-transition-opacity tw-duration-300 ${
        isSetting ? 'tw-opacity-100 tw-pointer-events-auto' : 'tw-opacity-0 tw-pointer-events-none'
      }`}
    >
      <div className="tw-fixed tw-inset-0 tw-bg-gray-950 tw-bg-opacity-90" onClick={handleBackdropClick} />
      <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center">
        <div
          className={`tw-flex tw-gap-3 tw-flex-col tw-h-4/6 tw-w-3/6 tw-bg-gray-900 tw-rounded-md tw-p-4 
             tw-overflow-hidden tw-transition-all tw-duration-300 ${isSetting ? 'tw-opacity-100 tw-translate-y-0' : 'tw-opacity-0 tw-translate-y-4'}`}
        >
          <div className="tw-flex tw-items-center tw-mb-1">
            <span className="tw-flex tw-gap-2 tw-items-center tw-text-lg tw-font-bold me-auto">
              <FaGear />
              설정
            </span>
            <button
              className="tw-text-xl"
              type="button"
              onClick={() => {
                dispatch(setIsSetting(false))
              }}
            >
              <FiX />
            </button>
          </div>
          <div className="tw-flex tw-h-full">
            <div className="tw-w-48 tw-flex tw-flex-col tw-gap-2 tw-border-r tw-border-gray-700 tw-pr-3">
              <button
                className={`tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${category === 'app' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'}`}
                onClick={() => setCategory('app')}
              >
                앱
              </button>
              <button
                className={`tw-flex tw-justify-between tw-items-center tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${
                  category === 'overlay' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'
                }`}
                onClick={() => setCategory('overlay')}
              >
                <span>오버레이</span>
                <span className="tw-text-xs tw-bg-blue-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                  베타
                </span>
              </button>
              <button
                className={`tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${category === 'data' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'}`}
                onClick={() => setCategory('data')}
              >
                저장 공간(데이터)
              </button>
              <button
                className={`tw-flex tw-justify-between tw-items-center tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${
                  category === 'capture' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'
                }`}
                onClick={() => setCategory('capture')}
              >
                <span>자동 캡쳐 모드</span>
                <span className="tw-text-xs tw-bg-blue-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                  베타
                </span>
              </button>
              <button
                className={`tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${category === 'shortcut' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'}`}
                onClick={() => setCategory('shortcut')}
              >
                단축키
              </button>
            </div>
            <div className="tw-flex tw-gap-3 tw-flex-col tw-overflow-y-auto tw-scroll-smooth tw-pl-3 tw-flex-1 tw-pb-16">
              {category === 'app'
                ? appSection
                : category === 'overlay'
                ? overlaySection
                : category === 'capture'
                ? captureSection
                : category === 'shortcut'
                ? shortcutSection
                : dataSection}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingComponent
