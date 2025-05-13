export interface ApiArchiveNicknameBoard {
  success: boolean
  board: string
  button: string
  totalCount: number
  floors: {
    floorNumber: number
    patterns: {
      title: number
      name: string
      composer: string
      pattern: string
      score: number | null
      maxCombo: number | null
      djpower: number
      rating: number
      dlc: string
      dlcCode: string
    }[]
  }[]
}
