import { globalDictionary } from '../renderer/src/libs/server/globalDictionary'
import { getSettingData, storeSettingData } from './fsManager'

export const settingsManager = {
  // 초기 설정값 생성
  getDefaultSettings() {
    const defaultSettings = {}
    Object.entries(globalDictionary.settings.defaultSettings).forEach(([key, setting]) => {
      defaultSettings[key] = setting.defaultValue
    })
    return defaultSettings
  },

  // 설정 초기화
  async initializeSettings() {
    const currentSettings = await getSettingData()
    if (!currentSettings) {
      // 설정 파일이 없는 경우 기본값으로 생성
      await storeSettingData(this.getDefaultSettings())
      return
    }

    // 새로운 설정 항목이 있는지 확인하고 추가
    const defaultSettings = this.getDefaultSettings()
    let hasNewSettings = false

    // defaultSettings의 모든 키를 순회하면서 currentSettings에 없는 키가 있는지 확인
    Object.entries(defaultSettings).forEach(([key, value]) => {
      if (currentSettings[key] === undefined) {
        currentSettings[key] = value
        hasNewSettings = true
        console.log(`New setting added: ${key} = ${value}`)
      }
    })

    // 새로운 설정이 추가된 경우에만 파일 업데이트
    if (hasNewSettings) {
      await storeSettingData(currentSettings)
      console.log('Settings file updated with new settings')
    }
  },

  // 설정 업데이트
  async updateSettings(newSettings: Partial<any>) {
    const currentSettings = await getSettingData()
    const updatedSettings = { ...currentSettings, ...newSettings }

    // 설정 유효성 검사
    Object.entries(newSettings).forEach(([key, value]) => {
      const settingDef = globalDictionary.settings.defaultSettings[key]
      if (settingDef && !settingDef.isEditable) {
        delete updatedSettings[key]
      }
    })

    await storeSettingData(updatedSettings)
    return updatedSettings
  },

  // 설정이 재시작이 필요한지 확인
  requiresRestart(changedSettings: string[]) {
    return changedSettings.some(
      (key) => globalDictionary.settings.defaultSettings[key]?.requiresRestart,
    )
  },
}
