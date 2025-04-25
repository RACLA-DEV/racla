import { IpcHandle } from '@doubleshot/nest-electron'

import { Controller } from '@nestjs/common'
import { from, Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { OverlayWindowService } from './overlay-window.service'

@Controller()
export class OverlayWindowController {
  constructor(private readonly overlayWindowService: OverlayWindowService) {}

  @IpcHandle('overlay:create')
  createOverlay(): Observable<boolean> {
    return from(this.overlayWindowService.createOverlay()).pipe(
      map(window => !!window),
    )
  }

  @IpcHandle('overlay:send')
  sendMessage(message: string): Observable<boolean> {
    this.overlayWindowService.sendMessage(message)
    return of(true)
  }

  @IpcHandle('overlay:close')
  closeOverlay(): Observable<boolean> {
    return from(this.overlayWindowService.destroyOverlay()).pipe(
      map(() => true),
    )
  }
}
