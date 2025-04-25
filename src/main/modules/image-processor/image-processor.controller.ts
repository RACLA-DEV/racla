import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller, Logger } from '@nestjs/common'
import { Buffer } from 'node:buffer'
import { ImageProcessorService } from './image-processor.service'

@Controller()
export class ImageProcessorController {
  private readonly logger = new Logger(ImageProcessorController.name)
  constructor(private readonly imageProcessorService: ImageProcessorService) {}

  @IpcHandle('image-processor:capture-game-window')
  async captureGameWindow(gameTitle: string): Promise<Buffer | null> {
    try {
      return await this.imageProcessorService.captureGameWindow(gameTitle)
    } catch (error) {
      this.logger.error('Error in captureGameWindow controller:', error)
      throw error
    }
  }
}
