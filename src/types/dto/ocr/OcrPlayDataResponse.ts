import { SongData } from '@src/types/games/SongData'

export interface OcrPlayDataBase {
  isVerified: boolean
  isVarchiveUpdated: boolean
  screenType: string
  gameCode: string
  button: number
  speed: number
  pattern: string
  level: number
  judgementType: string
  score: number
  lastScore: number
  maxCombo: boolean
  max: number
  songData: SongData
}

export interface OcrPlayerDataResponse extends OcrPlayDataBase {
  versusData: OcrPlayDataBase[]
  collectionData: OcrPlayDataBase[]
}
