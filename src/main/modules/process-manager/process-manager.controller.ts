import { IpcHandle } from '@doubleshot/nest-electron'

import { Controller } from '@nestjs/common'
import { ProcessDescriptor } from 'ps-list'
import { from, Observable } from 'rxjs'
import { ProcessManagerService } from './process-manager.service'

@Controller()
export class ProcessManagerController {
  constructor(private readonly processManagerService: ProcessManagerService) {}

  @IpcHandle('process:list')
  getPsList(): Observable<ProcessDescriptor[]> {
    return from(this.processManagerService.getPsList())
  }
}
