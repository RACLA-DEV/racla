export interface SettingItem {
  id: string
  name: string
  description: string
  defaultValue: any
  isEditable: boolean
  requiresRestart: boolean
  selectList?: Array<{ id: string | number; name: string }>
  isFile?: boolean
  isVisible?: boolean
  offList?: string[]
}
