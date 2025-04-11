import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import type { SessionData, SettingsData } from './file-manager.service'
import { FileManagerService } from './file-manager.service'

@Controller()
export class FileManagerController {
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
  async saveSongData(data: { songData: any[]; gameCode: string }): Promise<void> {
    return this.fileManagerService.saveSongData(data.songData, data.gameCode)
  }

  @IpcHandle('file-manager:load-song-data')
  async loadSongData(gameCode: string): Promise<any[]> {
    return this.fileManagerService.loadSongData(gameCode)
  }
}
