import { Injectable, Logger } from '@nestjs/common'
import { autoUpdater } from 'electron-updater'
import { FileManagerService } from '../file-manager/file-manager.service'
import { MainWindowService } from '../main-window/main-window.service'
@Injectable()
export class UpdateManagerService {
  private readonly logger = new Logger(UpdateManagerService.name)

  constructor(
    private readonly mainWindowService: MainWindowService,
    private readonly fileManagerService: FileManagerService,
  ) {}

  async initialize(): Promise<void> {
    this.logger.log('Initializing update manager...')

    const mainWindow = this.mainWindowService.getWindow()

    if (this.fileManagerService.loadSettings().autoUpdate) {
      // 업데이트 확인 및 알림 설정
      autoUpdater.checkForUpdatesAndNotify({
        title: 'RACLA 데스크톱 앱 업데이트가 준비되었습니다.',
        body: '업데이트를 적용하기 위해 앱을 종료하고 다시 실행해주세요.',
      })

      // 업데이트 가용 시 버전 정보를 렌더러 프로세스로 전송
      autoUpdater.on('update-available', (info) => {
        this.logger.log(`Update Available: ${JSON.stringify(info)}`)
        mainWindow.webContents.send('update-available', info.version)
      })

      // 다운로드 진행 상황을 렌더러 프로세스로 전송
      autoUpdater.on('download-progress', (progress) => {
        this.logger.log(`Update Download Progress: ${JSON.stringify(progress)}`)
        mainWindow.webContents.send('download-progress', {
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
        })
      })

      // 업데이트 다운로드 완료 시 렌더러 프로세스로 이벤트 전송
      autoUpdater.on('update-downloaded', (info) => {
        this.logger.log(`Update Downloaded: ${JSON.stringify(info)}`)
        mainWindow.webContents.send('update-downloaded', info.version)
      })
    }
  }

  // 업데이트 설치 및 앱 재시작
  quitAndInstall(): void {
    this.logger.log('Installing update and restarting app...')
    autoUpdater.quitAndInstall()
  }
}
