import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { LogLevel } from '@src/types/dto/log/LogLevel'
import { LoggerService } from './logger.service'

@Controller()
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @IpcHandle('logger:create-log')
  public handlecreateLog(args: [LogLevel?, string?, ...unknown[]]): boolean {
    return this.loggerService.createLog(...args)
  }
}
