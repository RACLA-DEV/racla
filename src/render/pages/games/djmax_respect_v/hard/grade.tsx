import React, { useCallback, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'

import ScorePopupComponent from '@render/components/score/ScorePopup'
import { getGradeTableData } from '@render/libs/hjaGradeParserUtils'
import { RootState } from '@render/store'
import { PuffLoader } from 'react-spinners'

const gradeTableMap = {
  '4': getGradeTableData('4'),
  '5': getGradeTableData('5'),
  '6': getGradeTableData('6'),
  '8': getGradeTableData('8'),
}

// songs를 name 기준으로 정렬하는 함수 추가
const sortByName = (songs: any[]) => {
  return [...songs].sort((a, b) => a.name.localeCompare(b.name))
}

// LazyFloorItem 컴포넌트 타입 정의
interface LazyFloorItemProps {
  floorItem: {
    floor: number
    songItems: any[]
  }
  keyMode: string
}

// 지연 로딩되는 FloorItem 컴포넌트
const LazyFloorItem = React.memo(({ floorItem, keyMode }: LazyFloorItemProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '100px',
  })

  return (
    <div ref={ref} className='tw:flex tw:gap-3 tw:mb-4'>
      <span className='tw:font-bold tw:text-base tw:min-w-12 tw:text-right tw:text-slate-700 tw:dark:text-slate-300'>
        {floorItem.floor}
      </span>
      <div className='tw:flex tw:flex-wrap tw:gap-3'>
        {inView &&
          floorItem.songItems.map((songItem) => (
            <ScorePopupComponent
              key={`song_${songItem.title}_${floorItem.floor}`}
              songTitle={songItem.title}
              keyMode={keyMode}
              isVisibleCode={true}
            />
          ))}
      </div>
    </div>
  )
})

LazyFloorItem.displayName = 'LazyFloorItem'

const DmrvHardGradePage = () => {
  const { songData, selectedGame } = useSelector((state: RootState) => state.app)

  const [keyMode, setKeyMode] = useState<string>('4')
  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const processGradeData = useCallback(() => {
    const currentGradeData = gradeTableMap[keyMode]

    // songData를 기반으로 하고 name으로 매칭
    const processedData = songData[selectedGame]
      .map((song) => {
        const gradeItem = currentGradeData.find(
          (item) => item.name === song.name && item.keyMode === keyMode,
        )

        if (!gradeItem) return null

        const patternButton = song.patterns[keyMode + 'B']
        if (!patternButton || !patternButton[gradeItem.pattern]) return null

        return {
          title: song.title, // 원본 title ID
          hardArchiveTitle: song.hardArchiveTitle,
          name: song.name,
          composer: song.composer,
          dlcCode: song.dlcCode,
          dlc: song.dlc,
          pattern: gradeItem.pattern,
          level: patternButton[gradeItem.pattern].level,
          floor: gradeItem.floor,
          rating: patternButton[gradeItem.pattern].rating || null,
          patterns: song.patterns,
        }
      })
      .filter(Boolean) // null 제거

    // floor 기준으로 그룹화 및 정렬
    const groupedByFloor = processedData.reduce((acc, item) => {
      const floor = item.floor
      if (!acc[floor]) {
        acc[floor] = []
      }
      acc[floor].push(item)
      return acc
    }, {})

    setBaseSongData([
      {
        level: 0,
        floorItems: Object.entries(groupedByFloor)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([floor, songs]) => ({
            floor: Number(floor),
            songItems: sortByName(songs as any[]),
          })),
      },
    ])

    setIsLoading(false)
  }, [songData, selectedGame, keyMode])

  useEffect(() => {
    if (songData[selectedGame].length > 0) {
      processGradeData()
    }
  }, [songData, keyMode, processGradeData])

  return (
    <React.Fragment>
      <div id='ContentHeader' />
      <div className='tw:flex tw:gap-4'>
        <div className='tw:flex tw:flex-col tw:w-full tw:relative'>
          {/* 상단 설명 섹션 */}
          <div className='tw:flex tw:gap-4'>
            <div className='tw:flex tw:flex-col tw:gap-4 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:shadow-lg tw:p-6 tw:mb-4 tw:flex-1 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
              <div className='tw:flex tw:w-full tw:items-end tw:justify-between'>
                <span className='tw:text-xl tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                  하드 판정 서열표
                </span>
                <div className='tw:grid tw:grid-cols-4 tw:gap-3 tw:h-full'>
                  {['4', '5', '6', '8'].map((value) => (
                    <button
                      key={`keyModeSelector_${value}`}
                      onClick={() => {
                        setKeyMode(value)
                        setBaseSongData([])
                        setIsLoading(true)
                      }}
                      className={
                        'tw:flex tw:items-center tw:justify-center tw:relative tw:px-4 tw:py-0.5 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-md tw:flex-1 ' +
                        (keyMode === value
                          ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
                          : 'tw:border-slate-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100')
                      }
                      disabled={isLoading || keyMode === value}
                    >
                      <div
                        className={`tw:absolute tw:w-full tw:h-full tw:opacity-30 respect_bg_b${value}`}
                      />
                      <div className='tw:relative tw:flex tw:flex-col tw:items-center tw:gap-1'>
                        <span className='tw:text-base tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                          {value}B
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 곡 목록 표시 */}
          <div className='tw:flex tw:flex-col tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-md tw:px-4 tw:py-6 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
            {!isLoading ? (
              baseSongData[0].floorItems.map((floorItem) => (
                <LazyFloorItem
                  key={`floor_${floorItem.floor}`}
                  floorItem={floorItem}
                  keyMode={keyMode}
                />
              ))
            ) : (
              <div className='tw:flex tw:justify-center tw:h-[calc(100vh-400px)] tw:items-center'>
                <PuffLoader color='#6366f1' size={32} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div id='ContentFooter' />
    </React.Fragment>
  )
}

export default DmrvHardGradePage
