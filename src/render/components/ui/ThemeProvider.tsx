import { RootState } from '@render/store'
import type { ChildrenReactNodeProps } from '@src/types/render/ChildrenReactNodeProps'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

export const ThemeProvider: React.FC<ChildrenReactNodeProps> = ({ children }) => {
  const { theme } = useSelector((state: RootState) => state.ui)
  const fontSetting = useSelector((state: RootState) => state.app.settingData?.font)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    if (fontSetting) {
      root.classList.remove('font-default')
      root.classList.remove('font-platina_lab')
      root.classList.add(`font-${fontSetting}`)
    }
  }, [fontSetting])

  return <>{children}</>
}
