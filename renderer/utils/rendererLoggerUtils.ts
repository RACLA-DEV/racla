import axios from 'axios'
import packageJson from '../../package.json'

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

export const logRendererError = async (error: Error | unknown, additionalInfo?: any) => {
  try {
    const errorData: ErrorLogData = {
      clientPlatform: 'ELECTRON_RENDERER',
      clientOs: process.platform,
      clientUserAgent: 'racla-electron-app/' + packageJson.version,
      clientLanguage: 'ko-KR',
      clientDevice: 'Desktop',
      clientLogLevel: 'ERROR',
      clientLogMessage: error instanceof Error ? error.message : String(error),
      clientLogStacktrace: error instanceof Error ? error.stack : null,
      clientAdditionalInfo: additionalInfo,
    }

    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/v2/racla/log/client/create`, errorData)
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError)
  }
}
