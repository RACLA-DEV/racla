import { Module } from '@nestjs/common'
import { FileManagerModule } from '../file-manager/file-manager.module'
import { OverlayWindowController } from './overlay-window.controller'
import { OverlayWindowService } from './overlay-window.service'

@Module({
  imports: [FileManagerModule],
  controllers: [OverlayWindowController],
  providers: [OverlayWindowService],
  exports: [OverlayWindowService],
})
export class OverlayWindowModule {}
