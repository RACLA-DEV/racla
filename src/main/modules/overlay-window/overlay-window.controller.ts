import { IpcHandle } from '@doubleshot/nest-electron'

import { Controller } from '@nestjs/common'
import { Observable, of } from 'rxjs'
import { OverlayWindowService } from './overlay-window.service'

@Controller()
export class OverlayWindowController {
  constructor(private readonly overlayWindowService: OverlayWindowService) {}

  @IpcHandle('overlay:create')
  createOverlay(): boolean {
    this.overlayWindowService.createOverlay()
    return true
  }

  @IpcHandle('overlay:createInit')
  createOverlayInit(): boolean {
    this.overlayWindowService.createOverlayInit()
    return true
  }

  @IpcHandle('overlay:send')
  sendMessage(message: string): Observable<boolean> {
    this.overlayWindowService.sendMessage(message)
    return of(true)
  }

  @IpcHandle('overlay:close')
  closeOverlay(): Observable<boolean> {
    this.overlayWindowService.destroyOverlay()
    return of(true)
  }
}
