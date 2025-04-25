import { GLOBAL_DICTONARY } from '@main/constants/GLOBAL_DICTONARY'
import { join } from 'node:path'

import { Injectable, Logger } from '@nestjs/common'
import type { OverlayBounds } from '@src/types/common/OverlayBounds'
import { app, BrowserWindow, screen } from 'electron'
import { GameMonitorService } from '../game-monitor/game-monitor.service'
import { MainWindowService } from '../main-window/main-window.service'

@Injectable()
export class OverlayWindowService {
  private overlayWindow: BrowserWindow | null = null
  private readonly logger = new Logger(OverlayWindowService.name)
  private isProcessingUpdate = false
  private updateInterval: NodeJS.Timeout | null = null
  private isMaximized = false
  private readonly UPDATE_INTERVAL = 16 // 약 60fps에 해당하는 시간 간격
  private readonly STANDARD_RESOLUTIONS = [
    640, 720, 800, 1024, 1128, 1280, 1366, 1600, 1680, 1760, 1920, 2048, 2288, 2560, 3072, 3200,
    3840, 5120,
  ]

  private lastGameWindowBounds: { x: number; y: number; width: number; height: number } | null =
    null

  constructor(
    private readonly gameMonitorService: GameMonitorService,
    private readonly mainWindowService: MainWindowService,
  ) {
    this.mainWindowService.onClosed(async () => {
      await this.destroyOverlay()
    })
  }

  public async initialize(): Promise<void> {
    this.startWindowMonitoring()
    await this.createOverlayInit()
  }

  private startWindowMonitoring(): void {
    // 기존 인터벌 및 리스너 정리
    this.cleanup()

    // 메인 윈도우 포커스 이벤트 리스너 추가
    const mainWindow = this.mainWindowService.getWindow()
    if (!mainWindow) {
      this.logger.warn('Main window not found')
      return
    }

    mainWindow.on('focus', async () => {
      this.logger.debug('Main window focused, stopping monitoring and destroying overlay')
      this.stopMonitoring()
      this.overlayWindow?.hide()
    })

    mainWindow.on('blur', async () => {
      this.logger.debug('Main window blurred, creating overlay and starting monitoring')
      this.startMonitoring()
    })

    // 초기 상태 설정
    if (!mainWindow.isFocused()) {
      // 비동기 작업을 Promise로 처리
      Promise.resolve()
        .then(async () => {
          await this.createOverlayInit()
          this.startMonitoring()
        })
        .catch((error) => {
          this.logger.error('Error in initial overlay setup:', error.message)
        })
    }
  }

  private startMonitoring(): void {
    if (this.updateInterval) {
      return
    }

    this.updateInterval = setInterval(() => {
      if (!this.isProcessingUpdate && this.overlayWindow) {
        Promise.resolve()
          .then(() => this.handleGameWindowChange())
          .catch((error) => {
            this.logger.error('Error in window monitoring:', error.message)
            this.isProcessingUpdate = false
          })
      }
    }, this.UPDATE_INTERVAL)
  }

