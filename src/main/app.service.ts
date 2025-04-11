import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { BrowserWindow } from 'electron'
import { OverlayWindowService } from './modules/overlay-window/overlay-window.service'

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private mainWindow: BrowserWindow

  constructor(private readonly overlayWindowService: OverlayWindowService) {
    // ElectronModule에서 생성된 window 참조 가져오기
    this.mainWindow = BrowserWindow.getAllWindows()[0]
  }

  onApplicationBootstrap() {
    // 메인 윈도우가 닫히기 직전에 오버레이 제거
    this.mainWindow?.on('close', async () => {
      try {
        await this.overlayWindowService.destroyOverlay()
      } catch (error) {
        console.error('오버레이 제거 중 오류 발생:', error)
      }
    })
  }
}
