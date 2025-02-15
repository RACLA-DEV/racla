import { Module } from '@nestjs/common'
import { GameMonitorModule } from '../game-monitor/game-monitor.module'
import { LoggerModule } from '../logger/logger.module'
import { MainWindowModule } from '../main-window/main-window.module'
import { OverlayWindowController } from './overlay-window.controller'
import { OverlayWindowService } from './overlay-window.service'

@Module({
  imports: [GameMonitorModule, LoggerModule, MainWindowModule],
  controllers: [OverlayWindowController],
  providers: [OverlayWindowService],
  exports: [OverlayWindowService],
})
export class OverlayWindowModule {}
