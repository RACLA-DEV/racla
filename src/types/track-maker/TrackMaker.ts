export type KeyMode = '4B' | '5B' | '6B' | '8B'

export type NoteType = 'normal' | 'fx' | 'lr' | 'enter'

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
