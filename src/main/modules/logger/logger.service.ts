import { Injectable, Logger } from '@nestjs/common'

import { LogLevel } from '@src/types/LogLevel'
import dotenv from 'dotenv'
import { app } from 'electron'
import packageJson from '../../../../package.json'
import { api } from '../../libs/api'

interface ErrorLogData {
  clientPlatform?: string
  clientOs?: string
  clientBrowser?: string
  clientUserAgent?: string
  clientLanguage?: string
  clientDevice?: string
  clientLogLevel: 'ERROR' | 'WARN' | 'INFO'
  clientLogMessage: string
  clientLogStacktrace?: string
  clientAdditionalInfo?: any
}

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  constructor() {
    dotenv.config({ path: !app.isPackaged ? '.env.development' : '.env.production' })
  }

  public async createLog(level: LogLevel = 'info', where: string = 'MAIN', ...args: any[]) {
    const logPrefix = `[${where}] `
    const logContent = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
    ).join('\n')
    const message = `${logPrefix}${logContent}`

    switch (level) {
      case 'error':
        if (args[0] instanceof Error) {
          const errorMessage = `${logPrefix}${args[0].message}\nStack: ${args[0].stack}`
          this.logger.error(errorMessage)
          if (args.length > 1) {
            await this.sendErrorLog(where, args[0], args[1], args.length > 2 ? args.slice(2) : null)
          }
          else {
            await this.sendErrorLog(where, args[0])
          }
        }
        else {
          this.logger.error(message)
        }
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

      const response = await api.post(
        `${process.env.VITE_API_URL}/v1/log/client/create`,
        errorData,
      )
      if (response.status === 200) {
        this.logger.log(`[MAIN] Exception Report Successfully.`)
      }
      else {
        this.logger.error(`[MAIN] Exception Report Failed:\n${JSON.stringify(response, null, 2)}`)
      }
    }
    catch (loggingError) {
      this.logger.error(
        `[MAIN] Exception Report Failed:\n${
          loggingError instanceof Error ? loggingError.stack : String(loggingError)
        }`,
      )
    }
  }
}
