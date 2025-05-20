export interface HardArchiveRecord {
  nickname?: string
  max_combo?: boolean
  rate?: number
  score?: number
}

export interface HardArchiveRecordResponse {
  code: string
  data: HardArchiveRecord[]
}

export interface PatternRecord {
  hard: HardArchiveRecord | null
  max: HardArchiveRecord | null
}

export interface Pattern {
  button: string
  level: string
  type: 'MX' | 'SC'
}
