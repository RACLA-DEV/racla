import { GLOBAL_DICTONARY } from '@main/constants/GLOBAL_DICTONARY'
import { Injectable, Logger } from '@nestjs/common'
import { ExtractedRegionsResult } from '@src/types/ocr/ExtractedRegionsResult'
import { OCRResultInfo } from '@src/types/ocr/OcrResultInfo'
import { SettingsData } from '@src/types/settings/SettingData'
import * as Tesseract from 'tesseract.js'
import { ImageProcessorService } from '../image-processor/image-processor.service'

@Injectable()
export class OcrManagerService {
  private readonly logger = new Logger(OcrManagerService.name)

  constructor(private readonly imageProcessor: ImageProcessorService) {}

  /**
   * 추출된 이미지에서 텍스트를 인식하는 메서드
   */
  async recognizeText(buffer: Buffer): Promise<string> {
    const worker = await Tesseract.createWorker('eng')
    try {
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
      })

      const {
        data: { text },
      } = await worker.recognize(buffer)

      return text || ''
    } catch (error) {
      this.logger.error(`OCR 텍스트 인식 중 오류 발생: ${error.message}`)
      return ''
    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch (error) {
          this.logger.error(`Tesseract 워커 종료 중 오류 발생: ${error.message}`)
        }
      }
    }
  }

  /**
   * 이미지에서 OCR 영역을 추출하고 텍스트를 인식하는 메서드
   */
  async extractRegions(
    gameCode: string,
    imageBuffer: Buffer,
    settings: SettingsData,
  ): Promise<ExtractedRegionsResult> {
    const regions: Record<string, Buffer> = {}
    const texts: Record<string, string> = {}

    if (gameCode.toLowerCase().includes('djmax')) {
      if (settings.autoCaptureDjmaxRespectVOcrResultRegion) {
        regions.result = await this.imageProcessor.extractRegion(
          imageBuffer,
          GLOBAL_DICTONARY.OCR_REGIONS.djmax_respect_v.result,
        )
        texts.result = await this.recognizeText(regions.result)
      }

      // Versus 영역 추출 주석 처리, 구클라부터 문제가 잦게 발생하여 일시적으로 비활성화
      // if (settings.autoCaptureDjmaxRespectVOcrVersusRegion) {
      //   regions.versus = await this.imageProcessor.extractRegion(
      //     imageBuffer,
      //     this.ocrRegions.djmax_respect_v.versus,
      //   )
      //   texts.versus = await this.imageProcessor.recognizeText(regions.versus)
      // }

      if (settings.autoCaptureDjmaxRespectVOcrOpen3Region) {
        regions.open3 = await this.imageProcessor.extractRegion(
          imageBuffer,
          GLOBAL_DICTONARY.OCR_REGIONS.djmax_respect_v.open3,
        )
        texts.open3 = await this.recognizeText(regions.open3)
      }

      if (settings.autoCaptureDjmaxRespectVOcrOpen2Region) {
        regions.open2 = await this.imageProcessor.extractRegion(
          imageBuffer,
          GLOBAL_DICTONARY.OCR_REGIONS.djmax_respect_v.open2,
        )
        texts.open2 = await this.recognizeText(regions.open2)
      }
    } else if (gameCode.toLowerCase().includes('wjmax')) {
      if (settings.autoCaptureWjmaxOcrResultRegion) {
        regions.result = await this.imageProcessor.extractRegion(
          imageBuffer,
          GLOBAL_DICTONARY.OCR_REGIONS.wjmax.result,
        )
        texts.result = await this.recognizeText(regions.result)
      }
    } else if (gameCode.toLowerCase().includes('platina')) {
      if (settings.autoCapturePlatinaLabOcrResultRegion) {
        regions.result = await this.imageProcessor.extractRegion(
          imageBuffer,
          GLOBAL_DICTONARY.OCR_REGIONS.platina_lab.result,
        )
        texts.result = await this.recognizeText(regions.result)
      }
    }

    return { regions, texts }
  }

  /**
   * 텍스트 분석을 통해 결과 화면인지 판단하는 메서드
   */
  determineResultScreen(
    gameCode: string,
    texts: Record<string, string>,
    settings: SettingsData,
  ): OCRResultInfo {
    const resultInfo: OCRResultInfo = {
      isResult: [],
      text: '',
      where: '',
      gameCode: '',
    }

    if (gameCode.toLowerCase().includes('djmax')) {
      if (settings.autoCaptureDjmaxRespectVOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(
          texts.result,
          GLOBAL_DICTONARY.RESULT_KEYWORDS.djmax_respect_v.result,
        )
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
          resultInfo.gameCode = 'djmax_respect_v'
        }
      }

      // if (!resultInfo.where && settings.autoCaptureOcrVersusRegion && texts.versus) {
      //   if (texts.versus.trim().toUpperCase().replaceAll(' ', '') === 'RE') {
      //     resultInfo.where = 'versus'
      //     resultInfo.isResult = ['versus']
      //     resultInfo.text = texts.versus
      //   }
      // }

      if (!resultInfo.where && settings.autoCaptureDjmaxRespectVOcrOpen3Region && texts.open3) {
        const keywords = GLOBAL_DICTONARY.RESULT_KEYWORDS.djmax_respect_v.open3
        const normalizedText = texts.open3.trim().replaceAll(' ', '').toUpperCase()

        if (keywords.some((keyword) => normalizedText.includes(keyword))) {
          resultInfo.where = 'open3'
          resultInfo.isResult = ['open3']
          resultInfo.text = texts.open3
          resultInfo.gameCode = 'djmax_respect_v'
        }
      }

      if (!resultInfo.where && settings.autoCaptureDjmaxRespectVOcrOpen2Region && texts.open2) {
        const keywords = GLOBAL_DICTONARY.RESULT_KEYWORDS.djmax_respect_v.open2
        const normalizedText = texts.open2.trim().replaceAll(' ', '').toUpperCase()

        if (keywords.some((keyword) => normalizedText.includes(keyword))) {
          resultInfo.where = 'open2'
          resultInfo.isResult = ['open2']
          resultInfo.text = texts.open2
          resultInfo.gameCode = 'djmax_respect_v'
        }
      }
    } else if (gameCode.toLowerCase().includes('wjmax')) {
      if (settings.autoCaptureWjmaxOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(
          texts.result,
          GLOBAL_DICTONARY.RESULT_KEYWORDS.wjmax.result,
        )
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
          resultInfo.gameCode = 'wjmax'
        }
      }
    } else if (gameCode.toLowerCase().includes('platina')) {
      if (settings.autoCapturePlatinaLabOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(
          texts.result,
          GLOBAL_DICTONARY.RESULT_KEYWORDS.platina_lab.result,
        )
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
          resultInfo.gameCode = 'platina_lab'
        }
      }
    }

    return resultInfo
  }

  /**
   * 결과 화면 키워드 확인 메서드
   */
  private checkResultKeywords(text: string, keywords: string[]): string[] {
    return keywords.filter(
      (value) => text.toUpperCase().trim().includes(value) && text.length !== 0,
    )
  }
}
