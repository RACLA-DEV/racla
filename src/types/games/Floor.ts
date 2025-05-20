import { BoardPatternInfo, SongData } from './SongData'

export interface Floor {
  floorNumber: number
  patterns: BoardPatternInfo[]
}

export interface FloorSongDataItem {
  floor: number
  songItems: SongData[]
}

export interface FloorSongData {
  level: number
  floorItems: FloorSongDataItem[]
}
