export interface JudgementDisplay {
  text: 'PERFECT_PLUS' | 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS'
  timestamp: number
  id: string
}

export type KeyState = {
  [key: string]: boolean
}
