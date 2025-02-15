import { Buffer } from 'node:buffer'
import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { ImageProcessorService } from './image-processor.service'

@Controller()
export class ImageProcessorController {
  constructor(private readonly imageProcessorService: ImageProcessorService) {}

  @IpcHandle('image-processor:capture-game-window')
  async captureGameWindow(gameTitle: string): Promise<Buffer | null> {
    try {
      return await this.imageProcessorService.captureGameWindow(gameTitle)
    }
    catch (error) {
      console.error('Error in captureGameWindow controller:', error)
      throw error
    }
  }
}
