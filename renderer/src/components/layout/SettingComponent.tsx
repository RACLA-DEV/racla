import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import axios, { AxiosResponse } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setIsSetting, setSettingData, setVArchiveUserData } from 'store/slices/appSlice'

import { useNotificationSystem } from '@/libs/client/useNotifications'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { FaGear } from 'react-icons/fa6'
import { FiX } from 'react-icons/fi'
import type { RootState } from 'store'

const SettingComponent = () => {
  const dispatch = useDispatch()
  const { isSetting, settingData, userData, vArchiveUserData } = useSelector(
    (state: RootState) => state.app,
  )
  const [category, setCategory] = useState<
    | 'app'
    | 'capture'
    | 'djmax_respect_v'
    | 'wjmax'
    | 'data'
    | 'shortcut'
    | 'overlay'
    | 'game'
    | 'account'
  >('app')
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

  const [errorMessage, setErrorMessage] = useState<string>('')

  const getUserName = async <T = IUserNameResponse, R = IUserNameRequest>(body: R): Promise<T> => {
    const { data } = await axios.post<T, AxiosResponse<T>, R>(
      `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/client/login`,
      body,
      {
        withCredentials: false,
      },
    )
    return data
  }

  const handleError = (error: string) => {
    showNotification(error, 'tw-bg-red-600')
    setErrorMessage(error)
  }

  const wjmaxFileInputRef = useRef<HTMLInputElement>(null)

  const handleWjmaxFileSelect = () => {
    wjmaxFileInputRef.current?.click()
  }

  const onWjmaxFileChange = async (e) => {
    try {
      const file = e.target.files[0]
      console.log(file)
      const filePath = file.path
      if (filePath.includes('WJMAX.exe')) {
        handleSettingChange({ autoStartGameWjmaxPath: filePath })
        setErrorMessage('')
      } else {
        setErrorMessage('WJMAX.exe 파일만 지정할 수 있습니다. 확인 후 다시 지정해주세요.')
      }
    } finally {
      wjmaxFileInputRef.current.value = ''
    }
  }

  const vArchiveFileInputRef = useRef<HTMLInputElement>(null)

  const handleVArchiveFileSelect = () => {
    vArchiveFileInputRef.current?.click()
  }

  const onVArchiveFileChange = async (e) => {
    const file = e.target.files[0]
    const fileReader = new FileReader()
    fileReader.onload = () => {
      const text = fileReader.result.toString().trim()
      try {
        if (
          // account.txt 유효성 검증
          // 구분자(공백)이 존재하는지
          text.includes(' ') &&
          // 구분자(공백)으로 나눈 후 배열의 길이가 2 인지(userNo, token)
          text.split(' ').length === 2 &&
          // userNo로 추정되는 부분 인덱스(0)이 숫자로만 구성되어 있는지
          !Number.isNaN(Number(text.split(' ')[0])) &&
          // token(uuidv4)으로 추정되는 부분 인덱스(1)에 - 문자가 포함되는지
          text.split(' ')[1].includes('-') &&
          // uuid 구조상 첫 번째(time-low) 필드의 문자열 길이가 8인지
          text.split(' ')[1].split('-')[0].length === 8 &&
          // uuid 구조상 두 번째(time-mid) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[1].length === 4 &&
          // uuid 구조상 세 번째(time-hight-and-version) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[2].length === 4 &&
          // uuid 구조상 네 번째(clock-seq-hi-and-reserved & clock-seq-low) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[3].length === 4 &&
          // uuid 구조상 다섯 번째(node) 필드의 문자열 길이가 12인지
          text.split(' ')[1].split('-')[4].length === 12
        ) {
          const data = getUserName({ userNo: text.split(' ')[0], token: text.split(' ')[1] })
          data.then(async (result) => {
            if (result.success) {
              const linkResult = await axios
                .post(`${process.env.NEXT_PUBLIC_API_URL}/v1/user/link/oauth/vArchive`, {
                  userNo: userData.userNo,
                  userToken: userData.userToken,
                  serviceUserNo: text.split(' ')[0],
                  serviceUserToken: text.split(' ')[1],
                  service: 'vArchive',
                })
                .then((data) => {
                  if (data.data.ok && data.data.result == 'success') {
                    showNotification('V-ARCHIVE 계정 연동이 완료되었습니다.', 'tw-bg-lime-600')
                    dispatch(
                      setVArchiveUserData({
                        userNo: text.split(' ')[0],
                        userToken: text.split(' ')[1],
                        userName: result.nickname,
                      }),
                    )
                    window.ipc.send('storeSession', {
                      userNo: userData.userNo,
                      userToken: userData.userToken,
                      vArchiveUserNo: text.split(' ')[0],
                      vArchiveUserToken: text.split(' ')[1],
                    })
                  } else if (!data.data.ok && data.data.result === 'notfound') {
                    handleError(
                      'V-ARCHIVE 계정 연동에 실패했습니다. V-ARCHIVE에 존재하지 않는 계정 정보입니다.',
                    )
                  } else if (!data.data.ok && data.data.result === 'already') {
                    handleError('V-ARCHIVE 계정 연동에 실패했습니다. 이미 연동된 계정 정보입니다.')
                  } else {
                    handleError('알 수 없는 오류가 발생했습니다. 다시 시도해주세요.')
                  }
                })
                .catch((e) => {
                  handleError('알 수 없는 오류가 발생했습니다. 다시 시도해주세요. ' + String(e))
                })
            } else {
              handleError(
                'V-ARCHIVE 계정 연동에 실패했습니다. V-ARCHIVE에 존재하지 않는 계정 정보입니다.',
              )
            }
          })
        } else {
          handleError(
            '유효하지 않은 사용자 정보입니다. V-ARCHIVE 공식 클라이언트로 생성한 로그인 데이터(account.txt) 파일을 선택해주세요.',
          )
        }
      } catch (e) {
        handleError('알 수 없는 오류가 발생했습니다. 다시 시도해주세요. ' + String(e))
      }
    }
    try {
      fileReader.readAsText(file)
    } catch (error) {
      handleError(String(error))
    } finally {
      vArchiveFileInputRef.current.value = ''
    }
  }

  const gameSection = (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>게임 자동 실행</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoStartGame ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({ autoStartGame: !settingData.autoStartGame })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoStartGame ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          RACLA 데스크톱 앱 실행 시 선택한 게임을 자동으로 실행합니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>DJMAX RESPECT V 자동 실행</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoStartGameDjmaxRespectV ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                autoStartGameDjmaxRespectV: !settingData.autoStartGameDjmaxRespectV,
                autoStartGameWjmax: false,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoStartGameDjmaxRespectV ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          RACLA 데스크톱 앱 실행 시 DJMAX RESPECT V를 자동으로 실행합니다. 해당 기능은 Steam과 DJMAX
          RESPECT V(Steam)가 설치되어 있을 경우에만 작동합니다. Microsoft Stroe 버전은 지원하지
          않습니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>WJMAX 자동 실행</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoStartGameWjmax ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                autoStartGameWjmax: !settingData.autoStartGameWjmax,
                autoStartGameDjmaxRespectV: false,
              })
            }}
            disabled={settingData.autoStartGameWjmaxPath == ''}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoStartGameWjmax ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          RACLA 데스크톱 앱 실행 시 WJMAX 를 자동으로 실행합니다. 해당 기능 WJMAX의 실행
          파일(WJMAX.exe)의 경로가 지정한 경우에만 작동합니다.
        </span>
      </div>

      <input
        ref={wjmaxFileInputRef}
        type='file'
        accept='.exe'
        onChange={onWjmaxFileChange}
        className='tw-hidden'
      />
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>WJMAX 실행 파일 경로</span>
        </div>
        <input
          className='tw-border tw-rounded-md tw-px-3 tw-py-1.5 tw-my-1 tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-mr-2'
          // onChange={(e) => handleSettingChange({ removeBlackPixelPx: Number(e.currentTarget.value) })}
          value={settingData.autoStartGameWjmaxPath}
          type='text'
          disabled
        />
        <button
          onClick={handleWjmaxFileSelect}
          className='tw-px-3 tw-py-2 tw-bg-blue-600 tw-text-sm tw-shadow-sm tw-rounded-md tw-w-20 tw-mt-1 tw-mb-1'
        >
          파일 선택
        </button>
        <span className='tw-text-sm tw-font-light tw-text-red-500'>{errorMessage}</span>
      </div>
    </div>
  )

  const appSection = (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>하드웨어 가속 활성화</span>
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
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          하드웨어 가속은 GPU를 사용하여 RACLA 데스크톱 앱이 더 부드럽게 동작하게 해줍니다. 앱의
          화면에 문제가 발생한다면 이 설정을 비활성화 해보시기 바랍니다. 설정을 변경하면 앱이 다시
          시작됩니다.
        </span>
        <span className='tw-text-sm tw-font-light tw-text-red-500'>
          해당 버전에서는 변경할 수 없는 설정값입니다.
        </span>
      </div>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>상단바 홈 버튼을 오른쪽으로 정렬</span>
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
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          뒤로가기와 새로고침 버튼을 홈 버튼보다 우선으로 배치되도록 설정합니다.
        </span>
      </div>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>저사양 모드(애니메이션 효과 비활성화)</span>
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
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          대부분의 애니메이션 효과를 비활성화 합니다. 사양이 낮은 기기에서 RACLA 데스크톱 앱을
          사용거나 게임 또는 다른 애플리케이션에 성능 집중시킬 경우 활성화 하는 것을 권장합니다.
        </span>
      </div>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>BGA 영상 표시</span>
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
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          기본적인 배경 BGA 영상과 BGA가 존재하는 곡의 이미지(자켓)에 마우스 커서를 올려둔 경우 해당
          곡의 BGA 영상을 표시합니다.
        </span>
      </div>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>자동 업데이트</span>
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
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          자동 업데이트 활성화 시 RACLA 데스크톱 앱을 실행할 때마다 업데이트를 확인합니다.
        </span>
      </div>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>언어</span>
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
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          RACLA 데스크톱 앱의 언어를 변경합니다. 일부 화면은 언어 데이터가 미존재 시 한국어 또는
          영어를 우선하여 표시합니다. 설정을 변경하면 앱이 다시 시작됩니다.
        </span>
        <select
          className='form-select tw-my-1 tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36'
          defaultValue='ko'
        >
          <option value='ko'>한국어(Korean)</option>
          <option value='en' disabled>
            영어(English)
          </option>
        </select>
        <span className='tw-text-sm tw-font-light tw-text-red-500'>
          해당 버전에서는 변경할 수 없는 설정값입니다.
        </span>
      </div>

      <div className='tw-mt-1'>
        <button
          className='tw-px-3 tw-py-2 tw-bg-gray-600 tw-text-sm tw-shadow-sm tw-rounded-md'
          type='button'
          onClick={() => {
            window.ipc.send('reload-app')
          }}
        >
          앱 재시작
        </button>
      </div>

      <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
        V-ARCHIVE, DJMAX(NEOWIZ), WJMAX(WJMAX STUDIO). We deeply respect you. {'<'}3<br />
        RACLA is dedicated to your remarkable games and services.
      </span>

      <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
        {globalDictionary.version}
      </span>
    </div>
  )

  const overlaySection = (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm tw-my-1'>오버레이</span>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          오버레이 옵션은 사이드바에 위치한 RACLA 탭의 오버레이 메뉴에서 확인하실 수 있습니다.
        </span>
      </div>
    </div>
  )

  const captureSection = (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>자동 캡쳐 모드(자동 성과 기록 등록)</span>
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
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          자동 캡쳐 모드는 RACLA 데스크톱 앱에서 지원하는 게임이 실행 중일 경우 주기적으로 캡쳐하여
          결과 창이 인식되는 경우 캡쳐 이미지를 분석하여 서버로 성과 기록을 갱신하는 기능입니다.
          활성화 시 다른 백그라운드 애플리케이션 또는 사용 환경, 사양 등에 따라 화면 끊어짐 등의
          이상 현상이 발생할 수 있습니다. 만약 화면 끊어짐 현상 등이 발생하는 경우 아래에 제공된
          부가 옵션을 환경에 맞춰 사용하는 것을 권장합니다. 개발자는 i5-9400F / RX 580 8GB 사양으로
          인게임 1920x1080 400FPS x8, 앱 설정 포커스 시에만 캡쳐 주기 1초 옵션으로 사용 중입니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <span className='tw-text-sm'>캡쳐 주기</span>
        <select
          className='form-select tw-my-1 tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36'
          onChange={(e) =>
            handleSettingChange({ autoCaptureIntervalTime: Number(e.currentTarget.value) })
          }
          value={String(settingData.autoCaptureIntervalTime)}
        >
          <option value='1000'>1초(상남자 옵션)</option>
          <option value='2000'>2초</option>
          <option value='3000'>3초(추천)</option>
          <option value='5000'>5초</option>
          <option value='10000'>10초</option>
        </select>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>게임 화면(창)이 포커스 된 경우에만 캡쳐</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.captureOnlyFocused ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() =>
              handleSettingChange({ captureOnlyFocused: !settingData.captureOnlyFocused })
            }
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.captureOnlyFocused ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          게임 화면 또는 해당 창이 포커스 된 경우에만 자동 캡쳐 모드를 진행합니다. 게임 플레이 중
          다른 애플리케이션 등의 활동 시 성능에 문제가 발생한다면 활성화 하는 것을 권장합니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>스마트 흑백 여백 제거</span>
          <button
            disabled
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoRemoveBlackPixel ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() =>
              handleSettingChange({ autoRemoveBlackPixel: !settingData.autoRemoveBlackPixel })
            }
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoRemoveBlackPixel ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          자동 캡쳐 모드에서 캡쳐 과정에서 생긴 이미지의 흑백 여백을 RACLA 데스크톱 앱에서 자동으로
          제거 후 재처리하여 서버로 전송합니다. 현재는 강제적으로 활성화 되어 있습니다.
        </span>
        <span className='tw-text-sm tw-font-light tw-text-red-500'>
          해당 버전에서는 변경할 수 없는 설정값입니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <span className='tw-text-sm'>흑백 여백 제거 크기(px)</span>
        <input
          className='tw-border tw-rounded-md tw-px-3 tw-py-1.5 tw-my-1 tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36'
          onChange={(e) =>
            handleSettingChange({ removeBlackPixelPx: Number(e.currentTarget.value) })
          }
          value={String(settingData.removeBlackPixelPx)}
          type='number'
          disabled
        />
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          스마트 흑백 여백 제거 기능이 올바르게 작동하지 않을 경우 수동으로 흑백 여백 제거 크기를
          설정합니다. 현재는 강제적으로 스마트 흑백 여백 제거 기능을 통해 수치를 조절하며 추후 여러
          환경 에서의 자동 캡쳐 모드의 성능 통계가 집계되어 안정화가 되었을 경우 해당 옵션이 잠금
          해제될 예정입니다.
        </span>
        <span className='tw-text-sm tw-font-light tw-text-red-500'>
          해당 버전에서는 변경할 수 없는 설정값입니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <span className='tw-text-sm'>캡쳐 API(Deprecated)</span>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          0.5.0 버전 이후로는 커스터마이징된 XCap API(https://github.com/nashaofu/xcap)를 고정하여
          사용합니다. 해당 설정은 더 이상 사용되지 않습니다. 추후 삭제될 예정입니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <span className='tw-text-sm'>텍스트 인식(OCR) API(Deprecated)</span>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          0.5.0 버전 이후로는 텍스트 인식을 클라이언트에서 처리하지 않으며 서버(RACLA Service
          API)에서만 처리합니다. 해당 설정은 더 이상 사용되지 않습니다. 추후 삭제될 예정입니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div>
          <button
            className='tw-px-3 tw-py-2 tw-bg-red-900 tw-text-sm tw-shadow-sm tw-rounded-md'
            type='button'
            onClick={() => {
              if (isDetectedGame) {
                window.ipc.send('captureTest')
                showNotification(
                  '화면 캡쳐가 요청 되었습니다. 결과 이미지는 사용자의 사진 폴더에 위치한 RACLA에서 확인할 수 있습니다.',
                  'tw-bg-lime-600',
                )
                setCaptureTestMessage(
                  '화면 캡쳐가 요청 되었습니다. 결과 이미지는 사용자의 사진 폴더에 위치한 RACLA에서 확인할 수 있습니다. 상하좌우로 1px을 초과하는 여백이 포함이 된 경우 자동 캡쳐 모드가 올바르게 동작하지 않을 수 있습니다.',
                )
              } else {
                showNotification('게임이 실행 중이지 않습니다.', 'tw-bg-red-600')
                setCaptureTestMessage(
                  '게임이 실행 중이지 않습니다. 게임(DJMAX RESPECT V)을 실행한 후 다시 시도해주세요.',
                )
              }
            }}
          >
            캡쳐 테스트
          </button>
        </div>

        <span className='tw-text-sm tw-font-light tw-text-gray-400'>{captureTestMessage}</span>
      </div>
    </div>
  )

  const djmaxSection = (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>자동 캡쳐 영역 - 프리스타일 결과창</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoCaptureOcrResultRegion ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                autoCaptureOcrResultRegion: !settingData.autoCaptureOcrResultRegion,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoCaptureOcrResultRegion ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          자동 캡쳐 모드 사용 시 프리스타일 결과창을 인식 여부를 설정합니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>자동 캡쳐 영역 - 래더/버서스 결과창</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoCaptureOcrVersusRegion ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                autoCaptureOcrVersusRegion: !settingData.autoCaptureOcrVersusRegion,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoCaptureOcrVersusRegion ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          자동 캡쳐 모드 사용 시 래더/버서스 결과창을 인식 여부를 설정합니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>자동 캡쳐 영역 - 오픈 매치(2인 이하)</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoCaptureOcrOpen2Region ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                autoCaptureOcrOpen2Region: !settingData.autoCaptureOcrOpen2Region,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoCaptureOcrOpen2Region ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          자동 캡쳐 모드 사용 시 오픈 매치(2명) 결과창을 인식 여부를 설정합니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>자동 캡쳐 영역 - 오픈 매치(1명 또는 3명 이상)</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoCaptureOcrOpen3Region ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                autoCaptureOcrOpen3Region: !settingData.autoCaptureOcrOpen3Region,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoCaptureOcrOpen3Region ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          자동 캡쳐 모드 사용 시 오픈 매치(1명 또는 3명 이상) 결과창을 인식 여부를 설정합니다.
        </span>
      </div>
    </div>
  )

  const wjmaxSection = (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>자동 캡쳐 영역 - 프리스타일 결과창</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.autoCaptureWjmaxOcrResultRegion ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                autoCaptureWjmaxOcrResultRegion: !settingData.autoCaptureWjmaxOcrResultRegion,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.autoCaptureWjmaxOcrResultRegion ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          자동 캡쳐 모드 사용 시 프리스타일 결과창을 인식 여부를 설정합니다.
        </span>
      </div>
    </div>
  )

  const dataSection = (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>캡쳐 시 이미지 저장</span>
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
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          수동 캡쳐 또는 자동 캡쳐 모드에서 캡처한 이미지를 사용자 계정 경로의 사진 폴더 내에
          RACLA에 저장합니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>이미지 저장 시 블러 효과</span>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
          이미지 저장 시 블러 효과 또는 검은색 마스킹 효과를 적용합니다.
        </span>
        <select
          className='form-select tw-my-1 tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36'
          defaultValue={settingData.saveImageBlurMode}
          onChange={(e) => {
            handleSettingChange({ saveImageBlurMode: e.currentTarget.value })
          }}
        >
          <option value='blur'>블러 효과</option>
          <option value='black'>검은색 마스킹</option>
        </select>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>이미지 저장 시 모든 프로필 포함</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.saveImageWithAllProfileWhenCapture ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                saveImageWithAllProfileWhenCapture: !settingData.saveImageWithAllProfileWhenCapture,
                saveImageWithoutOtherProfileWhenCapture: false,
                saveImageWithoutAllProfileWhenCapture: false,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.saveImageWithAllProfileWhenCapture ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          이미지 저장 시 모든 프로필을 포함하여 저장합니다. 모든 프로필을 포함하여 저장하는 경우
          프로필 영역에 블러 효과가 적용되지 않습니다. 단 채팅 창 영역은 예외로 적용됩니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>이미지 저장 시 내 프로필만 포함</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.saveImageWithoutOtherProfileWhenCapture
                ? 'tw-bg-blue-600'
                : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                saveImageWithoutOtherProfileWhenCapture:
                  !settingData.saveImageWithoutOtherProfileWhenCapture,
                saveImageWithAllProfileWhenCapture: false,
                saveImageWithoutAllProfileWhenCapture: false,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.saveImageWithoutOtherProfileWhenCapture ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          이미지 저장 시 내 프로필만 포함하여 저장합니다. 다른 사용자의 프로필 영역에 블러 효과가
          적용됩니다.
        </span>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-1'>
        <div className='tw-flex tw-items-center'>
          <span className='tw-text-sm'>이미지 저장 시 모든 프로필 제외</span>
          <button
            className={`tw-scale-50 tw-relative tw-inline-flex tw-items-center tw-h-8 tw-w-16 tw-rounded-full tw-transition-colors tw-duration-300 ${
              settingData.saveImageWithoutAllProfileWhenCapture
                ? 'tw-bg-blue-600'
                : 'tw-bg-gray-600'
            }`}
            onClick={() => {
              handleSettingChange({
                saveImageWithoutAllProfileWhenCapture:
                  !settingData.saveImageWithoutAllProfileWhenCapture,
                saveImageWithAllProfileWhenCapture: false,
                saveImageWithoutOtherProfileWhenCapture: false,
              })
            }}
          >
            <span
              className={`tw-inline-block tw-h-6 tw-w-6 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                settingData.saveImageWithoutAllProfileWhenCapture ? 'tw-right-1' : 'tw-left-1'
              }`}
            />
          </button>
        </div>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          이미지 저장 시 모든 프로필을 제외하여 저장합니다. 모든 프로필 영역에 블러 효과가
          적용됩니다.
        </span>
      </div>
    </div>
  )

  const shortcutSection = (
    <div className='tw-flex tw-flex-col tw-gap-3'>
      <div className='tw-flex tw-flex-col tw-gap-1'>
        <span className='tw-text-sm'>수동 캡쳐(업로드) 단축키</span>
        <input
          className='tw-border tw-rounded-md tw-px-3 tw-py-1.5 tw-my-1 tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-gray-300 tw-w-36'
          // onChange={(e) => handleSettingChange({ removeBlackPixelPx: Number(e.currentTarget.value) })}
          value={'Ctrl + Alt + Insert'}
          type='text'
          disabled
        />
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          수동 캡쳐(업로드) 단축키를 설정합니다. 리절트(결과) 창에서만 사용할 수 있습니다. Ctrl +
          Alt + Insert 키가 먼저 예약되어 있는 다른 애플리케이션 또는 프로그램과 동시 사용 시
          정상적으로 동작하지 않습니다.
        </span>
        <span className='tw-text-sm tw-font-light tw-text-red-500'>
          해당 버전에서는 변경할 수 없는 설정값입니다. 현재 Ctrl + Alt + Insert 키로만 사용할 수
          있습니다.
        </span>
      </div>
    </div>
  )

  const accountSection = userData.userNo && userData.userToken && (
    <div className='tw-flex tw-flex-col tw-gap-6'>
      {/* <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-lg tw-font-bold">내 계정</span>
      </div> */}
      <div className='tw-flex tw-flex-col tw-gap-2'>
        <input
          ref={vArchiveFileInputRef}
          type='file'
          accept='.txt'
          onChange={onVArchiveFileChange}
          className='tw-hidden'
        />
        <span className='tw-text-sm'>RACLA 계정 정보</span>
        <span className='tw-text-sm tw-font-light tw-text-gray-400'>
          계정 번호 :{' '}
          <span className='tw-blur-sm hover:tw-blur-none tw-transition-all tw-duration-300'>
            {userData.userNo}
          </span>
          <br />
          계정 토큰 :{' '}
          <span className='tw-blur-sm hover:tw-blur-none tw-transition-all tw-duration-300'>
            {userData.userToken}
          </span>
        </span>
        <span className='tw-text-sm tw-font-light tw-text-red-500 tw-break-keep'>
          노출되는 정보는 RACLA에서 로그인 데이터로 사용되는 계정 번호와 계정 토큰입니다. 계정
          번호와 계정 토큰은 외부에 노출되지 않도록 주의해주세요.
        </span>
      </div>
      <div className='tw-flex tw-flex-col tw-gap-2'>
        <span className='tw-text-sm'>V-ARCHIVE 계정 정보</span>
        {vArchiveUserData.userNo && vArchiveUserData.userToken ? (
          <>
            <span className='tw-text-sm tw-font-light tw-text-gray-400'>
              계정 번호 :{' '}
              <span className='tw-blur-sm hover:tw-blur-none tw-transition-all tw-duration-300'>
                {vArchiveUserData.userNo}
              </span>
              <br />
              계정 토큰 :{' '}
              <span className='tw-blur-sm hover:tw-blur-none tw-transition-all tw-duration-300'>
                {vArchiveUserData.userToken}
              </span>
            </span>
            <span className='tw-text-sm tw-font-light tw-text-red-500 tw-break-keep'>
              노출되는 정보는 V-ARCHIVE에서 로그인 데이터로 사용되는 계정 번호(userNo)와 계정
              토큰(token)입니다. 계정 번호와 계정 토큰은 외부에 노출되지 않도록 주의해주세요.
            </span>
          </>
        ) : (
          <>
            <button
              onClick={handleVArchiveFileSelect}
              className='tw-px-3 tw-py-2 tw-bg-blue-600 tw-text-sm tw-shadow-sm tw-rounded-md tw-w-48 tw-mt-1'
            >
              V-ARCHIVE 계정 연동하기
            </button>
            <span className='tw-text-sm tw-font-light tw-text-gray-400 tw-break-keep'>
              V-ARCHIVE 계정 연동이 되어 있지 않습니다. DJMAX RESPECT V 서비스를 이용하시려면
              연동하기 버튼을 눌러 V-ARCHIVE 공식 클라이언트에서 생성한 로그인 데이터(account.txt)를
              첨부하여 연동을 진행해주세요.
            </span>
            <span className='tw-text-sm tw-font-light tw-text-red-500 tw-break-keep'>
              {errorMessage}
            </span>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div
      className={`tw-fixed tw-inset-0 tw-z-[9999] tw-transition-opacity tw-duration-300 ${
        isSetting ? 'tw-opacity-100 tw-pointer-events-auto' : 'tw-opacity-0 tw-pointer-events-none'
      }`}
    >
      <div
        className='tw-fixed tw-inset-0 tw-bg-gray-950 tw-bg-opacity-90'
        onClick={handleBackdropClick}
      />
      <div className='tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center'>
        <div
          className={`tw-flex tw-flex-col tw-h-5/6 tw-w-4/6 tw-bg-gray-900 tw-rounded-md tw-overflow-hidden tw-transition-all tw-duration-300 ${isSetting ? 'tw-opacity-100 tw-translate-y-0' : 'tw-opacity-0 tw-translate-y-4'}`}
        >
          <div className='tw-flex tw-items-center tw-border-b tw-border-gray-700 tw-pb-4 tw-pt-5 tw-px-6'>
            <span className='tw-flex tw-gap-2 tw-items-center tw-text-lg tw-font-bold me-auto'>
              <FaGear />
              설정
            </span>
            <button
              className='tw-text-xl'
              type='button'
              onClick={() => {
                dispatch(setIsSetting(false))
              }}
            >
              <FiX />
            </button>
          </div>
          <div className='tw-flex tw-h-full'>
            <div className='tw-w-56 tw-flex tw-flex-col tw-gap-2 tw-border-r tw-border-gray-700 tw-p-4'>
              {userData.userNo && userData.userToken && (
                <button
                  className={`tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${category === 'account' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'}`}
                  onClick={() => {
                    setCategory('account')
                    setErrorMessage('')
                  }}
                >
                  내 계정
                </button>
              )}
              <button
                className={`tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${category === 'app' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'}`}
                onClick={() => {
                  setCategory('app')
                  setErrorMessage('')
                }}
              >
                앱
              </button>
              <button
                className={`tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${category === 'data' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'}`}
                onClick={() => {
                  setCategory('data')
                  setErrorMessage('')
                }}
              >
                저장 공간
              </button>
              <button
                className={`tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${category === 'game' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'}`}
                onClick={() => {
                  setCategory('game')
                  setErrorMessage('')
                }}
              >
                게임
              </button>
              <button
                className={`tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${category === 'shortcut' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'}`}
                onClick={() => {
                  setCategory('shortcut')
                  setErrorMessage('')
                }}
              >
                단축키
              </button>
              <button
                className={`tw-flex tw-justify-between tw-items-center tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${
                  category === 'overlay' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'
                }`}
                onClick={() => {
                  setCategory('overlay')
                  setErrorMessage('')
                }}
              >
                <span>오버레이</span>
                {/* <span className="tw-text-sm tw-bg-blue-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                  베타
                </span> */}
              </button>
              <hr className='tw-border-1 tw-border-gray-400 tw-my-2' />
              <button
                className={`tw-flex tw-justify-between tw-items-center tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${
                  category === 'capture' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'
                }`}
                onClick={() => {
                  setCategory('capture')
                  setErrorMessage('')
                }}
              >
                <span>자동 캡쳐 모드</span>
                {/* <span className="tw-text-xs tw-bg-blue-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                  베타
                </span> */}
              </button>
              <button
                className={`tw-flex tw-justify-between tw-items-center tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${
                  category === 'djmax_respect_v' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'
                }`}
                onClick={() => {
                  setCategory('djmax_respect_v')
                  setErrorMessage('')
                }}
              >
                <span>DJMAX RESPECT V</span>
              </button>
              <button
                className={`tw-flex tw-justify-between tw-items-center tw-text-left tw-px-3 tw-py-2 tw-rounded-md tw-text-sm ${
                  category === 'wjmax' ? 'tw-bg-gray-700' : 'hover:tw-bg-gray-800'
                }`}
                onClick={() => {
                  setCategory('wjmax')
                  setErrorMessage('')
                }}
              >
                <span>WJMAX</span>
              </button>
            </div>
            <div className='tw-flex tw-flex-1 tw-flex-col tw-py-4 tw-pl-2 tw-pr-4 tw-break-keep'>
              <div className='tw-flex tw-gap-3 tw-flex-col tw-overflow-y-auto tw-scroll-smooth tw-pl-3 tw-flex-1 tw-pb-16'>
                {category === 'app'
                  ? appSection
                  : category === 'overlay'
                    ? overlaySection
                    : category === 'capture'
                      ? captureSection
                      : category === 'djmax_respect_v'
                        ? djmaxSection
                        : category === 'wjmax'
                          ? wjmaxSection
                          : category === 'shortcut'
                            ? shortcutSection
                            : category === 'game'
                              ? gameSection
                              : category === 'account'
                                ? accountSection
                                : dataSection}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingComponent
