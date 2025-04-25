import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { MainWindowModule } from '../main-window/main-window.module'
import { OverlayWindowModule } from '../overlay-window/overlay-window.module'
import { GameMonitorController } from './game-monitor.controller'
import { GameMonitorService } from './game-monitor.service'

@Module({
  imports: [LoggerModule, OverlayWindowModule, MainWindowModule],
  controllers: [GameMonitorController],
  providers: [GameMonitorService],
  exports: [GameMonitorService],
})
export class GameMonitorModule {}
