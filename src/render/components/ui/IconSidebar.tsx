import { Icon } from '@iconify/react'
import { RootState } from '@render/store'
import { GameType, setSelectedGame } from '@render/store/slices/uiSlice'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Tooltip from './Tooltip'

const IconSidebar: React.FC = () => {
  const { theme, selectedGame } = useSelector((state: RootState) => state.ui)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = window.location.hash.substring(1) // 현재 경로 가져오기

  // 게임 아이콘 정보
  const gameIcons = [
    {
      id: 'djmax_respect_v' as GameType,
      tooltip: 'DJMAX RESPECT V',
      icon: 'mdi:controller',
    },
    {
      id: 'wjmax' as GameType,
      tooltip: 'WJMAX',
      icon: 'mdi:gamepad-variant',
    },
    {
      id: 'platina_lab' as GameType,
      tooltip: 'PLATiNA :: LAB',
      icon: 'mdi:music',
    },
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const handleGameSelect = (gameId: GameType) => {
    dispatch(setSelectedGame(gameId))
    // 선택한 게임의 홈 페이지로 이동
    const homePath = '/'
    navigate(homePath)
  }

  return (
    <div
      className={`tw:flex tw:flex-col tw:items-center tw:px-2 tw:h-full tw:relative tw:justify-between ${
        theme === 'dark'
          ? 'tw:bg-transparent tw:text-slate-200'
          : 'tw:bg-transparent tw:text-gray-900'
      }`}
    >
      {/* 상단 홈 버튼 */}
      <div className='tw:flex tw:flex-col tw:items-center'>
        <div className='tw:mb-4 tw:relative tw:z-10'>
          <Tooltip content='홈'>
            <div
              onClick={() => handleNavigation('/')}
              className={`tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:cursor-pointer tw:transition-all ${
                location === '/'
                  ? theme === 'dark'
                    ? 'tw:bg-slate-700 tw:text-indigo-400'
                    : 'tw:bg-white tw:text-indigo-600 tw:shadow-md'
                  : theme === 'dark'
                    ? 'tw:text-indigo-400 tw:hover:bg-slate-800'
                    : 'tw:text-indigo-600 tw:hover:bg-white tw:hover:shadow-md'
              }`}
            >
              <Icon icon='mdi:home' width='28' height='28' />
            </div>
          </Tooltip>
        </div>

        {/* 게임 선택 아이콘들 (중앙) */}
        <div
          className={`tw:flex tw:flex-col tw:items-center tw:space-y-4 tw:pt-4 tw:border-t tw:relative tw:z-10 ${
            theme === 'dark' ? 'tw:border-slate-700' : 'tw:border-gray-300'
          }`}
        >
          {gameIcons.map((game) => (
            <Tooltip key={game.id} content={game.tooltip}>
              <div
                onClick={() => handleGameSelect(game.id)}
                className={`tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:cursor-pointer tw:transition-all ${
                  selectedGame === game.id
                    ? theme === 'dark'
                      ? 'tw:bg-slate-700 tw:text-indigo-400'
                      : 'tw:bg-white tw:text-indigo-600 tw:shadow-md'
                    : theme === 'dark'
                      ? 'tw:bg-slate-800 tw:text-slate-300 tw:hover:bg-slate-700'
                      : 'tw:bg-gray-50 tw:shadow-md tw:text-gray-700 tw:hover:bg-white tw:hover:shadow-md'
                }`}
              >
                <Icon icon={game.icon} width='28' height='28' />
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* 설정 버튼 (하단) */}
      <div className='tw:mb-10 tw:relative tw:z-10'>
        <Tooltip content='설정'>
          <div
            onClick={() => handleNavigation('/settings')}
            className={`tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:cursor-pointer tw:transition-all ${
              location === '/settings'
                ? theme === 'dark'
                  ? 'tw:bg-slate-700 tw:text-indigo-400'
                  : 'tw:bg-white tw:text-indigo-600 tw:shadow-md'
                : theme === 'dark'
                  ? 'tw:bg-slate-800 tw:text-slate-300 tw:hover:bg-slate-700'
                  : 'tw:bg-gray-50 tw:shadow-md tw:text-gray-700 tw:hover:bg-white tw:hover:shadow-md'
            }`}
          >
            <Icon icon='mdi:cog' width='28' height='28' />
          </div>
        </Tooltip>
      </div>
    </div>
  )
}

export default IconSidebar
