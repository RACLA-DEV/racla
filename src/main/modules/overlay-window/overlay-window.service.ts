import { join } from 'node:path'

import { Injectable, Logger } from '@nestjs/common'
import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron'

@Injectable()
export class OverlayWindowService {
  private overlayWindow: BrowserWindow | null = null
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

  public async getOverlayWindow(): Promise<BrowserWindow | null> {
    return this.overlayWindow
  }

  public async createOverlay(): Promise<BrowserWindow | null> {
    if (this.overlayWindow) {
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    this.overlayWindow = new BrowserWindow(this.OVERLAY_SETTING)

    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    this.overlayWindow.setVisibleOnAllWorkspaces(true)

    if (this.URL) {
      this.overlayWindow.loadURL(`${this.URL}`)
    } else {
      this.logger.error('Failed to determine URL for overlay window')
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null
    })

    return this.overlayWindow
  }

  public async createOverlayInit(): Promise<BrowserWindow | null> {
    if (this.overlayWindow) {
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    this.overlayWindow = new BrowserWindow(this.OVERLAY_SETTING)

    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    this.overlayWindow.setVisibleOnAllWorkspaces(true)

    if (this.URL) {
      this.overlayWindow.loadURL(`${this.URL}`)
    } else {
      this.logger.error('Failed to determine URL for overlay window')
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null
    })

    return this.overlayWindow
  }

  public async destroyOverlay(): Promise<void> {
    if (this.overlayWindow) {
      this.overlayWindow.destroy()
      this.overlayWindow = null
    }
  }

  public sendMessage(message: string): void {
    this.overlayWindow?.webContents.send('overlay-msg', message)
  }

  public setOverlayWindow(window: BrowserWindow): void {
    this.overlayWindow = window
  }
}
