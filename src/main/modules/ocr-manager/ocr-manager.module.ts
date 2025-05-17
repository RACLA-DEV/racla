import { Module } from '@nestjs/common'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { ImageProcessorModule } from '../image-processor/image-processor.module'
import { OcrManagerController } from './ocr-manager.controller'
import { OcrManagerService } from './ocr-manager.service'

@Module({
  imports: [ImageProcessorModule, FileManagerModule],
  controllers: [OcrManagerController],
  providers: [OcrManagerService],
  exports: [OcrManagerService],
})
export class OcrManagerModule {}
