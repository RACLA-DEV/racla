import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller, Logger } from '@nestjs/common'
import { OcrPlayDataResponse } from '@src/types/dto/ocr/OcrPlayDataResponse'
import { OcrManagerService } from './ocr-manager.service'

@Controller()
export class OcrManagerController {
  private readonly logger = new Logger(OcrManagerController.name)
  constructor(private readonly ocrManagerService: OcrManagerService) {}

  @IpcHandle('ocr-manager:get-ocr-result-server')
  async getOcrResultServer(data: {
    image: Buffer
    gameCode: string
  }): Promise<OcrPlayDataResponse> {
    try {
      return await this.ocrManagerService.getOcrResultServer(data.image, data.gameCode)
    } catch (error) {
      this.logger.error('Error in getOcrResult controller:', error)
      throw error
    }
  }

  @IpcHandle('ocr-manager:process-images-batch')
  async processImagesBatch(data: {
    images: Buffer[]
    gameCode: string
  }): Promise<OcrPlayDataResponse[]> {
    try {
      this.logger.log(`배치 처리 시작: ${data.images.length}개 이미지`)
      return await this.ocrManagerService.processImagesBatch(data.images, data.gameCode)
    } catch (error) {
      this.logger.error('Error in processImagesBatch controller:', error)
      throw error
    }
  }
}
