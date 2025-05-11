export type KeyMode = '4B' | '5B' | '6B' | '8B'

export type NoteType = 'normal' | 'fx' | 'lr' | 'enter'

export type DifficultyType = 'EASY' | 'NORMAL' | 'HARD' | 'MAXIMUM'

export interface Note {
  id: string
  type: NoteType
  lane: number
  time: number // milliseconds
  isLong: boolean
  endTime?: number // for long notes
}

export interface Pattern {
  id: string
  notes: Note[]
  bpm: number
  keyMode: KeyMode
  name: string
}

export interface TrackMakerProps {
  pattern: Note[]
  onPatternChange: (pattern: Note[]) => void
  bpm: number
  onBpmChange: (bpm: number) => void
  keyMode: KeyMode
  onKeyModeChange: (keyMode: KeyMode) => void
}

export interface TrackPlayerProps {
  pattern: Note[]
  bpm: number
  keyMode: KeyMode
}

export interface PatternDTO {
  id: number
  songId: number
  songName: string
  playerId: number
  playerName: string
  name: string
  keyMode: KeyMode
  difficultyType: DifficultyType
  bpm: number
  activeDivision: number
  notes: Note[]
  isPublic: boolean
  likeCount: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
}

export interface PatternPageResponse {
  content: PatternDTO[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
