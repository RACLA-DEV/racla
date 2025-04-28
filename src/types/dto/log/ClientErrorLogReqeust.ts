export interface ClientErrorLogRequest {
  clientPlatform?: string
  clientOs?: string
  clientBrowser?: string
  clientUserAgent?: string
  clientLanguage?: string
  clientDevice?: string
  clientLogLevel: 'ERROR' | 'WARN' | 'INFO'
  clientLogMessage: string
  clientLogStacktrace?: string
  clientAdditionalInfo?: {
    context?: string
    args?: string
  }
}
