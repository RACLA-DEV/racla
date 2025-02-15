import type { LogLevel } from '@src/types/LogLevel'
import dayjs from 'dayjs'

const {
  sendLog,
} = window.electron

export function createLog(level: LogLevel, where: string, ...args: any[]) {
    sendLog(level, where, ...args)
  const styles = {
    error: 'color: #ff5555; font-weight: bold',
    warn: 'color: #ffb86c; font-weight: bold',
    info: 'color: #8be9fd; font-weight: bold',
    debug: 'color: #00b89f; font-weight: bold',
    log: 'color: #e0e0e0; font-weight: bold',
    gray: 'color: #808080; font-weight: lighter',
    where: 'color: #00b89f; font-weight: bold',
  }

  if (level === 'error') {
    console.error('%c%s %c%s %c--- %c[%s] %c%s', styles.gray, dayjs().toISOString(), styles.error, level.toUpperCase(), styles.gray, styles.where, where, styles.log, ...args,
    )
  }
  else {
    console.warn('%c%s %c%s %c--- %c[%s] %c%s', styles.gray, dayjs().toISOString(), styles.warn, level.toUpperCase(), styles.gray, styles.where, where, styles.log, ...args,
    )
  }
}
