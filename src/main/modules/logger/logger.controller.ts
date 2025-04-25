import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { LogLevel } from '@src/types/common/LogLevel'
import { LoggerService } from './logger.service'

@Controller()
export class LoggerController {
  constructor(private readonly loggingService: LoggerService) {}

  @IpcHandle('logger:create-log')
  public handlecreateLog(args: [LogLevel?, string?, ...unknown[]]): boolean {
    void this.loggingService.createLog(...args)
    return true
  }
}
