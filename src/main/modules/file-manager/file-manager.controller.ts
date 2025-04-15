import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller, Logger } from '@nestjs/common'
import type { SessionData, SettingsData } from './file-manager.service'
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
}
