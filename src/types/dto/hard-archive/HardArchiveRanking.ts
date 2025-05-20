export interface HardArchiveScore {
  a?: number
  b?: number
  c?: number
  count?: number
}

export interface TotalRankingEntry {
  nickname: string
  rank: number
  score: HardArchiveScore
}

export interface HardRankingEntry {
  nickname: string
  rank: number
  count: number
}

export interface TotalRankingData {
  renew_time: number
  chart: TotalRankingEntry[]
}

export interface HardRankingData {
  renew_time: number
  chart: HardRankingEntry[]
}

export interface HardRankingResponse {
  data: HardRankingData
  code: string
}

export interface TotalRankingResponse {
  data: TotalRankingData
  code: string
}

export interface MergedRankingEntry {
  nickname: string
  rank: number
  score?: HardArchiveScore
  count?: number
  subRank?: number
  subScore?: HardArchiveScore
}

export interface RankingEntry {
  nickname: string
  score: number
  rate: number
  max_combo: boolean
}

export interface RankingData {
  code: string
  data: RankingEntry[]
}

export type RankingType = 'hard' | 'total'
