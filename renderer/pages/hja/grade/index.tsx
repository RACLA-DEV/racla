import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import HjaScorePopupComponent from '@/components/score/HjaScorePopupComponent'
import { getGradeTableData } from '@/libs/client/hjaGradeParser'
import Head from 'next/head'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'

interface SongItem {
  title: number
  name: string
  composer: string
  dlcCode: string
  dlc: string
  pattern: string
  level: number
  floor: number | null
  rating: number | null
}

// 서열표 데이터 타입 정의
interface GradeTableItem {
  name: string
  keyMode: string
  pattern: string
  level: number
  floor: number
  dlc: string
}

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

export default function HjaGradePage() {
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)
  const router = useRouter()
  const params = useParams()
  const dispatch = useDispatch()
  const { songData, userData, vArchiveUserData } = useSelector((state: RootState) => state.app)

  const [keyMode, setKeyMode] = useState<string>('4')
  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const processGradeData = () => {
    const currentGradeData = gradeTableMap[keyMode]

    // songData를 기반으로 하고 name으로 매칭
    const processedData = songData
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
  }

  useEffect(() => {
    if (songData.length > 0) {
      processGradeData()
    }
  }, [songData, keyMode])

  return (
    <React.Fragment>
      <Head>
        <title>{String(keyMode)}B 하드 판정 서열표 - RACLA</title>
      </Head>

      <div id='ContentHeader' />
      <div className='tw-flex tw-gap-4'>
        <div className='tw-flex tw-flex-col tw-w-full tw-relative'>
          {/* 상단 설명 섹션 */}
          <div className='tw-flex tw-gap-4'>
            <div className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-4 tw-flex-1'>
              <div className='tw-flex tw-w-full tw-items-end tw-justify-between'>
                <span className='tw-text-xl tw-font-bold tw-text-white'>🛝 하드 판정 서열표</span>
              </div>
              <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2 tw-mb-auto'>
                <p className='tw-leading-relaxed'>
                  2023년 12월 04일 기준 전일 아카이브의 '하드 판정 서열표'로 작성되었습니다.
                </p>
              </div>
            </div>

            {/* 키 선택 필터 */}
            <div
              className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-4'
              style={{ width: '520px' }}
            >
              <div className='tw-flex tw-w-full tw-items-end tw-mb-2'>
                <span className='tw-text-xl tw-font-bold tw-text-white'>필터</span>
              </div>
              <div className='tw-grid tw-grid-cols-4 tw-gap-3 tw-h-full'>
                {['4', '5', '6', '8'].map((value) => (
                  <button
                    key={`keyModeSelector_${value}`}
                    onClick={() => {
                      setKeyMode(value)
                      setBaseSongData([])
                      setIsLoading(true)
                    }}
                    className={
                      'tw-flex tw-items-center tw-justify-center tw-relative tw-h-full tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-border-gray-600 tw-rounded-sm hover:tw-border-blue-400 ' +
                      (keyMode === value
                        ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                        : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100')
                    }
                    disabled={isLoading || keyMode === value}
                  >
                    <div
                      className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 respect_bg_b${value}`}
                    />
                    <div className='tw-relative tw-flex tw-flex-col tw-items-center tw-gap-1'>
                      <span className='tw-text-lg tw-font-bold'>{value}B</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 곡 목록 표시 */}
          <div className='tw-flex tw-flex-col tw-gap-1 tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-md p-4'>
            {!isLoading ? (
              baseSongData[0].floorItems.map((floorItem) => (
                <div key={`floor_${floorItem.floor}`} className='tw-flex tw-gap-3 tw-mb-4'>
                  <span className='tw-font-bold tw-text-base tw-min-w-12 tw-text-right'>
                    {floorItem.floor}
                  </span>
                  <div className='tw-flex tw-flex-wrap tw-gap-3'>
                    {floorItem.songItems.map((songItem) => (
                      <>
                        <HjaScorePopupComponent
                          key={`song_${songItem.titleId}_${songItem.pattern}`}
                          songItem={songItem}
                          keyMode={keyMode}
                          isScored={false}
                          isVisibleCode={true}
                          isFlatten={true}
                        />
                      </>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className='tw-flex tw-justify-center tw-h-[calc(100vh-400px)] tw-items-center'>
                <SyncLoader color='#ffffff' size={8} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div id='ContentFooter' />
    </React.Fragment>
  )
}
