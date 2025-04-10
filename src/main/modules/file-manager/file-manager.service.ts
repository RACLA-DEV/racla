import { Injectable } from '@nestjs/common'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface SettingsData {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  // 여기에 추가 설정 추가
}

const defaultSettings: SettingsData = {
  theme: 'light',
  sidebarCollapsed: false,
}

@Injectable()
export class FileManagerService {
  private documentsPath: string

  constructor() {
    this.documentsPath = path.join(app.getPath('documents'), 'RACLA')
    this.ensureDirectoryExists(this.documentsPath)
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  public saveSettings(settings: SettingsData): SettingsData {
    const settingsPath = path.join(this.documentsPath, 'settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    return settings
  }

  public loadSettings(): SettingsData {
    const settingsPath = path.join(this.documentsPath, 'settings.json')

    if (!fs.existsSync(settingsPath)) {
      this.saveSettings(defaultSettings)
      return defaultSettings
    }

    try {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8')
      return JSON.parse(settingsData) as SettingsData
    } catch (error) {
      console.error('설정 파일 읽기 오류:', error)
      return defaultSettings
    }
  }
}
