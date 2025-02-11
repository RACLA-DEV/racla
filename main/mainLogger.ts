import log from 'electron-log/main'
import packageJson from '../package.json'
import { customAxios } from './axios'
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

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

export const logMainError = async (error: Error, context?: any) => {
  try {
    const errorData: ErrorLogData = {
      clientPlatform: 'ELECTRON_MAIN',
      clientOs: process.platform,
      clientUserAgent: 'racla-electron-app/' + packageJson.version,
      clientLanguage: 'ko-KR',
      clientDevice: 'Desktop',
      clientLogLevel: 'ERROR',
      clientLogMessage: error instanceof Error ? error.message : String(error),
      clientLogStacktrace: error instanceof Error ? error.stack : null,
      clientAdditionalInfo: context,
    }

    await customAxios.post(
      `${process.env.NODE_ENV === 'production' ? 'https://near.r-archive.zip/api' : 'https://noah.r-archive.zip/api'}/v1/log/client/create`,
      errorData,
    )
  } catch (loggingError) {
    log.error('Failed to log error:', loggingError)
  }
}
