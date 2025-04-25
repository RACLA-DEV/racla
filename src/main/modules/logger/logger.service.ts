import { Injectable, Logger } from '@nestjs/common'

import type { ErrorLogData } from '@src/types/common/ErrorLogData'
import { LogLevel } from '@src/types/common/LogLevel'
import dotenv from 'dotenv'
import { app } from 'electron'
import packageJson from '../../../../package.json'
import apiClient from '../../../libs/apiClient'

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name)

  constructor() {
    dotenv.config({ path: !app.isPackaged ? '.env.development' : '.env.production' })
  }

  public async createLog(level: LogLevel = 'info', where: string = 'MAIN', ...args: any[]) {
    const logPrefix = `[${where}] `
    const logContent = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
      .join('\n')
    const message = `${logPrefix}${logContent}`

    switch (level) {
      case 'error':
        this.sendErrorLog(where, new Error(message))
        this.logger.error(message)
        break
      case 'warn':
        this.logger.warn(message)
        break
      case 'debug':
        this.logger.debug(message)
        break
      case 'info':
      default:
        this.logger.log(message)
        break
    }
  }

  private async sendErrorLog(where: string, error: Error, context?: any, ...args: any[]) {
    try {
      const errorData: ErrorLogData = {
        clientPlatform: `ELECTRON_${where.toUpperCase()}`,
        clientOs: process.platform,
        clientUserAgent: `racla-electron-app/${packageJson.version}`,
        clientLanguage: 'ko-KR',
        clientDevice: 'Desktop',
        clientLogLevel: 'ERROR',
        clientLogMessage: error instanceof Error ? error.message : String(error),
        clientLogStacktrace: error instanceof Error ? error.stack : null,
        clientAdditionalInfo: {
          context: context,
          args: args,
        },
      }

      const response = await apiClient.post<any>(`/v2/racla/log/client/create`, errorData)
      if (response.status === 200) {
        this.logger.log(`[MAIN] Exception Report Successfully.`)
      } else {
        this.logger.error(`[MAIN] Exception Report Failed:\n${JSON.stringify(response, null, 2)}`)
      }
    } catch (loggingError) {
      this.logger.error(
        `[MAIN] Exception Report Failed:\n${
          loggingError instanceof Error ? loggingError.stack : String(loggingError)
        }`,
      )
    }
  }
}
