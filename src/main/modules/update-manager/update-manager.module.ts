import { Module } from '@nestjs/common'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { MainWindowModule } from '../main-window/main-window.module'
import { UpdateManagerController } from './update-manager.controller'
import { UpdateManagerService } from './update-manager.service'

@Module({
  imports: [MainWindowModule, FileManagerModule],
  controllers: [UpdateManagerController],
  providers: [UpdateManagerService],
  exports: [UpdateManagerService],
})
export class UpdateManagerModule {}
