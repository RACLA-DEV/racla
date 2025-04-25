import { RootState } from '@render/store'
import { setIsSetting, setSelectedGame } from '@render/store/slices/appSlice'
import type { GameType } from '@src/types/common/GameType'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuBook, LuHouse, LuLayers, LuSettings } from 'react-icons/lu'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Tooltip from './Tooltip'
const IconSidebar: React.FC = () => {
  const { theme } = useSelector((state: RootState) => state.ui)
  const { selectedGame } = useSelector((state: RootState) => state.app)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = window.location.hash.substring(1) // 현재 경로 가져오기
  const { t } = useTranslation(['menu'])

  // 로고 인덱스 상태 관리
  const [djmaxLogoIndex, setDjmaxLogoIndex] = useState(0)
  const [wjmaxLogoIndex, setWjmaxLogoIndex] = useState(0)

  // 로고 이미지 배열
  const djmaxLogos = ['new_logo_0.png', 'new_logo_1.png']
  const wjmaxLogos = [
    'new_logo_0.png',
    'new_logo_1.png',
    'new_logo_2.png',
    'new_logo_3.png',
    'new_logo_4.png',
    'new_logo_5.png',
  ]

  // 게임 아이콘 정보
  const gameIcons = [
    {
      id: 'djmax_respect_v' as GameType,
      tooltip: 'DJMAX RESPECT V',
      iconUrl: `https://cdn.racla.app/djmax_respect_v/${djmaxLogos[djmaxLogoIndex]}`,
      onClick: () => {
        // 이미지 변경과 게임 선택을 분리
        if (selectedGame === 'djmax_respect_v') {
          // 이미 선택된 경우 로고만 변경
          setDjmaxLogoIndex((prev) => (prev + 1) % djmaxLogos.length)
        } else {
          // 선택되지 않은 경우 게임 선택
          handleGameSelect('djmax_respect_v')
        }
      },
    },
    {
      id: 'wjmax' as GameType,
      tooltip: 'WJMAX',
      iconUrl: `https://cdn.racla.app/wjmax/${wjmaxLogos[wjmaxLogoIndex]}`,
      onClick: () => {
        if (selectedGame === 'wjmax') {
          // 이미 선택된 경우 로고만 변경
          setWjmaxLogoIndex((prev) => (prev + 1) % wjmaxLogos.length)
        } else {
          // 선택되지 않은 경우 게임 선택
          handleGameSelect('wjmax')
        }
      },
    },
    {
      id: 'platina_lab' as GameType,
      tooltip: 'PLATiNA :: LAB',
      iconUrl: 'https://cdn.racla.app/platina_lab/new_logo.png',
      onClick: () => handleGameSelect('platina_lab'),
    },
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const handleGameSelect = (gameId: GameType) => {
    dispatch(setSelectedGame(gameId))
    // 선택한 게임의 홈 페이지로 이동
    const homePath = '/home'
    navigate(homePath)
  }

  const handleOpenSettings = () => {
    dispatch(setIsSetting(true))
  }

  // 애니메이션 변수
  const sidebarAnimation = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  }

  const iconAnimation = (index: number) => ({
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        // delay: 0.2 + index * 0.1,
        duration: 0.4,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
  })

  // 로고 변경 애니메이션
  const logoChangeAnimation = {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3 },
  }

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={sidebarAnimation}
      className={`tw:flex tw:flex-col tw:items-center tw:px-2 tw:h-full tw:relative tw:justify-between ${
        theme === 'dark'
          ? 'tw:bg-transparent tw:text-slate-200'
          : 'tw:bg-transparent tw:text-gray-800'
      }`}
    >
      {/* 상단 홈 버튼 */}
      <div className='tw:flex tw:flex-col tw:items-center'>
        <div className='tw:mb-4 tw:relative tw:z-10'>
          <Tooltip content={t('racla.raclaHome')}>
            <motion.div
              variants={iconAnimation(0)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigation('/home')}
              className={`tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:cursor-pointer tw:transition-all ${
                location === '/home'
                  ? theme === 'dark'
                    ? 'tw:bg-slate-700 tw:text-indigo-400'
                    : 'tw:bg-white tw:text-indigo-600 tw:shadow-md'
                  : theme === 'dark'
                    ? 'tw:bg-slate-800 tw:text-indigo-400 tw:hover:bg-slate-700'
                    : 'tw:bg-gray-50 tw:shadow-md tw:hover:bg-white tw:hover:shadow-md'
              }`}
            >
              <LuHouse size={28} />
            </motion.div>
          </Tooltip>
        </div>

        <div className='tw:flex tw:flex-col tw:items-center'>
          <div className='tw:mb-4 tw:relative tw:z-10'>
            <Tooltip content={t('racla.raclaCheatsheet')}>
              <motion.div
                variants={iconAnimation(0)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigation('/test/cheatsheet')}
                className={`tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:cursor-pointer tw:transition-all ${
                  location === '/test/cheatsheet'
                    ? theme === 'dark'
                      ? 'tw:bg-slate-700 tw:text-indigo-400'
                      : 'tw:bg-white tw:text-indigo-600 tw:shadow-md'
                    : theme === 'dark'
                      ? 'tw:bg-slate-800 tw:text-indigo-400 tw:hover:bg-slate-700'
                      : 'tw:bg-gray-50 tw:shadow-md tw:hover:bg-white tw:hover:shadow-md'
                }`}
              >
                <LuBook size={28} />
              </motion.div>
            </Tooltip>
          </div>
        </div>

        <div className='tw:mb-4 tw:relative tw:z-10'>
          <Tooltip content={t('racla.raclaOverlay')}>
            <motion.div
              variants={iconAnimation(0)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigation('/overlay/settings')}
              className={`tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:cursor-pointer tw:transition-all ${
                location === '/overlay/settings'
                  ? theme === 'dark'
                    ? 'tw:bg-slate-700 tw:text-indigo-400'
                    : 'tw:bg-white tw:text-indigo-600 tw:shadow-md'
                  : theme === 'dark'
                    ? 'tw:bg-slate-800 tw:text-indigo-400 tw:hover:bg-slate-700'
                    : 'tw:bg-gray-50 tw:shadow-md tw:hover:bg-white tw:hover:shadow-md'
              }`}
            >
              <LuLayers size={28} />
            </motion.div>
          </Tooltip>
        </div>

        {/* 게임 선택 아이콘들 (중앙) */}
        <div
          className={`tw:flex tw:flex-col tw:items-center tw:space-y-4 tw:pt-4 tw:border-t tw:relative tw:z-10 ${
            theme === 'dark' ? 'tw:border-slate-700' : 'tw:border-gray-300'
          }`}
        >
          {gameIcons.map((game, index) => (
            <Tooltip key={game.id} content={game.tooltip}>
              <motion.div
                variants={iconAnimation(index + 1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={game.onClick}
                className={`tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:overflow-hidden tw:cursor-pointer tw:transition-all ${
                  selectedGame === game.id
                    ? theme === 'dark'
                      ? 'tw:bg-slate-700'
                      : 'tw:bg-white tw:shadow-md'
                    : theme === 'dark'
                      ? 'tw:bg-slate-800 tw:hover:bg-slate-700'
                      : 'tw:bg-gray-50 tw:shadow-md tw:hover:bg-white tw:hover:shadow-md'
                }`}
              >
                <AnimatePresence mode='wait'>
                  <motion.img
                    key={
                      game.id === 'djmax_respect_v'
                        ? djmaxLogoIndex
                        : game.id === 'wjmax'
                          ? wjmaxLogoIndex
                          : game.id
                    }
                    src={game.iconUrl}
                    alt={game.tooltip}
                    {...logoChangeAnimation}
                  />
                </AnimatePresence>
              </motion.div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* 설정 버튼 (하단) */}
      <div className='tw:mb-10 tw:relative tw:z-10'>
        <Tooltip content={t('racla.raclaSettings')}>
          <motion.div
            variants={iconAnimation(5)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenSettings}
            className={`tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:cursor-pointer tw:transition-all ${
              theme === 'dark'
                ? 'tw:bg-slate-800 tw:hover:bg-slate-700 tw:text-indigo-400'
                : 'tw:bg-gray-50 tw:hover:bg-white tw:text-indigo-600 tw:shadow-md'
            }`}
          >
            <LuSettings size={28} />
          </motion.div>
        </Tooltip>
      </div>
    </motion.div>
  )
}

export default IconSidebar
