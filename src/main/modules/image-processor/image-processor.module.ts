import { Module } from '@nestjs/common'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { ImageProcessorController } from './image-processor.controller'
import { ImageProcessorService } from './image-processor.service'

@Module({
  imports: [FileManagerModule],
  controllers: [ImageProcessorController],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class ImageProcessorModule {}
