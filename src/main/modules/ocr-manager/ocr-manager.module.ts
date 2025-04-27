import { Module } from '@nestjs/common'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { ImageProcessorModule } from '../image-processor/image-processor.module'
import { OcrManagerService } from './ocr-manager.service'

@Module({
  imports: [ImageProcessorModule, FileManagerModule],
  providers: [OcrManagerService],
  exports: [OcrManagerService],
})
export class OcrManagerModule {}