  private stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isProcessingUpdate = false
    this.lastGameWindowBounds = null
  }

  private async handleGameWindowChange(): Promise<void> {
    this.isProcessingUpdate = true
    try {
      const gameWindow = await this.gameMonitorService.getGameWindowInfo()

      if (!gameWindow) {
        if (this.overlayWindow?.isVisible()) {
          this.overlayWindow?.hide()
          this.lastGameWindowBounds = null
        }
        return
      }

      const isBoundsChanged =
        !this.lastGameWindowBounds ||
        this.lastGameWindowBounds.x !== gameWindow.bounds.x ||
        this.lastGameWindowBounds.y !== gameWindow.bounds.y ||
        this.lastGameWindowBounds.width !== gameWindow.bounds.width ||
        this.lastGameWindowBounds.height !== gameWindow.bounds.height

      if (isBoundsChanged) {
        this.lastGameWindowBounds = { ...gameWindow.bounds }
        await this.updateOverlayPosition()
        if (!this.overlayWindow?.isVisible()) {
          this.overlayWindow?.show()
        }
      }

      // 활성 윈도우 정보 가져와서 오버레이로 전송
      try {
        const activeWindow = await this.gameMonitorService.getActiveWindows()
        if (activeWindow && this.overlayWindow) {
          this.sendMessage(
            JSON.stringify({
              type: 'active-windows',
              data: activeWindow,
              isMaximized: this.isMaximized,
            }),
          )
        }
      } catch (error) {
        this.logger.error('Error getting active window info:', error.message)
      }
    } catch (error) {
      this.logger.error('Error in handleGameWindowChange:', error.message)
    } finally {
      this.isProcessingUpdate = false
    }
  }

  public cleanup(): void {
    this.stopMonitoring()

    // 메인 윈도우 이벤트 리스너 제거
    const mainWindow = this.mainWindowService.getWindow()
    if (mainWindow) {
      mainWindow.removeAllListeners('focus')
      mainWindow.removeAllListeners('blur')
    }

    if (this.overlayWindow) {
      this.overlayWindow.destroy()
      this.overlayWindow = null
    }
  }

  public async createOverlay(): Promise<BrowserWindow | null> {
    const isGameRunning = await this.gameMonitorService.checkGameStatus(
      GLOBAL_DICTONARY.SUPPORTED_GAME_PROCESS_NAME_LIST,
    )

    if (!isGameRunning) {
      this.logger.warn('Game is not running')
      return null
    }

    if (this.overlayWindow) {
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    const isDev = !app.isPackaged
    const preloadPath = isDev
      ? join(app.getAppPath(), '../preload/index.js')
      : join(app.getAppPath(), 'dist/preload/index.js')

    this.overlayWindow = new BrowserWindow({
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
      useContentSize: true,
      webPreferences: {
        contextIsolation: true,
        preload: preloadPath,
        devTools: isDev,
      },
    })

    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    const URL = isDev
      ? `${process.env.DS_RENDERER_URL}#/overlay`
      : `file://${join(app.getAppPath(), 'dist/render/index.html')}#/overlay`

    if (URL) {
      this.overlayWindow.loadURL(`${URL}`)
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

    const isDev = !app.isPackaged
    const preloadPath = isDev
      ? join(app.getAppPath(), '../preload/index.js')
      : join(app.getAppPath(), 'dist/preload/index.js')

    this.overlayWindow = new BrowserWindow({
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
      useContentSize: true,
      webPreferences: {
        devTools: isDev,
        contextIsolation: true,
        preload: preloadPath,
      },
    })

    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    const URL = isDev
      ? `${process.env.DS_RENDERER_URL}#/overlay`
      : `file://${join(app.getAppPath(), 'dist/render/index.html')}#/overlay`

    if (URL) {
      this.overlayWindow.loadURL(`${URL}`)
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

  public async updateOverlayPosition(): Promise<void> {
    try {
      if (!this.overlayWindow) {
        this.logger.warn('Overlay window not initialized')
        return
      }

      const gameWindow = await this.gameMonitorService.getGameWindowInfo()
      if (!gameWindow) {
        this.logger.debug('No game window found')
        this.overlayWindow.hide()
        return
      }

      // 표준 해상도인지 확인하여 isMaximized 결정
      this.isMaximized = this.STANDARD_RESOLUTIONS.includes(gameWindow.bounds.width)

      // 게임 윈도우가 있는 디스플레이의 스케일 팩터 가져오기
      const display = screen.getDisplayNearestPoint({
        x: gameWindow.bounds.x,
        y: gameWindow.bounds.y,
      })
      const scaleFactor = display.scaleFactor

      const newBounds = this.calculateOverlayBounds(
        gameWindow.bounds,
        this.isMaximized,
        scaleFactor,
      )

      this.overlayWindow.setBounds(newBounds)
      if (!this.overlayWindow.isVisible()) {
        this.overlayWindow.show()
      }
    } catch (error) {
      this.logger.error('Failed to update overlay position:', error.message)
    }
  }

  private calculateOverlayBounds(
    gameBounds: { x: number; y: number; width: number; height: number },
    isFullscreen: boolean,
    scaleFactor: number,
  ): OverlayBounds {
    if (isFullscreen) {
      const aspectRatio = 16 / 9
      const targetHeight = gameBounds.width / aspectRatio
      const blackBarHeight = (gameBounds.height - targetHeight) / 2

      return {
        x: Math.round(gameBounds.x / scaleFactor) + 48,
        y: Math.round((gameBounds.y + blackBarHeight) / scaleFactor) + 48,
        width: Math.round(gameBounds.width / scaleFactor) + 96,
        height: Math.round(targetHeight / scaleFactor) + 96,
      }
    } else {
      const isNonStandardRatio = (gameBounds.width / 16) * 9 !== gameBounds.height
      const removedPixels = isNonStandardRatio
        ? (gameBounds.height - (gameBounds.width / 16) * 9) / 2
        : 0

      return {
        x: Math.round(gameBounds.x / scaleFactor) + (isNonStandardRatio ? removedPixels : 0),
        y:
          Math.round(gameBounds.y / scaleFactor) +
          (isNonStandardRatio
            ? (gameBounds.height - (gameBounds.width / 16) * 9) / scaleFactor
            : 0),
        width:
          Math.round(gameBounds.width / scaleFactor) - (isNonStandardRatio ? removedPixels * 2 : 0),
        height: Math.round(
          isNonStandardRatio
            ? (gameBounds.height - (gameBounds.height - (gameBounds.width / 16) * 9)) /
                scaleFactor -
                removedPixels
            : gameBounds.height / scaleFactor,
        ),
      }
    }
  }

  public setOverlayWindow(window: BrowserWindow): void {
    this.overlayWindow = window
  }
}
