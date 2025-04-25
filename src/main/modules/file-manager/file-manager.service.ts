import { Injectable, Logger } from '@nestjs/common'
import type { SessionData } from '@src/types/common/SessionData'
import type { SettingsData } from '@src/types/common/SettingData'
import type { StorageInfo } from '@src/types/common/StroageInfo'
import { app, shell } from 'electron'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { globalDictionary } from '../../../render/constants/globalDictionary'

// globalDictionary의 기본값을 사용하여 기본 설정 생성
function createDefaultSettings(): SettingsData {
  const settingDict = globalDictionary.settingDictionary
  const defaultSettings: SettingsData = {
    theme: 'light',
    sidebarCollapsed: false,
  }

  // settingDictionary의 모든 설정 항목을 기본 설정으로 추가
  Object.entries(settingDict).forEach(([key, setting]) => {
    defaultSettings[key] = setting.defaultValue
  })

  return defaultSettings
}

const defaultSettings: SettingsData = createDefaultSettings()

const defaultSession: SessionData = {
  userNo: '',
  userToken: '',
  userName: '',
  vArchiveUserNo: null,
  vArchiveUserToken: '',
  vArchiveUserName: '',
  discordUid: '',
  discordLinked: false,
  vArchiveLinked: false,
}

@Injectable()
export class FileManagerService {
  private documentsPath: string
  private picturesPath: string
  private logsPath: string
  private appDataPath: string
  private logger = new Logger(FileManagerService.name)
  private imageCleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.documentsPath = path.join(app.getPath('documents'), 'RACLA')
    this.picturesPath = path.join(app.getPath('pictures'), 'RACLA')
    this.logsPath = path.join(
      !app.isPackaged ? app.getAppPath() : app.getPath('exe').split('\\').slice(0, -1).join('\\'),
      'logs',
    )
    this.appDataPath = app.getPath('userData')

    this.ensureDirectoryExists(this.documentsPath)
    this.ensureDirectoryExists(this.picturesPath)
    this.ensureDirectoryExists(this.logsPath)

    // 앱 시작 시 설정에 따라 이미지 자동 삭제 스케줄러 시작
    this.initImageCleanupScheduler()
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  public saveSettings(settings: SettingsData): SettingsData {
    try {
      const settingsPath = path.join(this.documentsPath, 'settings.json')
      const mergedSettings = { ...defaultSettings, ...settings }
      fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2), 'utf-8')

      // 자동 삭제 설정이 변경되었다면 스케줄러 업데이트
      this.initImageCleanupScheduler()

