import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { LoggerService } from './logger.service'

@Controller()
export class LoggerController {
  constructor(
    private readonly loggingService: LoggerService
  ) {}

  @IpcHandle('logger:create-log')
  public handleCreateLog(args: any[]): boolean {
    this.loggingService.createLog(...args)
    return true
  }
}
