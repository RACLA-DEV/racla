import { NavigateFunction } from 'react-router-dom'
import { SongData } from '../games/SongData'

export interface LazySongListItemProps {
  songItem: SongData
  keyMode: string
  navigate: NavigateFunction
  selectedLevel?: string
  showPlusOnly?: boolean

  // 배경색 관련 프롭 - 선택적으로 사용
  hoveredTitle?: string | null
  handleMouseEnter?: (songItem: SongData) => void
  handleMouseLeave?: () => void
  showNotification?: (
    message: {
      mode: 'string' | 'i18n'
      ns?: string
      value: string
      props?: Record<string, string>
    },
    type?: 'success' | 'error' | 'info' | 'warning',
    duration?: number,
  ) => void
}
