export interface SettingItem {
  id: string
  name: string
  description: string
  defaultValue: string | number | boolean
  isEditable: boolean
  requiresRestart: boolean
  selectList?: { id: string | number; name: string }[]
  isFile?: boolean
  isVisible?: boolean
  offList?: string[]
}
