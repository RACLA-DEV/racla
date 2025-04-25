import type { Result } from 'get-windows'

import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import type { ProcessDescriptor } from 'ps-list'
import { from, Observable } from 'rxjs'
import { GameMonitorService } from './game-monitor.service'

@Controller()
export class GameMonitorController {
  constructor(private readonly gameMonitorService: GameMonitorService) {}

  @IpcHandle('monitor:get-process-list')
  getProcessList(): Observable<ProcessDescriptor[]> {
    return from(this.gameMonitorService.getProcessList())
  }

  @IpcHandle('monitor:get-active-windows')
  getActiveWindows(): Observable<Result> {
    return from(this.gameMonitorService.getActiveWindows())
  }

  @IpcHandle('monitor:check-game')
  checkGameStatus(processName: string): Observable<boolean> {
    return from(this.gameMonitorService.checkGameStatus(processName))
  }

  @IpcHandle('monitor:get-game-window')
  getGameWindow(): Observable<Result | undefined> {
    return from(this.gameMonitorService.getGameWindowInfo())
  }
}
