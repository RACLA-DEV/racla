import { Injectable, Logger } from '@nestjs/common'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface SettingsData {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  // 여기에 추가 설정 추가
}

export interface SessionData {
  userNo?: string
  userToken?: string
  userName?: string
  vArchiveUserNo?: string
  vArchiveUserToken?: string
  vArchiveUserName?: string
  discordUid?: string
  discordLinked?: boolean
  vArchiveLinked?: boolean
}

const defaultSettings: SettingsData = {
  theme: 'light',
  sidebarCollapsed: false,
}

const defaultSession: SessionData = {
  userNo: '',
  userToken: '',
  userName: '',
  vArchiveUserNo: '',
  vArchiveUserToken: '',
  vArchiveUserName: '',
  discordUid: '',
  discordLinked: false,
  vArchiveLinked: false,
}

@Injectable()
export class FileManagerService {
  private documentsPath: string
  private logger = new Logger(FileManagerService.name)

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
      this.logger.error('설정 파일 읽기 오류:', error)
      return defaultSettings
    }
  }

  public saveSession(session: SessionData): SessionData {
    const sessionPath = path.join(this.documentsPath, 'sessions.json')
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf-8')
    return session
  }

  public loadSession(): SessionData {
    const sessionPath = path.join(this.documentsPath, 'sessions.json')

    if (!fs.existsSync(sessionPath)) {
      return defaultSession
    }

    try {
      const sessionData = fs.readFileSync(sessionPath, 'utf-8')
      return JSON.parse(sessionData) as SessionData
    } catch (error) {
      this.logger.error('세션 파일 읽기 오류:', error)
      return defaultSession
    }
  }

  public clearSession(): void {
    const sessionPath = path.join(this.documentsPath, 'sessions.json')
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath)
    }
  }

  public saveSongData(songData: any[], gameCode: string): void {
    try {
      if (!songData || !Array.isArray(songData)) {
        this.logger.error(`songData가 유효하지 않음: ${typeof songData}`)
        return
      }

      if (!gameCode || typeof gameCode !== 'string') {
        this.logger.error(`gameCode가 유효하지 않음: ${gameCode}`)
        return
      }

      this.logger.log(`${gameCode} 곡 데이터 저장 시도: 항목 ${songData.length}개`)

      const dataPath = path.join(this.documentsPath, `${gameCode}_songs.json`)
      fs.writeFileSync(dataPath, JSON.stringify(songData, null, 2), 'utf-8')

      this.logger.log(`${gameCode} 곡 데이터 저장 완료: ${dataPath}`)
    } catch (error) {
      this.logger.error(`${gameCode} 곡 데이터 저장 실패:`, error)
    }
  }

  public loadSongData(gameCode: string): any[] {
    const dataPath = path.join(this.documentsPath, `${gameCode}_songs.json`)

    if (!fs.existsSync(dataPath)) {
      return []
    }

    try {
      const songData = fs.readFileSync(dataPath, 'utf-8')
      return JSON.parse(songData) as any[]
    } catch (error) {
      this.logger.error(`${gameCode} 곡 데이터 파일 읽기 오류:`, error)
      return []
    }
  }
}
