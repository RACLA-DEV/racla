import { Module } from '@nestjs/common'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { ImageProcessorModule } from '../image-processor/image-processor.module'
import { OverlayWindowModule } from '../overlay-window/overlay-window.module'
import { OcrManagerController } from './ocr-manager.controller'
import { OcrManagerService } from './ocr-manager.service'

@Module({
  imports: [ImageProcessorModule, FileManagerModule, OverlayWindowModule],
  controllers: [OcrManagerController],
  providers: [OcrManagerService],
  exports: [OcrManagerService],
})
export class OcrManagerModule {}
