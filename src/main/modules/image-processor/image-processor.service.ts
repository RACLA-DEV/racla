import { Injectable, Logger } from '@nestjs/common'

import { Window } from 'node-screenshots'
import { Buffer } from 'node:buffer'
import sharp from 'sharp'

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name)

  private readonly standardResolutions = [
    { width: 640, height: 360 },
    { width: 720, height: 405 },
    { width: 800, height: 450 },
    { width: 1024, height: 576 },
    { width: 1128, height: 635 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1600, height: 900 },
    { width: 1680, height: 945 },
    { width: 1760, height: 990 },
    { width: 1920, height: 1080 },
    { width: 2048, height: 1152 },
    { width: 2288, height: 1287 },
    { width: 2560, height: 1440 },
    { width: 3072, height: 1728 },
    { width: 3200, height: 1800 },
    { width: 3840, height: 2160 },
    { width: 5120, height: 2880 },
  ]

  isStandardResolution(width: number, height: number): boolean {
    return this.standardResolutions.some(
      (res) => Math.abs(width / height - res.width / res.height) < 0.01,
    )
  }

  async processWindowImage(window: Window): Promise<Buffer> {
    const image = window.captureImageSync()
    const pngImage = await sharp(image.toPngSync()).toBuffer()
    const metadata = await sharp(pngImage).metadata()

    // 창모드 여부 확인
    const isWindowedMode = !this.isStandardResolution(metadata.width, metadata.height)
    this.logger.log(`Windowed mode: ${isWindowedMode}`)

    if (isWindowedMode) {
      return this.processWindowedModeImage(pngImage)
    } else {
      return this.processFullscreenImage(pngImage)
    }
  }

  private async processWindowedModeImage(pngImage: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(pngImage).metadata()
      const { data, info } = await sharp(pngImage).raw().toBuffer({ resolveWithObject: true })

      // 실제 컨텐츠 영역 찾기 (하단 기준)
      const actualHeight = this.findActualHeight(
        data,
        metadata.width,
        metadata.height,
        info.channels,
      )

      // 하단 블랙 레벨을 기준으로 좌우 여백 계산
      const bottomBlackLevel = metadata.height - actualHeight
      const sideBlackLevel = bottomBlackLevel // 하단 블랙 레벨과 동일한 값을 좌우에 적용

      this.logger.debug(`Black level: ${bottomBlackLevel}px`)

      // 첫 번째 크롭: 좌우 여백과 실제 높이 기준으로 크롭
      const croppedImage = await sharp(pngImage)
        .extract({
          left: sideBlackLevel,
          top: 0,
          width: metadata.width - sideBlackLevel * 2,
          height: actualHeight,
        })
        .resize(1920)
        .toBuffer()

      // 두 번째 크롭: 하단 기준으로 1080 높이만큼 잘라내기
      const croppedMetadata = await sharp(croppedImage).metadata()
      return sharp(croppedImage)
        .extract({
          left: 0,
          top: Math.max(0, croppedMetadata.height - 1080),
          width: croppedMetadata.width,
          height: Math.min(croppedMetadata.height, 1080),
        })
        .toBuffer()
    } catch (error) {
      this.logger.error('Error processing windowed mode image:', error.message)
      throw error
    }
  }

  private async processFullscreenImage(pngImage: Buffer): Promise<Buffer> {
    return await sharp(pngImage).resize(1920, 1080).toBuffer()
  }

  private findActualHeight(data: Buffer, width: number, height: number, channels: number): number {
    return this.findFirstNonBlackRowFromBottom(data, width, height, channels)
  }

  private findFirstNonBlackRowFromBottom(
    data: Buffer,
    width: number,
    height: number,
    channels: number,
  ): number {
    for (let y = height - 1; y >= 0; y--) {
      if (this.isNonBlackRow(data, width, y, channels)) {
        return y + 1
      }
    }
    return height
  }

  private isNonBlackRow(data: Buffer, width: number, y: number, channels: number): boolean {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels
      if (this.isNonBlackPixel(data, idx)) {
        return true
      }
    }
    return false
  }

  private isNonBlackPixel(data: Buffer, idx: number): boolean {
    return (
      idx >= 0 &&
      idx + 2 < data.length &&
      (data[idx] !== 0 || data[idx + 1] !== 0 || data[idx + 2] !== 0)
    )
  }

  async captureGameWindow(gameTitle: string): Promise<Buffer | null> {
    try {
      const windows = Window.all().filter((window) => window.title.includes(gameTitle))

      if (windows.length === 0) {
        this.logger.debug('No matching game window found')
        return null
      }

      const targetWindow = windows[0]
      return await this.processWindowImage(targetWindow)
    } catch (error) {
      this.logger.error('Error capturing game window:', error.message)
      throw error
    }
  }
}
