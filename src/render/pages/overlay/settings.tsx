import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { RootState } from '@render/store'
import { setSettingData } from '@render/store/slices/appSlice'
import { SettingsData } from '@src/types/settings/SettingData'
import { useTranslation } from 'react-i18next'

// 이미지 키 상수 정의
const IMAGE_KEYS = {
  DEFAULT: 'RESULT_OVERLAY_EXAMPLE',
  UPLOAD: 'RESULT_OVERLAY_EXAMPLE_UPLOAD',
  RECENT: 'RESULT_OVERLAY_EXAMPLE_RECENT',
  HARD_JUDGEMENT_PLAY_RECORD: 'RESULT_OVERLAY_EXAMPLE_HJA',
}

const OverlaySettingsPage = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation(['overlay'])
  const { settingData } = useSelector((state: RootState) => state.app)
  const [activeImage, setActiveImage] = useState<string>(IMAGE_KEYS.DEFAULT)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const { language } = useSelector((state: RootState) => state.app.settingData)
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set([IMAGE_KEYS.DEFAULT]))
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 컴포넌트 마운트 시 모든 이미지 프리로드
  useEffect(() => {
    const imageKeys = Object.values(IMAGE_KEYS)

    // 이미지 프리로딩 함수
    const preloadImages = async () => {
      const newPreloadedImages = new Set(preloadedImages)

      for (const key of imageKeys) {
        if (!newPreloadedImages.has(key)) {
          const img = document.createElement('img')
          img.src = getImageUrl(key)
          await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve // 에러 발생해도 계속 진행
          })
          newPreloadedImages.add(key)
        }
      }

      setPreloadedImages(newPreloadedImages)
    }

    void preloadImages()

    // 컴포넌트 언마운트 시 타임아웃 정리
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleSettingChange = (id: string, value: string | number | boolean) => {
    const updatedSettings = (prev: SettingsData) => {
      // Record를 사용해 타입 정의
      const newSettings = { ...prev } as SettingsData & Record<string, string | number | boolean>

      // 상호 배타적인 설정 처리 (예: 알림음)
      if (id.endsWith('Sound') && value === true) {
        const offItems = Object.keys(globalDictionary.settingDictionary).filter(
          (key) => key.endsWith('Sound') && key !== id,
        )

        // 안전하게 할당
        offItems.forEach((offItem) => {
          if (offItem && typeof offItem === 'string' && offItem in newSettings) {
            newSettings[offItem] = false
          }
        })
      }

      // 설정 항목의 offList 속성 처리
      if (value === true && globalDictionary.settingDictionary[id]?.offList) {
        const offList = globalDictionary.settingDictionary[id].offList || []

        // offList에 포함된 모든 항목을 false로 설정
        offList.forEach((offItem) => {
          if (offItem && typeof offItem === 'string' && offItem in newSettings) {
            newSettings[offItem] = false
          }
        })
      }

      // 설정 항목의 onList 속성 처리
      if (value === true && globalDictionary.settingDictionary[id]?.onList) {
        const onList = globalDictionary.settingDictionary[id].onList || []

        // onList에 포함된 모든 항목을 true로 설정
        onList.forEach((onItem) => {
          if (onItem && typeof onItem === 'string' && onItem in newSettings) {
            newSettings[onItem] = true
          }
        })
      }

      // 안전하게 설정 할당
      if (id && typeof id === 'string' && id in newSettings) {
        newSettings[id] = value
      }

      return newSettings as SettingsData
    }

    // Redux 상태 업데이트
    const newSettings = updatedSettings(settingData)
    dispatch(setSettingData(newSettings))

    // electron을 통해 설정 저장
    if (window.electron?.saveSettings) {
      window.electron.saveSettings(newSettings)
    }

    // enableOverlayWindow 설정이 변경되면 오버레이 윈도우 생성/제거
    if (id === 'enableOverlayWindow') {
      // 약간의 지연 후 오버레이 윈도우 생성/제거
      setTimeout(() => {
        if (value === true) {
          window.electron?.createOverlayInit()
        } else {
          window.electron?.closeOverlay()
        }
      }, 500) // 500ms 지연
    }
  }

  // 설정 항목 버튼을 호버할 때 이미지를 변경하는 함수
  const handleImageChange = (imageKey: string) => {
    if (activeImage !== imageKey && !isTransitioning) {
      setIsTransitioning(true)

      // 이전 타임아웃이 있으면 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 새 타임아웃 설정 및 저장
      timeoutRef.current = setTimeout(() => {
        setActiveImage(imageKey)
        setIsTransitioning(false)
        timeoutRef.current = null
      }, 200)
    }
  }

  // 이미지 URL 가져오기
  const getImageUrl = (imageKey: string) => {
    return `https://cdn.racla.app/project_ra/${imageKey}.png`
  }

  // 카드 설정 항목 컴포넌트
  const OverlaySettingCard = ({
    title,
    description,
    settingKey,
    value,
    icon,
    imageKey,
  }: {
    title: string
    description: string
    settingKey: string
    value: boolean
    icon: string
    imageKey: string
  }) => (
    <div
      className='tw:flex-1 tw:flex tw:flex-col tw:gap-3 tw:bg-white tw:dark:bg-slate-800 tw:border tw:border-slate-200 tw:dark:border-slate-700 tw:rounded-lg tw:p-4 tw:shadow-sm hover:tw:shadow-md tw:transition-all'
      onMouseEnter={() => {
        handleImageChange(imageKey)
      }}
      onMouseLeave={() => {
        handleImageChange(IMAGE_KEYS.DEFAULT)
      }}
    >
      <div className='tw:flex tw:flex-col tw:gap-2'>
        <div className='tw:flex tw:items-center tw:justify-between'>
          <div className='tw:flex tw:items-center tw:gap-2'>
            <Icon
              icon={icon}
              className='tw:w-5 tw:h-5 tw:text-indigo-600 tw:dark:text-indigo-400'
            />
            <span className='tw:text-base tw:font-medium tw:text-slate-800 tw:dark:text-slate-200'>
              {title}
            </span>
          </div>
          <button
            className={`tw:relative tw:inline-flex tw:items-center tw:h-5 tw:w-10 tw:rounded-full tw:transition-colors tw:duration-300 ${
              value ? 'tw:bg-indigo-600' : 'tw:bg-slate-300 tw:dark:bg-slate-700'
            }`}
            onClick={() => {
              handleSettingChange(settingKey, !value)
            }}
          >
            <span
              className={`tw:inline-block tw:h-4 tw:w-4 tw:bg-white tw:rounded-full tw:shadow tw:transform tw:transition-all tw:duration-300 tw:m-0.5 ${
                value ? 'tw:translate-x-5' : 'tw:translate-x-0'
              }`}
            />
          </button>
        </div>
        <span
          className={`tw:text-sm tw:font-normal tw:text-slate-600 tw:dark:text-slate-400 ${
            language !== 'ja_JP' ? 'tw:break-keep' : ''
          } tw:mb-2`}
        >
          {description}
        </span>
      </div>
    </div>
  )

  return (
    <>
      <div id='ContentHeader' />
      <div className='tw:flex tw:gap-4 tw:text-sm tw:text-slate-600 tw:dark:text-slate-400'>
        <div className='tw:flex tw:flex-col tw:gap-4 tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:shadow-md tw:p-6 tw:mb-4 tw:flex-1 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
          <div className='tw:flex tw:w-full tw:items-end tw:justify-between'>
            <div className='tw:flex tw:items-center tw:gap-2'>
              <Icon
                icon='lucide:layers'
                className='tw:w-6 tw:h-6 tw:text-indigo-600 tw:dark:text-indigo-400'
              />
              <span className='tw:text-xl tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                {t('overlaySettings')}
              </span>
            </div>
          </div>

          <div className='tw:bg-slate-50 tw:dark:bg-slate-700/30 tw:p-4 tw:rounded-md tw:border tw:border-slate-200 tw:dark:border-slate-600'>
            <p className='tw:leading-relaxed tw:text-slate-700 tw:dark:text-slate-300'>
              {t('overlaySettingsDescription')}
            </p>
          </div>

          <div className='tw:flex tw:justify-end tw:gap-2 tw:items-start tw:text-xs tw:font-semibold'>
            <Icon icon='lucide:info' className='tw:mt-0.5 tw:text-indigo-500' />
            <div className='tw:flex tw:flex-col tw:gap-1 tw:text-slate-600 tw:dark:text-slate-400'>
              <span>{t('overlaySettingsFuture')}</span>
            </div>
          </div>
        </div>
      </div>
      <div className='tw:flex tw:gap-6'>
        <div className='tw:flex tw:flex-col tw:gap-4 tw:flex-1'>
          <OverlaySettingCard
            title={t('enableOverlayWindow')}
            description={t('enableOverlayWindowDescription')}
            settingKey='enableOverlayWindow'
            value={settingData.enableOverlayWindow || false}
            icon='lucide:monitor'
            imageKey={IMAGE_KEYS.DEFAULT}
          />

          <OverlaySettingCard
            title={t('resultOverlay')}
            description={t('resultOverlayDescription')}
            settingKey='resultOverlay'
            value={settingData.resultOverlay}
            icon='lucide:layout-dashboard'
            imageKey={IMAGE_KEYS.UPLOAD}
          />

          <OverlaySettingCard
            title={t('recentOverlay')}
            description={t('recentOverlayDescription')}
            settingKey='recentOverlay'
            value={settingData.recentOverlay}
            icon='lucide:clock'
            imageKey={IMAGE_KEYS.RECENT}
          />

          <OverlaySettingCard
            title={t('hardJudgementPlayRecordOverlay')}
            description={t('hardJudgementPlayRecordOverlayDescription')}
            settingKey='hardJudgementPlayRecordOverlay'
            value={settingData.hardJudgementPlayRecordOverlay}
            icon='lucide:history'
            imageKey={IMAGE_KEYS.HARD_JUDGEMENT_PLAY_RECORD}
          />
        </div>

        <div className='tw:relative tw:flex tw:flex-col tw:gap-1 tw:justify-center tw:items-center tw:bg-white tw:dark:bg-slate-800 tw:border tw:border-slate-200 tw:dark:border-slate-700 tw:rounded-lg tw:p-4 tw:shadow-md'>
          <div className='tw:sticky tw:top-4'>
            <div className='tw:min-w-[512px] tw:w-[512px] tw:max-w-[512px] tw:min-h-[384px] tw:h-[384px] tw:max-h-[384px] tw:bg-slate-900 tw:rounded-lg tw:shadow-inner tw:overflow-hidden'>
              <div
                className={`tw:relative tw:w-full tw:h-full tw:rounded-lg ${isTransitioning ? 'tw:opacity-50' : 'tw:opacity-100'} tw:transition-opacity tw:duration-200`}
              >
                {Array.from(preloadedImages).map((key) => (
                  <img
                    key={key}
                    src={getImageUrl(key)}
                    alt='overlay-preview'
                    className={`tw:rounded-lg tw:absolute tw:inset-0 tw:transition-opacity tw:duration-300 ${
                      activeImage === key ? 'tw:opacity-100' : 'tw:opacity-0'
                    }`}
                    style={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className='tw:mt-3 tw:flex tw:justify-center tw:gap-2'>
              <button
                className={`tw:p-2 tw:rounded-md tw:transition-all ${activeImage === IMAGE_KEYS.DEFAULT ? 'tw:bg-indigo-600 tw:text-white' : 'tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-600 tw:dark:text-slate-300'}`}
                onClick={() => {
                  handleImageChange(IMAGE_KEYS.DEFAULT)
                }}
              >
                <Icon icon='lucide:layout-dashboard' className='tw:w-5 tw:h-5' />
              </button>
              <button
                className={`tw:p-2 tw:rounded-md tw:transition-all ${activeImage === IMAGE_KEYS.UPLOAD ? 'tw:bg-indigo-600 tw:text-white' : 'tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-600 tw:dark:text-slate-300'}`}
                onClick={() => {
                  handleImageChange(IMAGE_KEYS.UPLOAD)
                }}
              >
                <Icon icon='lucide:upload' className='tw:w-5 tw:h-5' />
              </button>
              <button
                className={`tw:p-2 tw:rounded-md tw:transition-all ${activeImage === IMAGE_KEYS.RECENT ? 'tw:bg-indigo-600 tw:text-white' : 'tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-600 tw:dark:text-slate-300'}`}
                onClick={() => {
                  handleImageChange(IMAGE_KEYS.RECENT)
                }}
              >
                <Icon icon='lucide:clock' className='tw:w-5 tw:h-5' />
              </button>
              <button
                className={`tw:p-2 tw:rounded-md tw:transition-all ${activeImage === IMAGE_KEYS.HARD_JUDGEMENT_PLAY_RECORD ? 'tw:bg-indigo-600 tw:text-white' : 'tw:bg-slate-100 tw:dark:bg-slate-700 tw:text-slate-600 tw:dark:text-slate-300'}`}
                onClick={() => {
                  handleImageChange(IMAGE_KEYS.HARD_JUDGEMENT_PLAY_RECORD)
                }}
              >
                <Icon icon='lucide:history' className='tw:w-5 tw:h-5' />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div id='ContentFooter' />
    </>
  )
}

export default OverlaySettingsPage
