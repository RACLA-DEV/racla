import { Controller, Logger } from '@nestjs/common'
import { ipcMain, shell } from 'electron'
import { MainWindowService } from './main-window.service'

@Controller()
export class MainWindowController {
  private readonly logger = new Logger(MainWindowController.name)
  constructor(private readonly mainWindowService: MainWindowService) {
    // IPC 이벤트 핸들러 등록
    this.registerIpcEventHandlers()
  }

  private registerIpcEventHandlers(): void {
    ipcMain.on('window:close', () => {
      const mainWindow = this.mainWindowService.getWindow()
      if (mainWindow) {
        mainWindow.close()
      }
    })

    ipcMain.on('window:minimize', () => {
      const mainWindow = this.mainWindowService.getWindow()
      if (mainWindow) {
        mainWindow.minimize()
      }
    })

    ipcMain.on('window:maximize', () => {
      const mainWindow = this.mainWindowService.getWindow()
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.restore()
        } else {
          mainWindow.maximize()
        }
      }
    })

    // 외부 URL 열기 핸들러
    ipcMain.handle('window:open-external-url', async (_, url: string) => {
      try {
        await shell.openExternal(url)
        return true
      } catch (error) {
        this.logger.error('Error opening external URL:', error)
        return false
      }
    })
  }
}
