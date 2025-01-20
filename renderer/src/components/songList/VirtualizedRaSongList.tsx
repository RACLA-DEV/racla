import { useCallback } from 'react'

import { useWindowSize } from '@/libs/client/useWindowSize'
import { FixedSizeGrid } from 'react-window'
import RaScorePopupComponent from '../score/RaScorePopupComponent'

interface VirtualizedRaSongListProps {
  items: any[]
  keyMode: string
  viewMode: 'grid' | 'list'
  judgementType?: string
}

export default function VirtualizedRaSongList({
  items,
  keyMode,
  viewMode,
  judgementType,
}: VirtualizedRaSongListProps) {
  const { width: windowWidth, height: windowHeight } = useWindowSize()
  const COLUMN_WIDTH = 150 // 120에서 130으로 증가
  const ROW_HEIGHT = 90 // 120에서 90으로 감소
  const PADDING = 48
  const COLUMN_COUNT = Math.floor((windowWidth - PADDING) / COLUMN_WIDTH) || 6
  const ROW_COUNT = Math.ceil(items.length / COLUMN_COUNT)

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }) => {
      const index = rowIndex * COLUMN_COUNT + columnIndex
      const item = items[index]

      if (!item || viewMode !== 'grid') return null

      return (
        <div style={style} className='tw-p-2'>
          <RaScorePopupComponent
            key={item.title}
            songItem={item}
            songItemTitle={item.title}
            keyMode={keyMode.replace('P', '')}
            isVisibleCode={true}
            judgementType={keyMode.includes('P') ? '1' : '0'}
            size={80}
          />
        </div>
      )
    },
    [items, keyMode, viewMode, COLUMN_COUNT],
  )

  if (viewMode !== 'grid') return null

  return (
    <FixedSizeGrid
      columnCount={COLUMN_COUNT}
      columnWidth={COLUMN_WIDTH}
      height={windowHeight - 200}
      rowCount={ROW_COUNT}
      rowHeight={ROW_HEIGHT}
      width={COLUMN_COUNT * COLUMN_WIDTH}
      className='tw-pr-4'
    >
      {Cell}
    </FixedSizeGrid>
  )
}
