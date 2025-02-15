import { IpcHandle } from '@doubleshot/nest-electron'

import { Controller } from '@nestjs/common'
import { ProcessDescriptor } from 'ps-list'
import { from, Observable } from 'rxjs'
import { ProcessService } from './process.service'

@Controller()
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @IpcHandle('process:list')
  getPsList(): Observable<ProcessDescriptor[]> {
    return from(this.processService.getPsList())
  }
}
