import React, { useCallback } from 'react'
import { FixedSizeGrid } from 'react-window'
import { useWindowSize } from '@/libs/client/useWindowSize'
import ScorePopupComponent from '../score/ScorePopupComponent'

interface VirtualizedSongListProps {
  items: any[]
  keyMode: string
  isScored: boolean
}

export default function VirtualizedSongList({ items, keyMode, isScored }: VirtualizedSongListProps) {
  const { width: windowWidth, height: windowHeight } = useWindowSize()
  const COLUMN_WIDTH = 120
  const ROW_HEIGHT = 120
  const PADDING = 48
  const COLUMN_COUNT = Math.floor((windowWidth - PADDING) / COLUMN_WIDTH) || 6
  const ROW_COUNT = Math.ceil(items.length / COLUMN_COUNT)

  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * COLUMN_COUNT + columnIndex
    const item = items[index]
    
    if (!item) return null

    return (
      <div style={style} className="tw-p-2">
        <ScorePopupComponent
          songItem={item}
          songItemTitle={item.title}
          keyMode={keyMode}
          isScored={isScored}
          isVisibleCode={true}
          size={80}
        />
      </div>
    )
  }, [items, keyMode, isScored, COLUMN_COUNT])

  return (
    <FixedSizeGrid
      columnCount={COLUMN_COUNT}
      columnWidth={COLUMN_WIDTH}
      height={windowHeight - 200}
      rowCount={ROW_COUNT}
      rowHeight={ROW_HEIGHT}
      width={COLUMN_COUNT * COLUMN_WIDTH}
      className="tw-mx-auto"
    >
      {Cell}
    </FixedSizeGrid>
  )
}
