import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { setIsOpenExternalLink, setOpenExternalLink } from '@render/store/slices/uiSlice'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import apiClient from '../../../libs/apiClient'
import Tooltip from './Tooltip'

const Footer: React.FC = () => {
  const { selectedGame, isTrackMaker } = useSelector((state: RootState) => state.app)
  const [ServerStatusResponse, setServerStatusResponse] = useState<String>('')
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const dispatch = useDispatch()
  const { t } = useTranslation(['menu'])

  useEffect(() => {
    // 서버 상태 확인 함수
    const checkServerStatusResponse = async () => {
      try {
        createLog('info', 'Checking server status...', `/v3/racla/ping`) // 디버깅용 로그
        const response = await apiClient.get<String>(`/v3/racla/ping`, {
          timeout: 5000, // 5초 타임아웃 설정
        })

        if (response.status === 200) {
          createLog('debug', 'Server response:', response.data) // 디버깅용 로그
          setServerStatusResponse(response.data.data)
          setIsOnline(true)
        } else {
          createLog('debug', 'Server error status:', response.status) // 디버깅용 로그
          setIsOnline(false)
        }
      } catch (error) {
        createLog('error', 'Server connection error:', error.message) // 디버깅용 로그
        setIsOnline(false)
      }
    }

    // 초기 실행
    void checkServerStatusResponse()

    // 30초마다 실행되는 인터벌 설정
    const interval = setInterval(() => {
      createLog('debug', 'Running interval check...') // 디버깅용 로그
      void checkServerStatusResponse()
    }, 30000)

    // 클린업 함수
    return () => {
      createLog('debug', 'Cleaning up interval') // 디버깅용 로그
      clearInterval(interval)
    }
  }, []) // 빈 의존성 배열 - 컴포넌트 마운트 시 한 번만 실행

  const handleOpenExternalLink = (url: string) => {
    if (url) {
      // 외부 링크는 requestOpenExternalLink 사용하여 모달 확인 과정 거치도록 변경
      dispatch(setOpenExternalLink(url))
      dispatch(setIsOpenExternalLink(true))
    }
  }

  const renderGameSpecificContent = () => {
    if (isTrackMaker) {
      return <></>
    } else {
      switch (selectedGame) {
        case 'djmax_respect_v':
          return (
            <>
              <div>
                <Tooltip position='top' content='https://store.steampowered.com/app/960170'>
                  <span
                    className='tw:cursor-pointer'
                    onClick={() => {
                      handleOpenExternalLink('https://store.steampowered.com/app/960170')
                    }}
                  >
                    Resources from DJMAX RESPECT V
                  </span>
                </Tooltip>
                <Tooltip position='top' content='https://www.neowiz.com/'>
                  <span
                    className='tw:cursor-pointer'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenExternalLink('https://www.neowiz.com/')
                    }}
                  >
                    (©NEOWIZ)
                  </span>
                </Tooltip>
              </div>
              <span> · </span>
            </>
          )
        case 'wjmax':
          return (
            <>
              <Tooltip position='top' content='https://waktaverse.games/gameDetail/wjmax'>
                <span
                  className='tw:cursor-pointer'
                  onClick={() => {
                    handleOpenExternalLink('https://waktaverse.games/gameDetail/wjmax')
                  }}
                >
                  Resources from WJMAX(©WJMAX STUDIO)
                </span>
              </Tooltip>
              <span> · </span>
            </>
          )
        case 'platina_lab':
          return (
            <>
              <Tooltip position='top' content='https://platinalab.net/'>
                <span
                  className='tw:cursor-pointer'
                  onClick={() => {
                    handleOpenExternalLink('https://platinalab.net/')
                  }}
                >
                  PLATiNA :: LAB(HIGH-END Games)
                </span>
              </Tooltip>
              <span> · </span>
            </>
          )
        default:
          return null
      }
    }
  }

  return (
    <div
      className={`tw:flex tw:fixed tw:w-full tw:h-8 tw:items-center tw:bottom-0 tw:left-0 tw:px-2 tw:z-50 tw:dark:border-slate-700/50 tw:dark:text-slate-200 tw:text-gray-800 tw:border-indigo-100/50`}
    >
      <div className='tw:flex tw:justify-center tw:items-center tw:gap-1 tw:pl-1 tw:h-8 tw:me-auto'>
        <span className='tw:text-xs tw:flex tw:items-center'>
          <span className='tw:flex tw:items-center tw:gap-1'>
            <Tooltip position='top' content='https://status.racla.app'>
              <span
                onClick={() => {
                  handleOpenExternalLink('https://status.racla.app')
                }}
                className='tw:cursor-pointer tw:flex tw:items-center tw:gap-1'
              >
                <div className='tw:relative tw:flex tw:items-center tw:justify-center tw:mr-1'>
                  <span
                    className={`tw:text-xs ${isOnline ? 'tw:text-green-500' : 'tw:text-red-500'} tw:relative tw:z-10 tw:align-middle`}
                  >
                    <Icon icon='lucide:circle' width='10' height='10' />
                  </span>
                  <div
                    className={`tw:absolute tw:w-3 tw:h-3 tw:rounded-full tw:animate-custom-ping tw:opacity-40 ${isOnline ? 'tw:bg-green-500' : 'tw:bg-red-500'}`}
                  />
                </div>
                <span className='tw:leading-none'>
                  {isOnline
                    ? `Server Connected · ${ServerStatusResponse || ''} · ${globalDictionary.version}`
                    : `Server Disconnected · ${globalDictionary.version}`}
                </span>
              </span>
            </Tooltip>
          </span>
        </span>
      </div>
      <div className='tw:flex tw:text-xs tw:justify-center tw:items-center tw:gap-1 tw:h-8 tw:pr-1'>
        <>
          {selectedGame === 'djmax_respect_v' && !isTrackMaker && (
            <>
              <span>Powered by </span>
              <Tooltip position='top' content='https://v-archive.net'>
                <span
                  className='tw:text-xs tw:cursor-pointer'
                  onClick={() => {
                    handleOpenExternalLink('https://v-archive.net')
                  }}
                >
                  {t('djmax_respect_v.vArchiveNavTitle')}
                </span>
              </Tooltip>
              <span> & </span>
              <Tooltip position='top' content='https://hard-archive.com'>
                <span
                  className='tw:text-xs tw:cursor-pointer'
                  onClick={() => {
                    handleOpenExternalLink('https://hard-archive.com')
                  }}
                >
                  {t('djmax_respect_v.hjaNavTitle')}
                </span>
              </Tooltip>
              <span> · </span>
            </>
          )}

          {selectedGame && renderGameSpecificContent()}
        </>
        <Tooltip position='top' content={t('racla.raclaLicense')}>
          <Link className='tw:text-xs tw:cursor-pointer' to='/license'>
            {t('racla.raclaLicense')}
          </Link>
        </Tooltip>
      </div>
    </div>
  )
}

export default Footer
