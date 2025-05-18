import { GLOBAL_DICTONARY } from '@main/constants/GLOBAL_DICTONARY'
import { Injectable, Logger } from '@nestjs/common'
import { OCRResultInfo } from '@src/types/ocr/OcrResultInfo'
import type { OverlayBounds } from '@src/types/overlay/OverlayBounds'
import dayjs from 'dayjs'
import { BrowserWindow, screen } from 'electron'
import type { Result } from 'get-windows'
import type { ProcessDescriptor } from 'ps-list'
import { FileManagerService } from '../file-manager/file-manager.service'
import { ImageProcessorService } from '../image-processor/image-processor.service'
import { MainWindowService } from '../main-window/main-window.service'
import { OcrManagerService } from '../ocr-manager/ocr-manager.service'
import { OverlayWindowService } from '../overlay-window/overlay-window.service'

@Injectable()
export class GameMonitorService {
  private readonly logger = new Logger(GameMonitorService.name)
  // 게임 프로세스 정보를 저장
  private gameProcess: ProcessDescriptor | undefined = undefined
  private gameWindow: Result | undefined = undefined
  private cachedWindow: Result | undefined = undefined
  private lastCheckTime = 0
  private isGameWindowFocused = false
  private readonly CACHE_DURATION = 300 // 100ms에서 300ms로 증가

  // 모니터링 관련 변수
  private autoCaptureInterval: NodeJS.Timeout | undefined = undefined
  private updateInterval: NodeJS.Timeout | undefined = undefined
  private isProcessingUpdate = false
  private lastGameWindowBounds:
    | { x: number; y: number; width: number; height: number }
    | undefined = undefined
  private readonly UPDATE_INTERVAL = 100 // 약 60fps에서 10fps로 변경 (성능 개선)
  private readonly BOUNDS_CHANGE_THRESHOLD = 5 // 경계값 변화 임계값 (픽셀)
  private readonly STANDARD_RESOLUTIONS = [
    640, 720, 800, 1024, 1128, 1280, 1366, 1600, 1680, 1760, 1920, 2048, 2288, 2560, 3072, 3200,
    3840, 5120,
  ]
  private isMaximized = false
  private lastOverlayUpdateTime = 0
  private readonly MIN_UPDATE_INTERVAL = 150 // 오버레이 위치 업데이트 최소 간격 (ms)
  private isInitialized = false // 초기화 상태를 추적하는 변수 추가
  private lastResultInfo: OCRResultInfo | undefined = undefined
  private activeWindow: Result | undefined = undefined
  private isProcessingResult = false
  private retryCount = 0

  constructor(
    private readonly mainWindowService: MainWindowService,
    private readonly overlayWindowService: OverlayWindowService,
    private readonly fileService: FileManagerService,
    private readonly imageProcessorService: ImageProcessorService,
    private readonly ocrManagerService: OcrManagerService,
  ) {
    this.mainWindowService.onClosed(() => {
      this.overlayWindowService.destroyOverlay()
    })
  }

  public initialize(): void {
    this.startWindowMonitoring()
    // 앱 시작 시 초기 상태 확인 추가
    this.checkInitialFocusState()
  }

