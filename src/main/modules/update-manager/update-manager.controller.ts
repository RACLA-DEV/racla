import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { globalShortcut } from 'electron'
import { UpdateManagerService } from './update-manager.service'

@Controller()
export class UpdateManagerController {
  constructor(private readonly updateManagerService: UpdateManagerService) {}

  @IpcHandle('update-manager:update-app')
  async updateApp(): Promise<void> {
    // 전역 단축키 해제
    globalShortcut.unregisterAll()

    // 업데이트 설치 및 앱 재시작
    this.updateManagerService.quitAndInstall()
  }
}
