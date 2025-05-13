export interface JudgementDisplay {
  text: 'PERFECT_PLUS' | 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS'
  timestamp: number
  id: string
}

export interface KeyState {
  [key: string]: boolean
}
