import { join } from 'node:path'

import { Injectable, Logger } from '@nestjs/common'
import { SettingsData } from '@src/types/settings/SettingData'
import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron'

@Injectable()
export class OverlayWindowService {
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

  private settings: SettingsData = {}

  // 설정 업데이트 메서드
  public updateSettings(settings: SettingsData): void {
    this.settings = settings
    this.logger.debug('오버레이 윈도우 설정 업데이트됨')
    if (this.settings.enableOverlayWindow === false) {
      this.destroyOverlay()
    } else {
      this.createOverlayInit()
    }
  }

  public getOverlayWindow(): BrowserWindow | undefined {
    return this.overlayWindow
  }

  public createOverlay(): BrowserWindow | undefined {
    // 오버레이 윈도우가 비활성화되어 있으면 생성하지 않음
    if (this.settings.enableOverlayWindow === false) {
      this.logger.debug('설정에 따라 오버레이 윈도우 생성이 비활성화됨')
      return undefined
    }

    if (this.overlayWindow) {
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    this.overlayWindow = new BrowserWindow(this.OVERLAY_SETTING)

    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    this.overlayWindow.setVisibleOnAllWorkspaces(true)

    if (this.URL) {
      this.overlayWindow.loadURL(this.URL)
    } else {
      this.logger.error('Failed to determine URL for overlay window')
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = undefined
    })

    return this.overlayWindow
  }

  public createOverlayInit(): BrowserWindow | undefined {
    // 오버레이 윈도우가 비활성화되어 있으면 생성하지 않음
    if (this.settings.enableOverlayWindow === false) {
      this.logger.debug('설정에 따라 오버레이 윈도우 초기화가 비활성화됨')
      return undefined
    }

    if (this.overlayWindow) {
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    this.overlayWindow = new BrowserWindow(this.OVERLAY_SETTING)

    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    this.overlayWindow.setVisibleOnAllWorkspaces(true)

    if (this.URL) {
      this.overlayWindow.loadURL(this.URL)
    } else {
      this.logger.error('Failed to determine URL for overlay window')
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = undefined
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
    // 오버레이 윈도우가 비활성화되어 있으면 메시지 전송하지 않음
    if (this.settings.enableOverlayWindow === false || !this.overlayWindow) {
      return
    }
    this.overlayWindow?.webContents.send('overlay-msg', message)
  }

  public setOverlayWindow(window: BrowserWindow): void {
    this.overlayWindow = window
  }
}
