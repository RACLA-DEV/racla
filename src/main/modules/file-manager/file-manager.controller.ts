import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller, Logger } from '@nestjs/common'
import { SongData } from '@src/types/games/SongData'
import type { LocalSessionData } from '@src/types/sessions/LocalSessionData'
import type { SettingsData } from '@src/types/settings/SettingData'
import type { StorageInfo } from '@src/types/storage/StroageInfo'
import { dialog } from 'electron'
import { OverlayWindowService } from '../overlay-window/overlay-window.service'
import { FileManagerService } from './file-manager.service'

@Controller()
export class FileManagerController {
  private readonly logger = new Logger(FileManagerController.name)
  constructor(
    private readonly fileManagerService: FileManagerService,
    private readonly overlayWindowService: OverlayWindowService,
  ) {}

  @IpcHandle('file-manager:save-settings')
  saveSettings(settings: SettingsData): SettingsData {
    const savedSettings = this.fileManagerService.saveSettings(settings)
    this.overlayWindowService.updateSettings(savedSettings)
    return savedSettings
  }

  @IpcHandle('file-manager:load-settings')
  loadSettings(): SettingsData {
    return this.fileManagerService.loadSettings()
  }

  @IpcHandle('file-manager:save-session')
  saveSession(session: LocalSessionData): LocalSessionData {
    return this.fileManagerService.saveSession(session)
  }

  @IpcHandle('file-manager:load-session')
  loadSession(): LocalSessionData {
    return this.fileManagerService.loadSession()
  }

  @IpcHandle('file-manager:clear-session')
  clearSession(): void {
    this.fileManagerService.clearSession()
  }

  @IpcHandle('file-manager:save-song-data')
  saveSongData(data: { gameCode: string; songData: SongData[] }): boolean {
    try {
      const { gameCode, songData } = data
      this.logger.log(
        `곡 데이터 저장 요청 - 게임 코드: ${gameCode}, 배열 여부: ${Array.isArray(songData)}, 길이: ${songData.length || 0}`,
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
  loadSongData(gameCode: string): SongData[] {
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
  openFolder(folderType: 'documents' | 'pictures' | 'logs' | 'appData'): boolean {
    try {
      return this.fileManagerService.openFolder(folderType)
    } catch (error) {
      this.logger.error(`폴더 열기 실패 (${folderType}):`, error)
      return false
    }
  }

  @IpcHandle('file-manager:get-folder-paths')
  getFolderPaths() {
    return this.fileManagerService.getFolderPaths()
  }

  @IpcHandle('file-manager:clear-all-logs')
  clearAllLogs() {
    return this.fileManagerService.clearAllLogs()
  }

  @IpcHandle('file-manager:open-file-dialog')
  async openFileDialog(options: {
    title?: string
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }): Promise<string | null> {
    try {
      const result = await dialog.showOpenDialog({
        title: options.title ?? '파일 선택',
        defaultPath: options.defaultPath,
        filters: options.filters ?? [{ name: '모든 파일', extensions: ['*'] }],
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
