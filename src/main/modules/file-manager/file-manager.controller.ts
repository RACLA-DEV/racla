import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller, Logger } from '@nestjs/common'
import { dialog } from 'electron'
import type { SessionData, SettingsData, StorageInfo } from './file-manager.service'
import { FileManagerService } from './file-manager.service'

@Controller()
export class FileManagerController {
  private readonly logger = new Logger(FileManagerController.name)
  constructor(private readonly fileManagerService: FileManagerService) {}

  @IpcHandle('file-manager:save-settings')
  async saveSettings(settings: SettingsData): Promise<SettingsData> {
    return this.fileManagerService.saveSettings(settings)
  }

  @IpcHandle('file-manager:load-settings')
  async loadSettings(): Promise<SettingsData> {
    return this.fileManagerService.loadSettings()
  }

  @IpcHandle('file-manager:save-session')
  async saveSession(session: SessionData): Promise<SessionData> {
    return this.fileManagerService.saveSession(session)
  }

  @IpcHandle('file-manager:load-session')
  async loadSession(): Promise<SessionData> {
    return this.fileManagerService.loadSession()
  }

  @IpcHandle('file-manager:clear-session')
  async clearSession(): Promise<void> {
    return this.fileManagerService.clearSession()
  }

  @IpcHandle('file-manager:save-song-data')
  async saveSongData(data: { gameCode: string; songData: any[] }): Promise<boolean> {
    try {
      const { gameCode, songData } = data
      this.logger.log(`곡 데이터 저장 요청 - 게임 코드: ${gameCode}`)
      this.logger.log(
        `songData 타입: ${typeof songData}, 배열 여부: ${Array.isArray(songData)}, 길이: ${songData?.length || 0}`,
      )

      if (!Array.isArray(songData)) {
        this.logger.error(`잘못된 songData 형식: ${typeof songData}`)
        return false
      }

      this.fileManagerService.saveSongData(songData, gameCode)
      return true
    } catch (error) {
      this.logger.error('곡 데이터 저장 실패:', error)
      return false
    }
  }

  @IpcHandle('file-manager:load-song-data')
  async loadSongData(gameCode: string): Promise<any[]> {
    return this.fileManagerService.loadSongData(gameCode)
  }

  @IpcHandle('file-manager:get-storage-info')
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      return await this.fileManagerService.getStorageInfo()
    } catch (error) {
      this.logger.error('스토리지 정보 조회 실패:', error)
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

  @IpcHandle('file-manager:open-folder')
  async openFolder(folderType: 'documents' | 'pictures' | 'logs' | 'appData'): Promise<boolean> {
    try {
      return this.fileManagerService.openFolder(folderType)
    } catch (error) {
      this.logger.error(`폴더 열기 실패 (${folderType}):`, error)
      return false
    }
  }

  @IpcHandle('file-manager:get-folder-paths')
  async getFolderPaths() {
    return this.fileManagerService.getFolderPaths()
  }

  @IpcHandle('file-manager:clear-all-logs')
  async clearAllLogs() {
    return this.fileManagerService.clearAllLogs()
  }

  @IpcHandle('file-manager:open-file-dialog')
  async openFileDialog(options: {
    title?: string
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }): Promise<string | null> {
    try {
      const result = await dialog.showOpenDialog({
        title: options.title || '파일 선택',
        defaultPath: options.defaultPath,
        filters: options.filters || [{ name: '모든 파일', extensions: ['*'] }],
        properties: ['openFile'],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return result.filePaths[0]
    } catch (error) {
      this.logger.error('파일 선택 다이얼로그 오류:', error)
      return null
    }
  }
}