  // 앱 시작 시 포커스 상태 확인하여 처리하는 함수
  private checkInitialFocusState(): void {
    const mainWindow = this.mainWindowService.getWindow()
    if (!mainWindow) {
      this.logger.warn('Main window not found for initial focus check')
      return
    }

    // 약간의 지연을 두고 초기 포커스 상태 확인 (윈도우 생성 및 표시 후)
    setTimeout(() => {
      try {
        // 현재 앱에 포커스가 없는지 확인
        const isFocused = mainWindow.isFocused()

        if (!isFocused && !this.isInitialized) {
          this.logger.debug('App started without focus - initializing overlay')
          this.isInitialized = true

          // 비동기 함수 내부에서 await 대신 then/catch 사용
          void this.overlayWindowService.createOverlayInit()

          // 약간의 지연 후 모니터링 시작
          setTimeout(() => {
            this.startMonitoring()
          }, 100)
        }
      } catch (error) {
        this.logger.error('Error checking initial focus state:', error.message)
      }
    }, 500)
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
      this.logger.debug('Main window focused, stopping monitoring and hiding overlay')
      this.stopMonitoring()
      const overlayWindow = await this.overlayWindowService.getOverlayWindow()
      overlayWindow?.hide()
    })

    mainWindow.on('blur', async () => {
      this.logger.debug('Main window blurred, creating overlay and starting monitoring')

      // 최초 블러 이벤트에만 오버레이 초기화
      if (!this.isInitialized) {
        this.logger.debug('First blur event - initializing overlay')
        this.isInitialized = true
        await this.overlayWindowService.createOverlayInit()
      }

      // 약간의 지연을 주어 포커스 전환 중 떨림 방지
      setTimeout(() => {
        this.startMonitoring()
      }, 100)
    })

    // 앱 준비 완료 이벤트 추가
    mainWindow.on('ready-to-show', () => {
      this.logger.debug('Main window ready to show, checking initial focus state')
      this.checkInitialFocusState()
    })
  }

  private startMonitoring(): void {
    if (this.updateInterval) {
      return
    }

    const settingData = this.fileService.loadSettings()

    this.updateInterval = setInterval(() => {
      if (!this.isProcessingUpdate) {
        Promise.resolve()
          .then(() => this.handleGameWindowChange())
          .catch((error: unknown) => {
            if (error instanceof Error) {
              this.logger.error('Error in window monitoring:', error.message)
            } else {
              this.logger.error('Error in window monitoring:', String(error))
            }
            this.isProcessingUpdate = false
          })
      }
    }, this.UPDATE_INTERVAL)

    if (settingData.autoCaptureMode) {
      this.logger.debug('Auto capture mode is enabled')
      if (!this.autoCaptureInterval) {
        this.autoCaptureInterval = setInterval(() => {
          Promise.resolve()
            .then(async () => {
              const session = this.fileService.loadSession()
              if (
                session.playerId &&
                session.playerToken &&
                this.activeWindow &&
                this.isGameWindowFocused &&
                !this.isProcessingResult
              ) {
                this.isProcessingResult = true
                let ocrResult = await this.ocrManagerService.getOcrResult(
                  this.activeWindow?.title,
                  settingData,
                )
                this.logger.debug(
                  `OCR Result: ${ocrResult.resultInfo.isResult.length > 0 ? 'true' : 'false'}, ${ocrResult.resultInfo.where}, ${ocrResult.resultInfo.text}`,
                )

                if (settingData.autoCaptureDelayTime) {
                  this.logger.debug(
                    `autoDeleteCapturedImages is enabled, delaying ${settingData.autoCaptureDelayTime / 1000} seconds and re-capturing`,
                  )
                  await this.delay(settingData.autoCaptureDelayTime)

                  ocrResult = await this.ocrManagerService.getOcrResult(
                    this.activeWindow?.title,
                    settingData,
                  )
                }

                if (
                  ocrResult.resultInfo.isResult.length > 0 &&
                  this.lastResultInfo?.text !== ocrResult.resultInfo.text &&
                  this.retryCount < 3
                ) {
                  this.logger.debug('Result screen detected')
                  if (this.retryCount == 0) {
                    this.overlayWindowService.sendMessage(
                      JSON.stringify({
                        type: 'notification',
                        notificationType: 'info',
                        message: 'detectResultScreen',
                        mode: 'i18n',
                      }),
                    )
                  } else if (this.retryCount == 1) {
                    this.overlayWindowService.sendMessage(
                      JSON.stringify({
                        type: 'notification',
                        notificationType: 'info',
                        message: 'retryParsePlayResult',
                        mode: 'i18n',
                      }),
                    )
                  }

                  try {
                    const response = await this.ocrManagerService.getOcrResultServer(
                      ocrResult.image,
                      ocrResult.resultInfo.gameCode,
                    )

                    if (response.isVerified) {
                      this.logger.debug('Result screen successfully sent to server')
                      this.logger.debug(response)

                      this.overlayWindowService
                        .getOverlayWindow()
                        .webContents.send('overlay-ocr-result', response)

                      this.mainWindowService.sendMessage(
                        JSON.stringify({
                          type: 'ocr-result',
                          data: response,
                        }),
                      )

                      if (settingData.saveImageWhenCapture) {
                        const maskingRegions = this.imageProcessorService.getMaskingRegions(
                          ocrResult.resultInfo.gameCode,
                          ocrResult.resultInfo.where,
                        )
                        const maskedImage = await this.imageProcessorService.applyProfileMask(
                          ocrResult.image,
                          maskingRegions,
                          settingData.saveImageBlurMode,
                        )
                        const filePath = this.fileService.saveImage(
                          maskedImage,
                          `${String(
                            `${String(response.gameCode).toUpperCase()} - ${response.songData.name} - ${response.button}B - ${response.pattern} - ${response.score} - ${dayjs().format('YYYY-MM-DD-HH-mm-ss')}`,
                          )
                            .replaceAll(':', '_')
                            .replaceAll('\n', '')
                            .replaceAll('\\', '_')
                            .replaceAll('/', '_')
                            .replaceAll('?', '_')
                            .replaceAll('*', '_')
                            .replaceAll('"', '_')
                            .replaceAll('<', '_')
                            .replaceAll('>', '_')
                            .replaceAll('|', '_')}.png`,
                        )

                        this.overlayWindowService.sendMessage(
                          JSON.stringify({
                            type: 'notification',
                            notificationType: 'success',
                            message: 'successSavedImage',
                            mode: 'i18n',
                            props: {
                              filePath,
                            },
                          }),
                        )
                      }

                      this.lastResultInfo = ocrResult.resultInfo
                    } else {
                      this.logger.debug('Result screen not verified')
                      this.logger.debug(response)
                    }
                    this.isProcessingResult = false
                    this.retryCount = 0
                  } catch (error) {
                    this.logger.error('Error in getOcrResultServer:', error.message)
                    this.isProcessingResult = false
                    this.retryCount++
                  }
                } else if (ocrResult.resultInfo.isResult.length === 0 && this.lastResultInfo) {
                  this.logger.debug('Result screen not not detected')
                  this.lastResultInfo = undefined
                  this.retryCount = 0
                }
                this.isProcessingResult = false
              }
            })
            .catch((error: unknown) => {
              if (error instanceof Error) {
                this.logger.error('Error in auto capture:', error.message)
              } else {
                this.logger.error('Error in auto capture:', String(error))
              }
              this.overlayWindowService.sendMessage(
                JSON.stringify({
                  type: 'notification',
                  notificationType: 'error',
                  message: 'failedParsePlayResult',
                  mode: 'i18n',
                }),
              )
              this.isProcessingResult = false
            })
        }, settingData.autoCaptureIntervalTime)
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = undefined
    }
    if (this.autoCaptureInterval) {
      clearInterval(this.autoCaptureInterval)
      this.autoCaptureInterval = undefined
    }
    this.isProcessingUpdate = false
    this.lastGameWindowBounds = undefined
    this.isGameWindowFocused = false
    this.activeWindow = undefined
  }

  private async handleGameWindowChange(): Promise<void> {
    this.isProcessingUpdate = true
    try {
      await this.updateGameWindowOverlay()
      await this.sendActiveWindowInfo()
    } catch (error) {
      this.logger.error('Error in handleGameWindowChange:', error.message)
    } finally {
      this.isProcessingUpdate = false
    }
  }

  private async updateGameWindowOverlay(): Promise<void> {
    const gameWindow = await this.getGameWindowInfo()
    const overlayWindow = await this.overlayWindowService.getOverlayWindow()

    if (!gameWindow || !overlayWindow) {
      if (overlayWindow?.isVisible()) {
        overlayWindow.hide()
        this.lastGameWindowBounds = undefined
      }
      return
    }

    const isBoundsChanged = this.checkSignificantBoundsChange(gameWindow.bounds)
    const now = Date.now()
    const isTimeToUpdate = now - this.lastOverlayUpdateTime >= this.MIN_UPDATE_INTERVAL

    if (isBoundsChanged && isTimeToUpdate) {
      this.lastGameWindowBounds = { ...gameWindow.bounds }
      this.lastOverlayUpdateTime = now
      await this.updateOverlayPosition(overlayWindow)
      if (!overlayWindow.isVisible()) {
        this.isGameWindowFocused = true
        overlayWindow.show()
        this.overlayWindowService.sendMessage(
          JSON.stringify({
            type: 'notification',
            notificationType: 'success',
            message: 'successInitialize',
            mode: 'i18n',
          }),
        )
      } else {
        this.isGameWindowFocused = false
      }
    }
  }

  private async sendActiveWindowInfo(): Promise<void> {
    try {
      const activeWindow = await this.getActiveWindows()
      this.activeWindow = activeWindow
      const overlayWindow = await this.overlayWindowService.getOverlayWindow()

      if (activeWindow && overlayWindow) {
        this.overlayWindowService.sendMessage(
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
  }

  // 경계값 변화가 임계값을 초과하는지 확인하는 헬퍼 메서드
  private checkSignificantBoundsChange(newBounds: {
    x: number
    y: number
    width: number
    height: number
  }): boolean {
    if (!this.lastGameWindowBounds) return true

    return (
      Math.abs(this.lastGameWindowBounds.x - newBounds.x) > this.BOUNDS_CHANGE_THRESHOLD ||
      Math.abs(this.lastGameWindowBounds.y - newBounds.y) > this.BOUNDS_CHANGE_THRESHOLD ||
      Math.abs(this.lastGameWindowBounds.width - newBounds.width) > this.BOUNDS_CHANGE_THRESHOLD ||
      Math.abs(this.lastGameWindowBounds.height - newBounds.height) > this.BOUNDS_CHANGE_THRESHOLD
    )
  }

  public cleanup(): void {
    this.stopMonitoring()

    // 메인 윈도우 이벤트 리스너 제거
    const mainWindow = this.mainWindowService.getWindow()
    if (mainWindow) {
      mainWindow.removeAllListeners('focus')
      mainWindow.removeAllListeners('blur')
    }

    this.overlayWindowService.destroyOverlay()
  }

  public async getActiveWindows(): Promise<Result> {
    const { activeWindow } = await import('get-windows')
    return await activeWindow()
  }

  public async getProcessList(): Promise<ProcessDescriptor[]> {
    const psList = await import('ps-list')
    return await psList.default()
  }

  public async checkGameStatus(processName: string[] | string): Promise<boolean> {
    if (Array.isArray(processName)) {
      const processes = await this.getProcessList()
      this.gameProcess = processes.find((p) => processName.includes(p.name)) || undefined
      return !!this.gameProcess
    } else {
      const processes = await this.getProcessList()
      this.gameProcess = processes.find((p) => p.name === processName) || undefined
      return !!this.gameProcess
    }
  }

  public async getGameWindowInfo(): Promise<Result | undefined> {
    try {
      const now = Date.now()
      if (this.cachedWindow && now - this.lastCheckTime < this.CACHE_DURATION) {
        return this.cachedWindow
      }

      const activeWindow = await this.getActiveWindows()
      if (this.isGameWindow(activeWindow)) {
        this.isGameWindowFocused = true
      } else {
        this.isGameWindowFocused = false
      }

      if (activeWindow && this.isGameWindow(activeWindow)) {
        this.cachedWindow = activeWindow
        this.lastCheckTime = now
        return activeWindow
      }

      this.cachedWindow = undefined
      return undefined
    } catch (error) {
      this.logger.debug('getGameWindowInfo Error:', error.message)
      return undefined
    }
  }

  private isGameWindow(window: Result): boolean {
    if (
      GLOBAL_DICTONARY.SUPPORTED_GAME_PROCESS_NAME_LIST.map((game) =>
        game.replace('.exe', ''),
      ).includes(window.title)
    ) {
      return true
    }
    return false
  }

  public getGameWindowBounds() {
    return this.gameWindow
  }

  public async updateOverlayPosition(overlayWindow: BrowserWindow): Promise<void> {
    try {
      if (!overlayWindow) {
        this.logger.warn('Overlay window not initialized')
        return
      }

      const gameWindow = await this.getGameWindowInfo()
      if (!gameWindow) {
        this.logger.debug('No game window found')
        overlayWindow.hide()
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
      overlayWindow.setBounds(newBounds)

      if (!overlayWindow.isVisible()) {
        this.isGameWindowFocused = true
        overlayWindow.show()
        this.overlayWindowService.sendMessage(
          JSON.stringify({
            type: 'notification',
            notificationType: 'success',
            message: 'successInitialize',
            mode: 'i18n',
          }),
        )
      } else {
        this.isGameWindowFocused = false
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
        x: Math.round(gameBounds.x / scaleFactor),
        y: Math.round((gameBounds.y + blackBarHeight) / scaleFactor),
        width: Math.round(gameBounds.width / scaleFactor),
        height: Math.round(targetHeight / scaleFactor),
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
}