      return mergedSettings
    } catch (error) {
      this.logger.error('설정 파일 저장 오류:', error)
      return settings
    }
  }

  public loadSettings(): SettingsData {
    const settingsPath = path.join(this.documentsPath, 'settings.json')

    if (!fs.existsSync(settingsPath)) {
      this.saveSettings(defaultSettings)
      return defaultSettings
    }

    try {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8')
      const loadedSettings = JSON.parse(settingsData) as SettingsData

      // 새로운 설정이 추가되었을 때 기본값으로 자동 업데이트
      const updatedSettings = { ...defaultSettings, ...loadedSettings }

      // 설정 파일이 변경되었다면 저장
      if (JSON.stringify(loadedSettings) !== JSON.stringify(updatedSettings)) {
        this.saveSettings(updatedSettings)
      }

      return updatedSettings
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

  /**
   * 시스템 스토리지 정보와 RACLA가 사용하는 저장 공간 정보를 반환합니다.
   */
  public async getStorageInfo(): Promise<StorageInfo> {
    try {
      // OS별 시스템 드라이브 정보
      const homeDir = os.homedir()
      const rootPath = path.parse(homeDir).root

      // 앱 데이터 폴더 크기 계산
      const appDataSize = this.getFolderSize(this.documentsPath)

      // 이미지 폴더 크기 계산
      const imageDataSize = this.getFolderSize(this.picturesPath)

      // 로그 폴더 크기 계산
      const logDataSize = this.getFolderSize(this.logsPath)

      // OS 정보를 이용해 디스크 정보 추정
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const used = totalMem - freeMem
      const usedPercentage = Math.round((used / totalMem) * 100)

      return {
        total: totalMem,
        free: freeMem,
        used,
        usedPercentage,
        appDataSize,
        imageDataSize,
        logDataSize,
      }
    } catch (error) {
      this.logger.error('스토리지 정보 조회 오류:', error)
      return {
        total: 0,
        free: 0,
        used: 0,
        usedPercentage: 0,
        appDataSize: 0,
        imageDataSize: 0,
        logDataSize: 0,
      }
    }
  }

  /**
   * 지정된 폴더의 크기를 반환합니다.
   */
  private getFolderSize(folderPath: string): number {
    if (!fs.existsSync(folderPath)) return 0

    let size = 0

    try {
      const files = fs.readdirSync(folderPath)

      for (const file of files) {
        const filePath = path.join(folderPath, file)
        const stats = fs.statSync(filePath)

        if (stats.isDirectory()) {
          size += this.getFolderSize(filePath)
        } else {
          size += stats.size
        }
      }
    } catch (error) {
      this.logger.error(`폴더 크기 계산 오류 (${folderPath}):`, error)
    }

    return size
  }

  /**
   * 파일 탐색기에서 지정된 폴더를 엽니다.
   */
  public openFolder(folderType: 'documents' | 'pictures' | 'logs' | 'appData'): boolean {
    try {
      let folderPath: string

      switch (folderType) {
        case 'documents':
          folderPath = this.documentsPath
          break
        case 'pictures':
          folderPath = this.picturesPath
          break
        case 'logs':
          folderPath = this.logsPath
          break
        case 'appData':
          folderPath = this.appDataPath
          break
        default:
          return false
      }

      this.ensureDirectoryExists(folderPath)
      shell.openPath(folderPath)
      return true
    } catch (error) {
      this.logger.error(`폴더 열기 오류 (${folderType}):`, error)
      return false
    }
  }

  /**
   * RACLA 관련 폴더 경로 정보를 반환합니다.
   */
  public getFolderPaths() {
    return {
      documents: this.documentsPath,
      pictures: this.picturesPath,
      logs: this.logsPath,
      appData: this.appDataPath,
    }
  }

  /**
   * 로그 파일을 모두 삭제합니다.
   */
  public clearAllLogs(): boolean {
    try {
      if (!fs.existsSync(this.logsPath)) {
        return true
      }

      const files = fs.readdirSync(this.logsPath)

      for (const file of files) {
        const filePath = path.join(this.logsPath, file)
        // 디렉토리가 아닌 파일만 삭제
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath)
        }
      }

      this.logger.log('모든 로그 파일이 삭제되었습니다.')
      return true
    } catch (error) {
      this.logger.error('로그 파일 삭제 중 오류 발생:', error)
      return false
    }
  }

  /**
   * 설정에 따라 오래된 캡처 이미지를 삭제합니다.
   * @param days 삭제할 이미지의 기준 일수 (예: 30일 이상 된 이미지 삭제)
   */
  public cleanupOldCapturedImages(days: number): number {
    this.logger.log(`캡처 이미지 삭제 시도: ${days}일 이상 된 이미지 삭제`)
    if (days <= 0) return 0

    try {
      if (!fs.existsSync(this.picturesPath)) {
        return 0
      }

      const files = fs.readdirSync(this.picturesPath)
      const now = new Date()
      let deletedCount = 0

      for (const file of files) {
        const filePath = path.join(this.picturesPath, file)

        // 파일만 처리
        if (fs.statSync(filePath).isFile()) {
          const stats = fs.statSync(filePath)
          const fileDate = new Date(stats.mtime)
          const diffTime = Math.abs(now.getTime() - fileDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          // 설정된 일수보다 오래된 파일 삭제
          if (diffDays > days) {
            fs.unlinkSync(filePath)
            deletedCount++
          }
        }
      }

      if (deletedCount > 0) {
        this.logger.log(`${days}일 이상 된 캡처 이미지 ${deletedCount}개가 삭제되었습니다.`)
      }

      return deletedCount
    } catch (error) {
      this.logger.error('오래된 캡처 이미지 삭제 중 오류 발생:', error)
      return 0
    }
  }

  /**
   * 설정 변경 시 이미지 정리 스케줄러를 초기화합니다.
   */
  public initImageCleanupScheduler(): void {
    // 기존 인터벌 제거
    if (this.imageCleanupInterval) {
      clearInterval(this.imageCleanupInterval)
      this.imageCleanupInterval = null
    }

    // 설정 로드
    const settings = this.loadSettings()
    const autoDeleteDays = settings.autoDeleteCapturedImages || 0

    // 자동 삭제 설정이 활성화된 경우에만 스케줄러 시작
    if (autoDeleteDays > 0) {
      // 24시간마다 실행 (1일 = 24 * 60 * 60 * 1000 밀리초)
      this.imageCleanupInterval = setInterval(
        () => {
          this.cleanupOldCapturedImages(autoDeleteDays)
        },
        24 * 60 * 60 * 1000,
      )

      // 초기 실행
      this.cleanupOldCapturedImages(autoDeleteDays)

      this.logger.log(
        `이미지 자동 삭제 스케줄러가 활성화되었습니다: ${autoDeleteDays}일 이상 된 이미지 삭제`,
      )
    }
  }
}
