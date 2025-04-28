import * as winston from 'winston'

import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston'

import { Logger } from '@nestjs/common'
import { app } from 'electron'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthManagerModule } from './modules/auth-manager/auth-manager.module'
import { DiscordManagerModule } from './modules/discord-manager/discord-manager.module'
import { FileManagerModule } from './modules/file-manager/file-manager.module'
import { GameMonitorModule } from './modules/game-monitor/game-monitor.module'
import { GameMonitorService } from './modules/game-monitor/game-monitor.service'
import { ImageProcessorModule } from './modules/image-processor/image-processor.module'
import { LoggerModule } from './modules/logger/logger.module'
import { MainWindowModule } from './modules/main-window/main-window.module'
import { MessageModule } from './modules/message/message.module'
import { OverlayWindowModule } from './modules/overlay-window/overlay-window.module'
import { ProcessManagerModule } from './modules/process-manager/process-manager.module'
import { UpdateManagerModule } from './modules/update-manager/update-manager.module'

// Winston 설정을 별도 상수로 분리
export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      level: !app.isPackaged ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('RACLA_DESKTOP_APP', {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
}

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    MainWindowModule,
    OverlayWindowModule,
    ProcessManagerModule,
    MessageModule,
    GameMonitorModule,
    LoggerModule,
    ImageProcessorModule,
    FileManagerModule,
    AuthManagerModule,
    UpdateManagerModule,
    DiscordManagerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppModule.name)
  private isInitialized = false

  constructor(private readonly gameMonitorService: GameMonitorService) {}

  async onModuleInit() {
    this.logger.log('Module initialized')
  }

  onModuleDestroy() {
    if (this.isInitialized) {
      this.logger.log('Service cleanup started')
      this.gameMonitorService.cleanup()
      this.logger.log('Service cleanup completed')
    }
  }
}
