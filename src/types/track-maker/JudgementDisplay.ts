export interface JudgementDisplay {
  text: 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS'
  timestamp: number
  id: string
}

export type KeyState = {
  [key: string]: boolean
}
