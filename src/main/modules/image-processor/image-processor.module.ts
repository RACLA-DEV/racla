import { Module } from '@nestjs/common'
import { ImageProcessorController } from './image-processor.controller'
import { ImageProcessorService } from './image-processor.service'

@Module({
  controllers: [ImageProcessorController],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class ImageProcessorModule {}
