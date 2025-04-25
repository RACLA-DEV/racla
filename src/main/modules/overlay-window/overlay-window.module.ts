import { Module } from '@nestjs/common'
import { OverlayWindowController } from './overlay-window.controller'
import { OverlayWindowService } from './overlay-window.service'

@Module({
  imports: [],
  controllers: [OverlayWindowController],
  providers: [OverlayWindowService],
  exports: [OverlayWindowService],
})
export class OverlayWindowModule {}
