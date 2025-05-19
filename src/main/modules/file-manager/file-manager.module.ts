import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { OverlayWindowModule } from '../overlay-window/overlay-window.module'
import { FileManagerController } from './file-manager.controller'
import { FileManagerService } from './file-manager.service'

@Module({
  imports: [LoggerModule, OverlayWindowModule],
  providers: [FileManagerService],
  controllers: [FileManagerController],
  exports: [FileManagerService],
})
export class FileManagerModule {}
