import { Module } from '@nestjs/common'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { AuthManagerController } from './auth-manager.controller'
import { AuthManagerService } from './auth-manager.service'

@Module({
  imports: [FileManagerModule],
  controllers: [AuthManagerController],
  providers: [AuthManagerService],
  exports: [AuthManagerService],
})
export class AuthManagerModule {}
