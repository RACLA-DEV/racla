import { Injectable } from '@nestjs/common'
import { BrowserWindow } from 'electron'

@Injectable()
export class MainWindowService {
  private readonly mainWindow: BrowserWindow

  constructor() {
    this.mainWindow = BrowserWindow.getAllWindows()[0]
  }

  onClosed(callback: () => void | Promise<void>) {
    this.mainWindow.on('closed', callback)
  }

  getWindow() {
    return this.mainWindow
  }
}
