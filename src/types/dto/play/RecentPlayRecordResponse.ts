export interface RecentPlayRecordResponse {
  historyId: number
  playedAt: number
  playedAtISO: string
  score: number
  maxCombo: boolean
  judgementType: string

  // 게임 정보
  gameCode: string

  // 패턴 정보
  keyType: string
  difficultyType: string
  level: number
  floor: number

  // 곡 정보
  songId: number
  songName: string
  composer: string
  dlcCode: string
  dlc: string
  folderName: string
  max: number
}
