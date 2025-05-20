export interface ScoreEditModalProps {
  gameCode?: string
  show: boolean
  onHide: () => void
  patternMaxCombo: boolean
  setPatternMaxCombo: (value: boolean) => void
  updateScore: number
  setUpdateScore: (value: number) => void
  updateMax?: number
  setUpdateMax?: (value: number) => void
  onSave: () => void
}
