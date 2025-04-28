import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { OverlayWindowModule } from '../overlay-window/overlay-window.module'
import { ProcessManagerController } from './process-manager.controller'
import { ProcessManagerService } from './process-manager.service'

@Module({
  imports: [OverlayWindowModule, LoggerModule],
  controllers: [ProcessManagerController],
  providers: [ProcessManagerService],
})
export class ProcessManagerModule {}
