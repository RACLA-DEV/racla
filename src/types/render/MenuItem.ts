export interface MenuItem {
  id: string
  icon: string
  path: string
  isExternal?: boolean
  subItems?: MenuItem[]
}
