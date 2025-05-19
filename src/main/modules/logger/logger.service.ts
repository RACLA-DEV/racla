import { Injectable, Logger } from '@nestjs/common'

import type { ClientErrorLogRequest } from '@src/types/dto/log/ClientErrorLogReqeust'
import { LogLevel } from '@src/types/dto/log/LogLevel'
import { CanceledError } from 'axios'
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

  public createLog(level: LogLevel = 'info', where = 'MAIN', ...args: unknown[]): boolean {
    const logPrefix = `[${where}] `
    const logContent = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg.toString()))
      .join('\n')
    const message = `${logPrefix}${logContent}`

    switch (level) {
      case 'error':
        void this.sendErrorLog(where, new Error(message))
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
    return true
  }

  private async sendErrorLog(where: string, error: Error, context?: unknown, ...args: unknown[]) {
    try {
      const errorData: ClientErrorLogRequest = {
        clientPlatform: `ELECTRON_${where.toUpperCase()}`,
        clientOs: process.platform,
        clientUserAgent: `racla-electron-app/${packageJson.version}`,
        clientLanguage: 'ko-KR',
        clientDevice: 'Desktop',
        clientLogLevel: 'ERROR',
        clientLogMessage: error instanceof Error ? error.message : String(error),
        clientLogStacktrace: error instanceof Error ? error.stack : null,
        clientAdditionalInfo: {
          context: context?.toString(),
          args: args.toString(),
        },
      }

      if (error.message.includes('CanceledError') || error instanceof CanceledError) {
        this.logger.debug('[MAIN] Canceled Error is not sent to server.')
      } else {
        const response = await apiClient.sendErrorLog(errorData)
        if (response.status === 200) {
          this.logger.log(`[MAIN] Exception Report Successfully.`)
        } else {
          this.logger.error(`[MAIN] Exception Report Failed:\n${JSON.stringify(response, null, 2)}`)
        }
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
