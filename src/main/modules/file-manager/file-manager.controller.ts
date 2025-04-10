import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import type { SettingsData } from './file-manager.service'
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
}
