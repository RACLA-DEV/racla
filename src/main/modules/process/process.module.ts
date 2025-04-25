import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { OverlayWindowModule } from '../overlay-window/overlay-window.module'
import { ProcessController } from './process.controller'
import { ProcessService } from './process.service'

@Module({
  imports: [OverlayWindowModule, LoggerModule],
  controllers: [ProcessController],
  providers: [ProcessService],
})
export class ProcessModule {}
