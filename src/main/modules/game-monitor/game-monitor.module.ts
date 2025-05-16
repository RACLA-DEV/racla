import { Module } from '@nestjs/common'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { ImageProcessorModule } from '../image-processor/image-processor.module'
import { LoggerModule } from '../logger/logger.module'
import { MainWindowModule } from '../main-window/main-window.module'
import { OcrManagerModule } from '../ocr-manager/ocr-manager.module'
import { OverlayWindowModule } from '../overlay-window/overlay-window.module'
import { GameMonitorController } from './game-monitor.controller'
import { GameMonitorService } from './game-monitor.service'

@Module({
  imports: [
    LoggerModule,
    OverlayWindowModule,
    MainWindowModule,
    FileManagerModule,
    ImageProcessorModule,
    OcrManagerModule,
  ],
  controllers: [GameMonitorController],
  providers: [GameMonitorService],
  exports: [GameMonitorService],
})
export class GameMonitorModule {}
