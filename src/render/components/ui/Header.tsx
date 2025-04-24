import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { RootState } from '@render/store'
import { toggleTheme } from '@render/store/slices/uiSlice'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Tooltip from './Tooltip'

const { closeApp, minimizeApp, maximizeApp } = window.electron

const TitleBar: React.FC = () => {
  const { theme } = useSelector((state: RootState) => state.ui)
  const { selectedGame } = useSelector((state: RootState) => state.app)
  const dispatch = useDispatch()
  const [isMaximized, setIsMaximized] = useState(false)
  const { t } = useTranslation()

  // 최대화 상태 이벤트 리스너 (실제로는 preload 파일에서 이벤트를 전달해야 함)
  useEffect(() => {
    const handleMaximizeChange = (e: any, maximized: boolean) => {
      setIsMaximized(maximized)
    }

    // 이 부분은 실제로 preload에서 구현해야 합니다
    window.addEventListener('maximize-change', handleMaximizeChange as any)

    return () => {
      window.removeEventListener('maximize-change', handleMaximizeChange as any)
    }
  }, [])

  const handleToggleTheme = () => {
    dispatch(toggleTheme())
  }

  const handleMaximizeToggle = () => {
    maximizeApp()
    setIsMaximized(!isMaximized) // 실제로는 이벤트를 통해 설정해야 합니다
  }

  return (
    <div
      className={`tw:h-10 tw:flex tw:items-center tw:justify-between tw:px-4 tw:select-none tw:w-full tw:z-50 tw:relative webkit-app-region-drag ${
        theme === 'dark'
          ? 'tw:bg-transparent tw:text-slate-200'
          : 'tw:bg-transparent tw:text-gray-800'
      }`}
    >
      {/* 하단 그라데이션 효과 제거 */}

      {/* 왼쪽 영역 - 비워둠 */}
      <div className='tw:w-32'></div>

      {/* 중앙 타이틀 - 선택된 게임 이름 표시 */}
      <div className='tw:flex-1 tw:text-sm tw:text-center tw:font-bold'>
        {globalDictionary.gameDictionary[selectedGame].name}
      </div>

      {/* 오른쪽 컨트롤 버튼 영역 */}
      <div className='tw:w-32 tw:flex tw:items-center tw:justify-end tw:space-x-2 webkit-app-region-no-drag'>
        <Tooltip
          position='bottom'
          content={theme === 'dark' ? t('theme.changeLight') : t('theme.changeDark')}
        >
          <button
            onClick={handleToggleTheme}
            className={`tw:p-1.5 tw:rounded-full tw:transition-all ${
              theme === 'dark'
                ? 'tw:hover:bg-slate-800 tw:text-slate-300'
                : 'tw:hover:bg-white tw:text-gray-600 tw:hover:shadow-sm'
            }`}
          >
            <Icon icon={theme === 'dark' ? 'lucide:sun' : 'lucide:moon'} width='16' height='16' />
          </button>
        </Tooltip>

        <Tooltip position='bottom' content={t('ui.minimize')}>
          <button
            onClick={() => minimizeApp()}
            className={`tw:p-1.5 tw:rounded tw:transition-all ${
              theme === 'dark'
                ? 'tw:hover:bg-slate-800 tw:text-slate-300'
                : 'tw:hover:bg-white tw:text-gray-600 tw:hover:shadow-sm'
            }`}
          >
            <Icon icon='lucide:minus' width='16' height='16' />
          </button>
        </Tooltip>

        <Tooltip position='bottom' content={isMaximized ? t('ui.restore') : t('ui.maximize')}>
          <button
            onClick={handleMaximizeToggle}
            className={`tw:p-1.5 tw:rounded tw:transition-all ${
              theme === 'dark'
                ? 'tw:hover:bg-slate-800 tw:text-slate-300'
                : 'tw:hover:bg-white tw:text-gray-600 tw:hover:shadow-sm'
            }`}
          >
            <Icon
              icon={isMaximized ? 'lucide:minimize-2' : 'lucide:maximize-2'}
              width='16'
              height='16'
            />
          </button>
        </Tooltip>

        <Tooltip position='bottom' content={t('ui.close')}>
          <button
            onClick={() => closeApp()}
            className='tw:p-1.5 tw:rounded tw:text-red-500 tw:hover:bg-red-500 tw:hover:text-white tw:transition-all'
          >
            <Icon icon='lucide:x' width='16' height='16' />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

export default TitleBar
