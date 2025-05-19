import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { FileManagerController } from './file-manager.controller'
import { FileManagerService } from './file-manager.service'

@Module({
  imports: [LoggerModule],
  providers: [FileManagerService],
  controllers: [FileManagerController],
  exports: [FileManagerService],
})
export class FileManagerModule {}
