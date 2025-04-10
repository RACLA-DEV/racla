import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { RootState } from '@render/store'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

interface ServerStatus {
  message: string
  version: string
  timestamp: number
}

// Vite에서는 import.meta.env를 사용해야 함
const API_URL = import.meta.env.VITE_API_URL || 'https://api.racla.app'

const Footer: React.FC = () => {
  const { theme, selectedGame } = useSelector((state: RootState) => state.ui)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(false)

  useEffect(() => {
    // 서버 상태 확인 함수
    const checkServerStatus = async () => {
      try {
        console.log('Checking server status...', API_URL) // 디버깅용 로그
        const response = await axios.get(`${API_URL}/v2/racla/ping`, {
          timeout: 5000, // 5초 타임아웃 설정
        })

        if (response.status === 200) {
          console.log('Server response:', response.data) // 디버깅용 로그
          setServerStatus(response.data)
          setIsOnline(true)
        } else {
          console.log('Server error status:', response.status) // 디버깅용 로그
          setIsOnline(false)
        }
      } catch (error) {
        console.error('Server connection error:', error) // 디버깅용 로그
        setIsOnline(false)
      }
    }

    // 초기 실행
    checkServerStatus()

    // 30초마다 실행되는 인터벌 설정
    const interval = setInterval(() => {
      console.log('Running interval check...') // 디버깅용 로그
      checkServerStatus()
    }, 30000)

    // 클린업 함수
    return () => {
      console.log('Cleaning up interval') // 디버깅용 로그
      clearInterval(interval)
    }
  }, []) // 빈 의존성 배열 - 컴포넌트 마운트 시 한 번만 실행

  const handleOpenExternalLink = (url: string) => {
    if (url) {
      // 외부 링크는 requestOpenExternalLink 사용하여 모달 확인 과정 거치도록 변경
      if (globalDictionary.requestOpenExternalLink) {
        globalDictionary.requestOpenExternalLink(url)
      }
    }
  }

  const renderGameSpecificContent = () => {
    switch (selectedGame) {
      case 'djmax_respect_v':
        return (
          <span
            className='tw:cursor-pointer'
            onClick={() => handleOpenExternalLink('https://store.steampowered.com/app/960170')}
          >
            Resources from DJMAX RESPECT V
            <span
              className='tw:ml-1 tw:cursor-pointer'
              onClick={(e) => {
                e.stopPropagation()
                handleOpenExternalLink('https://www.neowiz.com/')
              }}
            >
              (©NEOWIZ)
            </span>
          </span>
        )
      case 'wjmax':
        return (
          <span
            className='tw:cursor-pointer'
            onClick={() => handleOpenExternalLink('https://waktaverse.games/gameDetail/wjmax')}
          >
            Resources from WJMAX(©WJMAX STUDIO)
          </span>
        )
      case 'platina_lab':
        return (
          <span
            className='tw:cursor-pointer'
            onClick={() => handleOpenExternalLink('https://platinalab.net/')}
          >
            PLATiNA :: LAB(HIGH-END Games)
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={`tw:flex tw:fixed tw:w-full tw:h-8 tw:items-center tw:bottom-0 tw:left-0 tw:px-2 tw:z-50 ${
        theme === 'dark'
          ? 'tw:border-slate-700/50 tw:text-slate-300'
          : 'tw:border-indigo-100/50 tw:text-indigo-900'
      }`}
    >
      <div className='tw:flex tw:justify-center tw:items-center tw:gap-1 tw:pl-1 tw:h-8 tw:me-auto'>
        <span className='tw:text-xs tw:flex tw:items-center'>
          <span className='tw:flex tw:items-center tw:gap-1'>
            <span
              onClick={() => handleOpenExternalLink('https://racla.app')}
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
                  ? `Server Connected - ${serverStatus?.version || 'v1.0'} - ${globalDictionary.version}`
                  : `Server Disconnected - ${globalDictionary.version}`}
              </span>
            </span>
          </span>
        </span>
      </div>
      <div className='tw:flex tw:text-xs tw:justify-center tw:items-center tw:gap-1 tw:h-8 tw:pr-1'>
        <>
          {selectedGame === 'djmax_respect_v' && (
            <>
              <span>Powered by </span>
              <button
                className='tw:text-xs tw:cursor-pointer'
                type='button'
                onClick={() =>
                  handleOpenExternalLink('https://github.com/djmax-in/openapi?tab=readme-ov-file')
                }
              >
                V-ARCHIVE
              </button>
              <span> & </span>
              <button
                className='tw:text-xs tw:cursor-pointer'
                type='button'
                onClick={() => handleOpenExternalLink('https://hard-archive.com')}
              >
                전일 아카이브
              </button>
              <span> · </span>
            </>
          )}

          {selectedGame && renderGameSpecificContent()}
          <span> · </span>
        </>
        <span
          className='tw:text-xs tw:cursor-pointer'
          onClick={() => handleOpenExternalLink('https://racla.app/license')}
        >
          라이선스 및 이용약관
        </span>
      </div>
    </div>
  )
}

export default Footer
