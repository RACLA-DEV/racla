import * as winston from 'winston'

import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston'

import { app } from 'electron'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { FileManagerModule } from './modules/file-manager/file-manager.module'
import { GameMonitorModule } from './modules/game-monitor/game-monitor.module'
import { ImageProcessorModule } from './modules/image-processor/image-processor.module'
import { LoggerModule } from './modules/logger/logger.module'
import { MainWindowModule } from './modules/main-window/main-window.module'
import { MessageModule } from './modules/message/message.module'
import { OverlayWindowModule } from './modules/overlay-window/overlay-window.module'
import { OverlayWindowService } from './modules/overlay-window/overlay-window.service'
import { ProcessModule } from './modules/process/process.module'

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
    ProcessModule,
    MessageModule,
    GameMonitorModule,
    LoggerModule,
    ImageProcessorModule,
    FileManagerModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly overlayWindowService: OverlayWindowService) {}

  async onModuleInit() {
    await this.overlayWindowService.initialize()
  }

  onModuleDestroy() {
    this.overlayWindowService.cleanup()
  }
}
