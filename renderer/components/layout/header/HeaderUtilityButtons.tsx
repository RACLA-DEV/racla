import { FiMaximize, FiMinimize, FiMinus, FiX } from 'react-icons/fi'
// renderUtilityButtons.tsx
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

import { useSelector } from 'react-redux'
import { RootState } from 'store'

export const renderUtilityButtons = (ipcRenderer, isMaximized, setIsMaximized) => {
  const settingData = useSelector((state: RootState) => state.app.settingData)

  return (
    <div className='tw-flex tw-justify-center tw-items-center tw-gap-1 tw-h-8 tw-pr-1'>
      <OverlayTrigger
        placement='bottom'
        overlay={
          <Tooltip id='btn-select-game-respect-v' className='tw-text-xs'>
            창 최소화
          </Tooltip>
        }
      >
        <button
          type='button'
          onClick={() => {
            ipcRenderer.send('minimizeApp')
          }}
          className='btn-ipc tw-text-md'
        >
          <FiMinus />
        </button>
      </OverlayTrigger>
      <OverlayTrigger
        placement='bottom'
        overlay={
          <Tooltip id='btn-select-game-respect-v' className='tw-text-xs'>
            {!isMaximized ? '창 크기 최대화' : '창 크기 원래대로 되돌리기'}
          </Tooltip>
        }
      >
        <button
          type='button'
          onClick={() => {
            ipcRenderer.send('maximizeApp')
          }}
          className='btn-ipc tw-text-xs'
        >
          {!isMaximized ? <FiMaximize /> : <FiMinimize />}
        </button>
      </OverlayTrigger>
      <OverlayTrigger
        placement='bottom'
        overlay={
          <Tooltip id='btn-select-game-respect-v' className='tw-text-xs'>
            창 닫기
          </Tooltip>
        }
      >
        <button
          type='button'
          onClick={() => {
            if (settingData.closeToTray) {
              ipcRenderer.send('hideToTray')
            } else {
              ipcRenderer.send('closeApp')
            }
          }}
          className='btn-ipc tw-text-md'
        >
          <FiX />
        </button>
      </OverlayTrigger>
    </div>
  )
}
