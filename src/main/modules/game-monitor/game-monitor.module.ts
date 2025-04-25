import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { GameMonitorController } from './game-monitor.controller'
import { GameMonitorService } from './game-monitor.service'

@Module({
  imports: [LoggerModule],
  controllers: [GameMonitorController],
  providers: [GameMonitorService],
  exports: [GameMonitorService],
})
export class GameMonitorModule {}
