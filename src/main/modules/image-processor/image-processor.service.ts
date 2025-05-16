import { Injectable, Logger } from '@nestjs/common'

import { GLOBAL_DICTONARY } from '@src/main/constants/GLOBAL_DICTONARY'
import { OCRRegion } from '@src/types/ocr/OcrRegion'
import { ProfileRegion } from '@src/types/ocr/ProfileRegion'
import { SettingsData } from '@src/types/settings/SettingData'
import { Window } from 'node-screenshots'
import { Buffer } from 'node:buffer'
import sharp from 'sharp'
import { FileManagerService } from '../file-manager/file-manager.service'
@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name)

  constructor(private readonly fileManagerService: FileManagerService) {}

  isStandardResolution(width: number, height: number): boolean {
    return GLOBAL_DICTONARY.STANDARD_RESOLUTIONS.some(
      (res) => Math.abs(width / height - res.width / res.height) < 0.01,
    )
  }

  async processWindowImage(window: Window): Promise<Buffer> {
    const image = window.captureImageSync()
    const pngImage = await sharp(image.toPngSync()).toBuffer()
    const metadata = await sharp(pngImage).metadata()

    // 창모드 여부 확인
    const isWindowedMode = !this.isStandardResolution(metadata.width, metadata.height)
    this.logger.debug(`Windowed mode: ${isWindowedMode}`)

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

  /**
   * 이미지에서 특정 영역을 추출하는 메서드
   */
  async extractRegion(imageBuffer: Buffer, region: OCRRegion): Promise<Buffer> {
    try {
      return await sharp(imageBuffer).extract(region).grayscale().linear(1.5, 0).toBuffer()
    } catch (error) {
      this.logger.error(`이미지 영역 추출 중 오류 발생: ${error.message}`)
      throw error
    }
  }

  /**
   * 프로필 마스크 적용 메서드
   */
  async applyProfileMask(
    imageBuffer: Buffer,
    regions: OCRRegion[],
    blurMode = 'black',
  ): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer)

      if (regions.length === 0) return imageBuffer

      const overlays = await Promise.all(
        regions.map(async (region) => ({
          input: await this.createMask(imageBuffer, region, blurMode),
          left: region.left,
          top: region.top,
        })),
      )

      return await image.composite(overlays).toBuffer()
    } catch (error) {
      this.logger.error(`프로필 마스크 적용 중 오류 발생: ${error.message}`)
      return imageBuffer
    }
  }

  /**
   * 마스크 생성 메서드
   */
  private async createMask(
    imageBuffer: Buffer,
    region: OCRRegion,
    blurMode: string,
  ): Promise<Buffer> {
    if (blurMode === 'black') {
      return await this.createBlackMask(region)
    }
    return await this.createBlurMask(imageBuffer, region)
  }

  /**
   * 검은색 마스크 생성 메서드
   */
  private async createBlackMask(region: OCRRegion): Promise<Buffer> {
    return await sharp({
      create: {
        width: region.width,
        height: region.height,
        channels: 4,
        background: '#000000',
      },
    })
      .jpeg()
      .toBuffer()
  }

  /**
   * 블러 마스크 생성 메서드
   */
  private async createBlurMask(imageBuffer: Buffer, region: OCRRegion): Promise<Buffer> {
    return await sharp(imageBuffer).extract(region).blur(15).toBuffer()
  }

  /**
   * 게임 프로필 마스크 영역 가져오기
   */
  getProfileRegions(gameCode: string, screenType: string): ProfileRegion | null {
    return GLOBAL_DICTONARY.PROFILE_REGIONS[gameCode]?.[screenType] || null
  }

  /**
   * 마스킹할 영역 목록 가져오기
   */
  getMaskingRegions(gameCode: string, screenType: string): OCRRegion[] {
    const settings: SettingsData = this.fileManagerService.loadSettings()

    const regions = GLOBAL_DICTONARY.PROFILE_REGIONS[gameCode][screenType]
    if (!regions) return []

    let regionsToMask: OCRRegion[] = []

    if (settings.saveImageWithoutAllProfileWhenCapture) {
      if (screenType === 'result' || screenType === 'select' || screenType === 'collection') {
        regionsToMask = [regions.myProfile]
      } else if (screenType === 'openSelect') {
        regionsToMask = [regions.myProfile, regions.otherProfile, regions.chat]
      } else {
        regionsToMask = [regions.myProfile, regions.otherProfile]
      }
    } else if (settings.saveImageWithoutOtherProfileWhenCapture) {
      if (screenType === 'result' || screenType === 'select' || screenType === 'collection') {
        regionsToMask = []
      } else if (screenType === 'openSelect') {
        regionsToMask = [regions.otherProfile, regions.chat]
      } else {
        regionsToMask = [regions.otherProfile]
      }
    } else {
      if (screenType === 'openSelect') {
        regionsToMask = [regions.chat]
      }
    }

    return regionsToMask
  }
}
