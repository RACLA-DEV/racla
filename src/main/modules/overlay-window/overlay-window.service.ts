import { join } from 'node:path'

import { Injectable, Logger } from '@nestjs/common'
import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import { FileManagerService } from '../file-manager/file-manager.service'

@Injectable()
export class OverlayWindowService {
  constructor(private readonly fileManagerService: FileManagerService) {}
  private overlayWindow: BrowserWindow | undefined = undefined
  private readonly logger = new Logger(OverlayWindowService.name)
  private readonly isDev = !app.isPackaged
  private readonly preloadPath = this.isDev
    ? join(app.getAppPath(), '../preload/index.js')
    : join(app.getAppPath(), 'dist/preload/index.js')
  private readonly OVERLAY_SETTING: BrowserWindowConstructorOptions = {
    width: 1280,
    height: 720,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    type: 'toolbar',
    autoHideMenuBar: true,
    show: false,
    resizable: false,
    thickFrame: false,
    roundedCorners: false,
    useContentSize: true,
    minimizable: false,
    webPreferences: {
      contextIsolation: true,
      preload: this.preloadPath,
      devTools: this.isDev,
    },
  }
  private readonly URL = this.isDev
    ? `${process.env.DS_RENDERER_URL}#/overlay`
    : `file://${join(app.getAppPath(), 'dist/render/index.html')}#/overlay`

  public getOverlayWindow(): BrowserWindow | undefined {
    return this.overlayWindow
  }

  public createOverlay(): BrowserWindow | undefined {
    const settings = this.fileManagerService.loadSettings()
    // 오버레이 윈도우가 비활성화되어 있으면 생성하지 않음
    if (settings.enableOverlayWindow === false) {
      this.logger.debug('설정에 따라 오버레이 윈도우 생성이 비활성화됨')
      return undefined
    }

    if (this.overlayWindow) {
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    // 약간의 지연 추가
    setTimeout(() => {
      this.logger.debug('오버레이 윈도우 생성 시작')
    }, 100)

    this.overlayWindow = new BrowserWindow(this.OVERLAY_SETTING)

    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    this.overlayWindow.setVisibleOnAllWorkspaces(true)

    if (this.URL) {
      // 로딩 완료 이벤트 추가
      this.overlayWindow.webContents.on('did-finish-load', () => {
        this.logger.debug('오버레이 윈도우 컨텐츠 로드 완료')
      })

      this.overlayWindow.loadURL(this.URL)
    } else {
      this.logger.error('Failed to determine URL for overlay window')
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = undefined
      this.logger.debug('오버레이 윈도우 닫힘')
    })

    return this.overlayWindow
  }

  public createOverlayInit(): BrowserWindow | undefined {
    const settings = this.fileManagerService.loadSettings()
    // 오버레이 윈도우가 비활성화되어 있으면 생성하지 않음
    if (settings.enableOverlayWindow === false) {
      this.logger.debug('설정에 따라 오버레이 윈도우 초기화가 비활성화됨')
      return undefined
    }

    if (this.overlayWindow) {
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    // 약간의 지연 추가
    setTimeout(() => {
      this.logger.debug('오버레이 윈도우 초기화 시작')
    }, 100)

    this.overlayWindow = new BrowserWindow(this.OVERLAY_SETTING)

    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    this.overlayWindow.setVisibleOnAllWorkspaces(true)

    if (this.URL) {
      // 로딩 완료 이벤트 추가
      this.overlayWindow.webContents.on('did-finish-load', () => {
        this.logger.debug('오버레이 윈도우 컨텐츠 로드 완료')
      })

      this.overlayWindow.loadURL(this.URL)
    } else {
      this.logger.error('Failed to determine URL for overlay window')
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = undefined
      this.logger.debug('오버레이 윈도우 닫힘')
    })

    return this.overlayWindow
  }

  public destroyOverlay(): void {
    if (this.overlayWindow) {
      this.overlayWindow.destroy()
      this.overlayWindow = undefined
    }
  }

  public sendMessage(message: string): void {
    const settings = this.fileManagerService.loadSettings()
    // 오버레이 윈도우가 비활성화되어 있으면 메시지 전송하지 않음
    if (settings.enableOverlayWindow === false || !this.overlayWindow) {
      return
    }
    this.overlayWindow?.webContents.send('overlay-msg', message)
  }

  public setOverlayWindow(window: BrowserWindow): void {
    this.overlayWindow = window
  }
}
