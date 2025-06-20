import { Icon } from '@iconify/react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import Image from '@render/components/image/Image'
import ScorePopupComponent from '@render/components/score/ScorePopup'
import { globalDictionary } from '@render/constants/globalDictionary'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { RootState } from '@render/store'
import { LazySongGridItemProps } from '@src/types/render/LazySongGridItemProps'
import { LazySongListItemProps } from '@src/types/render/LazySongListItemProps'
import { useTranslation } from 'react-i18next'

// DLC 카테고리 매핑 추가
const DLC_CATEGORY_MAPPING = {
  LEGACY: ['P1', 'P2', 'P3', 'CE', 'BS', 'TR', 'T1', 'T2', 'T3'],
  RESPECT: ['R'],
  EXTENSION: ['VE', 'VE1', 'VE2', 'VE3', 'VE4', 'VE5'],
  LIBERTY: ['VL', 'VL1', 'VL2', 'VL3'],
  COLLABORATION: ['COLLABORATION'],
  PLI: ['PLI1'],
}

// LazyListItem 컴포넌트 추가
const LazyListItem = React.memo(
  ({
    songItem,
    keyMode,
    hoveredTitle,
    handleMouseEnter,
    handleMouseLeave,
    selectedLevel,
    navigate,
    showNotification,
  }: LazySongListItemProps) => {
    const { ref, inView } = useInView({
      triggerOnce: false,
      threshold: 0.1,
      rootMargin: '200px',
    })

    const handleClick = useCallback(() => {
      if (songItem.uuid) {
        navigate(`/games/djmax_respect_v/hard/db/${songItem.title}`)
      } else {
        showNotification(
          {
            ns: 'db',
            value: 'noHardArchiveData',
            mode: 'i18n',
          },
          'error',
        )
      }
    }, [songItem, navigate, showNotification])

    if (!inView) {
      return <div ref={ref} className='tw:h-[84px]' /> // 플레이스홀더
    }

    return (
      <div
        ref={ref}
        data-song-title={songItem.title}
        onClick={() => {
          handleClick()
        }}
        className={`tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:relative tw:overflow-hidden tw:cursor-pointer ${hoveredTitle === String(songItem.title) ? 'tw:bg-slate-100 tw:dark:bg-slate-700/50' : ''} hover:tw:bg-slate-100 hover:tw:dark:bg-slate-700/50`}
        onMouseEnter={() => {
          handleMouseEnter(songItem)
        }}
        onMouseLeave={() => {
          handleMouseLeave()
        }}
      >
        {/* 애니메이션 배경 레이어 */}
        <div
          className={`tw:absolute tw:inset-0 tw:opacity-0 tw:transition-opacity tw:duration-300 before:tw:content-[''] before:tw:absolute before:tw:inset-[-150%] before:tw:bg-[length:200%_200%] before:tw:animate-gradientSlide before:tw:bg-gradient-to-r before:tw:from-[#1d8975] before:tw:via-[#5276b4] before:tw:via-[#8432bd] before:tw:via-[#5276b4] before:tw:to-[#1d8975] ${hoveredTitle === String(songItem.title) ? 'tw:opacity-10' : ''} `}
        />

        {/* 곡 정보 */}
        <div className='tw:relative tw:w-full tw:flex tw:items-center tw:gap-4'>
          <div className='tw:w-[80px] tw:h-[80px]'>
            <ScorePopupComponent
              isVisibleCode={true}
              songTitle={songItem.title}
              keyMode={String(keyMode)}
              isLink={false}
            />
          </div>
          <div className='tw:flex tw:flex-1'>
            <div className='tw:flex tw:flex-col tw:flex-1'>
              <span className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400'>
                {songItem.composer}
              </span>
              <span className='tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                {songItem.name}
              </span>
            </div>
            {/* 난이도별 고정 칸 */}
            <div className='tw:flex tw:gap-4 tw:items-center justify-center'>
              {['MX', 'SC'].map((diff) => {
                const pattern = songItem.patterns[`${keyMode.replace('P', '')}B`]?.[diff]
                const level = pattern?.level

                // 기본 표시 조건
                const baseShowCondition =
                  (diff === 'MX' && level >= 15) || (diff === 'SC' && level >= 8)

                // 하이라이트 조건 수정
                const shouldHighlight =
                  (diff === 'SC' &&
                    (selectedLevel === 'all' || Math.floor(level) === parseInt(selectedLevel))) || // SC 하이라이트 조건
                  (diff === 'MX' &&
                    level >= 15 &&
                    (selectedLevel === 'all' || selectedLevel === '8')) // MX 하이라이트 조건

                const opacity = !shouldHighlight ? 'tw:opacity-30' : ''

                return baseShowCondition ? (
                  <div key={diff} className='tw:w-20 tw:text-center'>
                    <div
                      className={`tw:flex tw:justify-center tw:items-center tw:gap-1 tw:font-extrabold ${diff === 'MX' && 'tw:text-respect-nm-15'} ${diff === 'SC' && 'tw:text-respect-sc-15'} ${opacity}`}
                    >
                      <Image
                        src={`${import.meta.env.VITE_CDN_URL}/djmax_respect_v/nm_${diff}_star.png`}
                        width={16}
                        height={16}
                        alt={diff}
                      />
                      <div className='tw:text-base'>{level}</div>
                    </div>
                  </div>
                ) : (
                  <div key={diff} className='tw:opacity-30 tw:w-20 tw:text-center'>
                    <div className='tw:text-base tw:font-extrabold tw:text-slate-700 tw:dark:text-slate-300'>
                      -
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  },
)

// LazyGridItem 컴포넌트 추가
const LazyGridItem = React.memo(({ songItem, keyMode }: LazySongGridItemProps) => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
    rootMargin: '200px',
  })

  return (
    <div ref={ref} className='tw:w-[80px] tw:h-[80px]'>
      {inView && (
        <ScorePopupComponent
          isVisibleCode={true}
          songTitle={songItem.title}
          keyMode={String(keyMode)}
        />
      )}
    </div>
  )
})

const DmrvHardDbPage = () => {
  const { t } = useTranslation(['db'])
  const { showNotification } = useNotificationSystem()
  const navigate = useNavigate()
  const { songData, selectedGame } = useSelector((state: RootState) => state.app)

  const [keyMode, setKeyMode] = useState<string>('4')
  const [searchName, setSearchName] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  // selectedDlcCode 상태를 카테고리로 변경
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'LEGACY' | 'RESPECT' | 'EXTENSION' | 'LIBERTY' | 'COLLABORATION'
  >('LEGACY')

  const searchSong = (songItem, searchName) => {
    const searchNameLower = searchName.toLowerCase().trim()
    const backspacedSearchNameLower = searchName.toLowerCase().trim().replace(' ', '')

    // 일반 문자열 검색
    const isStringMatch =
      String(songItem.composer).toLowerCase().includes(searchNameLower) ||
      String(songItem.name).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(searchNameLower) ||
      String(songItem.title).includes(searchNameLower)

    const isStringMatchBackspaced =
      String(songItem.composer).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.name).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.title).includes(searchNameLower)

    return isStringMatch || isStringMatchBackspaced
  }

  const [visibleItems, setVisibleItems] = useState<number>(20) // 초기에 보여줄 아이템 수
  const { inView, ref: loadMoreRef } = useInView({
    threshold: 0.1,
    rootMargin: '400px 0px',
  })

  // 필터링된 곡 데이터 계산 수정
  const filteredSongData = useMemo(() => {
    const filtered = songData[selectedGame].filter((songItem) => {
      const patterns = songItem.patterns[keyMode + 'B']
      const scLevel = patterns?.SC?.level ?? 0
      const mxLevel = patterns?.MX?.level ?? 0

      // 검색어 필터
      const searchFilter = searchName === '' || searchSong(songItem, searchName)

      // 레벨 필터
      let levelFilter = false
      if (selectedLevel === 'all') {
        // 전체 보기: SC8 이상 또는 MX15 이상
        levelFilter = scLevel >= 8 || mxLevel >= 15
      } else if (selectedLevel === '8') {
        // 레벨 8: SC8 또는 MX15 이상
        levelFilter = (scLevel >= 8 && Math.floor(scLevel) === 8) || mxLevel >= 15
      } else {
        // 그 외 레벨: 해당 레벨의 SC만
        levelFilter = Math.floor(scLevel) === parseInt(selectedLevel)
      }

      // DLC 카테고리 필터
      const categoryFilter =
        selectedCategory === 'all' ||
        DLC_CATEGORY_MAPPING[selectedCategory].includes(songItem.dlcCode) ||
        DLC_CATEGORY_MAPPING[selectedCategory].includes(songItem.dlc)

      return searchFilter && levelFilter && categoryFilter
    })

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name)
      } else {
        return b.name.localeCompare(a.name)
      }
    })
  }, [searchName, selectedLevel, keyMode, sortOrder, selectedCategory])

  // 스크롤 시 더 많은 아이템 로드
  useEffect(() => {
    if (inView && visibleItems < filteredSongData.length) {
      setVisibleItems((prev) => Math.min(prev + 20, filteredSongData.length))
    }
  }, [inView, filteredSongData.length, visibleItems])

  // 현재 화면에 보여줄 곡 목록
  const visibleSongData = useMemo(() => {
    return filteredSongData.slice(0, visibleItems)
  }, [filteredSongData, visibleItems])

  return (
    selectedGame === 'djmax_respect_v' && (
      <React.Fragment>
        <div id='ContentHeader' />
        <div className='tw:flex tw:flex-col tw:gap-4 tw:h-[calc(100vh-106px)] tw:relative'>
          {/* 상단 영역 */}
          <div className='tw:flex tw:flex-col tw:gap-4 tw:transition-all tw:w-full duration-300'>
            <div className='tw:flex tw:w-full tw:gap-4'>
              <div className='tw:flex tw:w-full tw:flex-col tw:gap-4 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                {/* 헤더 */}
                <div className='tw:flex tw:w-full tw:rounded tw:overflow-x-auto tw:scroll-smooth'>
                  <div className='tw:flex tw:flex-col tw:gap-4 tw:p-4 tw:w-full'>
                    {/* 카테고리 영역 */}
                    <div className='tw:flex tw:w-full tw:items-center tw:gap-2'>
                      {/* 스크롤 가능한 카테고리 영역 */}
                      <div
                        ref={categoryScrollRef}
                        className='tw:flex tw:flex-1 tw:overflow-x-auto tw:scroll-smooth tw:scrollbar-thin tw:scrollbar-thumb-slate-400 tw:dark:scrollbar-thumb-slate-500 tw:scrollbar-track-transparent'
                      >
                        <div className='tw:flex tw:items-center tw:w-full tw:gap-2'>
                          <button
                            onClick={() => {
                              setSelectedCategory('all')
                            }}
                            className={`tw:py-2 tw:px-4 tw:flex-1 tw:min-w-0 tw:text-sm tw:font-medium tw:whitespace-nowrap tw:relative tw:transition-all tw:duration-300 tw:rounded-md ${
                              selectedCategory === 'all'
                                ? 'tw:text-white tw:bg-indigo-500'
                                : 'tw:text-slate-700 tw:dark:text-slate-300 tw:bg-slate-200 tw:dark:bg-slate-600 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                            }`}
                          >
                            {t('all')}
                          </button>
                          {[
                            'LEGACY',
                            'RESPECT',
                            'EXTENSION',
                            'LIBERTY',
                            'COLLABORATION',
                            'PLI',
                          ].map((category) => (
                            <button
                              key={category}
                              onClick={() => {
                                setSelectedCategory(category as typeof selectedCategory)
                              }}
                              className={`tw:py-2 tw:px-4 tw:flex-1 tw:text-sm tw:font-medium tw:whitespace-nowrap tw:relative tw:transition-all tw:duration-300 tw:rounded-md ${
                                selectedCategory === category
                                  ? 'tw:text-white tw:bg-indigo-500'
                                  : 'tw:text-slate-700 tw:dark:text-slate-300 tw:bg-slate-200 tw:dark:bg-slate-600 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                              }`}
                            >
                              {category.replace('RATION', '')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className='tw:flex tw:items-center tw:justify-between tw:flex-wrap tw:gap-2'>
                      <div className='tw:flex tw:gap-2 tw:items-center'>
                        <button
                          onClick={() => {
                            setViewMode('list')
                          }}
                          className={`tw:p-2 tw:rounded-md tw:transition-all ${
                            viewMode === 'list'
                              ? 'tw:bg-indigo-500 tw:text-white'
                              : 'tw:bg-slate-200 tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                          }`}
                        >
                          <Icon icon='lucide:list' className='tw:w-5 tw:h-5' />
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('grid')
                          }}
                          className={`tw:p-2 tw:rounded-md tw:transition-all ${
                            viewMode === 'grid'
                              ? 'tw:bg-indigo-500 tw:text-white'
                              : 'tw:bg-slate-200 tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                          }`}
                        >
                          <Icon icon='lucide:grid' className='tw:w-5 tw:h-5' />
                        </button>
                      </div>
                      <div className='tw:flex tw:flex-1 tw:gap-2'>
                        <select
                          value={selectedLevel}
                          onChange={(e) => {
                            setSelectedLevel(e.target.value)
                          }}
                          className='tw:p-1.5 tw:min-w-[140px] tw:max-w-[140px] tw:text-sm tw:rounded-md tw:border tw:dark:bg-slate-700 tw:dark:text-white tw:dark:border-slate-600 tw:bg-white tw:text-slate-700 tw:border-slate-300 focus:tw:border-indigo-400 focus:tw:ring-2 focus:tw:ring-indigo-400 focus:tw:ring-opacity-20 tw:transition-all'
                        >
                          <option value='all'>{t('allDifficulty')}</option>
                          {Array.from({ length: 8 }, (_, i) => i + 8).map((level) => (
                            <option key={level} value={level.toString()}>
                              SC {level}
                              {level === 8 ? ' + MX 15' : ''}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          }}
                          className='tw:bg-slate-200 tw:dark:bg-slate-700/50 tw:text-slate-700 tw:dark:text-white tw:px-4 tw:py-1.5 tw:text-sm tw:rounded-md tw:border tw:border-slate-300 tw:dark:border-slate-600 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600 tw:transition-all tw:flex tw:items-center tw:gap-1'
                        >
                          <span>{sortOrder === 'asc' ? t('nameAsc') : t('nameDesc')}</span>
                        </button>

                        <div className='tw:relative tw:flex-1'>
                          <div className='tw:absolute tw:inset-y-0 tw:left-0 tw:pl-3 tw:flex tw:items-center tw:pointer-events-none'>
                            <Icon
                              icon='lucide:search'
                              className='tw:h-4 tw:w-4 tw:text-slate-400'
                            />
                          </div>
                          <input
                            ref={searchInputRef}
                            className='tw:w-full tw:text-sm tw:bg-white tw:dark:bg-slate-700 tw:text-slate-900 tw:dark:text-white tw:pl-10 tw:pr-4 tw:py-1.5 tw:rounded-md tw:border tw:border-slate-300 tw:dark:border-slate-600 tw:border-opacity-50 focus:tw:border-indigo-400 focus:tw:ring-2 focus:tw:ring-indigo-400 focus:tw:ring-opacity-20 tw:transition-all'
                            onChange={(e) => {
                              setSearchName(e.currentTarget.value)
                            }}
                            type='text'
                            placeholder={t('searchPlaceholder')}
                          />
                        </div>
                      </div>

                      <div className='tw:flex tw:gap-2'>
                        <div className='tw:flex tw:gap-2'>
                          {globalDictionary.gameDictionary[selectedGame].keyModeList.map((mode) => (
                            <button
                              key={`mode_${mode}`}
                              onClick={() => {
                                setKeyMode(String(mode))
                              }}
                              className={`tw:flex tw:items-center tw:justify-center tw:relative tw:px-4 tw:py-0.5 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-md tw:flex-1 ${
                                String(mode) === keyMode
                                  ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
                                  : 'tw:border-slate-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100'
                              }`}
                            >
                              <div
                                className={`tw:absolute tw:w-full tw:h-full tw:opacity-30 ${
                                  selectedGame === 'djmax_respect_v' ? 'respect' : selectedGame
                                }_bg_b${String(mode).replace('P', '')}`}
                              />
                              <span className='tw:relative tw:text-base tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                                {String(mode).replace('P', '')}B
                                {String(mode).includes('P') ? '+' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className='tw:flex-1 tw:overflow-hidden tw:transition-all tw:w-full duration-300'>
            <div className='tw:h-full tw:overflow-y-auto tw:scroll-smooth tw:custom-scrollbar custom-scrollbar-always'>
              <div className='tw:flex tw:mr-2 tw:flex-col tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-md tw:p-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                <div
                  className={`tw:w-full ${viewMode === 'grid' ? 'tw:grid tw:grid-cols-[repeat(auto-fill,80px)] tw:gap-3 tw:justify-center tw:content-center' : 'tw:flex tw:flex-col'}`}
                >
                  {viewMode === 'list' && (
                    <div className='tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-slate-300 tw:dark:border-slate-600 tw:text-slate-500 tw:dark:text-slate-300 tw:font-bold tw:text-sm'>
                      <div className='tw:w-[80px] tw:text-center'>{t('songImage')}</div>
                      <div className='tw:flex tw:flex-1'>
                        <div className='tw:flex-1'>{t('songInfo')}</div>
                        <div className='tw:w-48 tw:text-center'>{t('difficulty')}</div>
                      </div>
                    </div>
                  )}

                  {visibleSongData.map((songItem) =>
                    viewMode === 'grid' ? (
                      <LazyGridItem
                        key={songItem.title}
                        songItem={songItem}
                        keyMode={String(keyMode)}
                      />
                    ) : (
                      <LazyListItem
                        key={songItem.title}
                        songItem={songItem}
                        keyMode={String(keyMode)}
                        hoveredTitle={String(songItem.title)}
                        selectedLevel={selectedLevel}
                        navigate={navigate}
                        showNotification={showNotification}
                      />
                    ),
                  )}
                  {viewMode === 'grid' &&
                    Array.from(Array(20)).map((_, index) => (
                      <div key={index} className='tw:w-[80px] tw:h-[80px]' />
                    ))}

                  {/* 더 불러오기를 위한 관찰 요소 */}
                  {visibleItems < filteredSongData.length && (
                    <div
                      ref={loadMoreRef}
                      className={`tw:h-20 tw:w-full tw:flex tw:justify-center tw:items-center ${viewMode === 'grid' ? 'tw:col-span-full' : ''}`}
                    >
                      <div className='tw:text-sm tw:text-slate-500'>{t('loadingMore')}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id='ContentFooter' />
      </React.Fragment>
    )
  )
}

export default DmrvHardDbPage
