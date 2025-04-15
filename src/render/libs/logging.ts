import type { LogLevel } from '@src/types/LogLevel'
import dayjs from 'dayjs'

const { sendLog } = window.electron

export function createLog(level: LogLevel, ...args: any[]) {
  sendLog(level, 'RENDERER', ...args)
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
    createLog(
      'error',
      '%c%s %c%s %c--- %c[%s] %c%s',
      styles.gray,
      dayjs().toISOString(),
      styles.error,
      level.toUpperCase(),
      styles.gray,
      styles.where,
      'RENDERER',
      styles.log,
      ...args,
    )
  } else if (level === 'warn') {
    console.warn(
      '%c%s %c%s %c--- %c[%s] %c%s',
      styles.gray,
      dayjs().toISOString(),
      styles.warn,
      level.toUpperCase(),
      styles.gray,
      styles.where,
      'RENDERER',
      styles.log,
      ...args,
    )
  } else if (level === 'debug') {
    console.debug(
      '%c%s %c%s %c--- %c[%s] %c%s',
      styles.gray,
      dayjs().toISOString(),
      styles.debug,
      level.toUpperCase(),
      styles.gray,
      styles.where,
      'RENDERER',
      styles.log,
      ...args,
    )
  } else {
    console.info(
      '%c%s %c%s %c--- %c[%s] %c%s',
      styles.gray,
      dayjs().toISOString(),
      styles.info,
      level.toUpperCase(),
      styles.gray,
      styles.where,
      'RENDERER',
      styles.log,
      ...args,
    )
  }
}

export function createOverlayLog(level: LogLevel, ...args: any[]) {
  sendLog(level, 'OVERLAY', ...args)
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
    createLog(
      'error',
      '%c%s %c%s %c--- %c[%s] %c%s',
      styles.gray,
      dayjs().toISOString(),
      styles.error,
      level.toUpperCase(),
      styles.gray,
      styles.where,
      'OVERLAY',
      styles.log,
      ...args,
    )
  } else if (level === 'warn') {
    console.warn(
      '%c%s %c%s %c--- %c[%s] %c%s',
      styles.gray,
      dayjs().toISOString(),
      styles.warn,
      level.toUpperCase(),
      styles.gray,
      styles.where,
      'OVERLAY',
      styles.log,
      ...args,
    )
  } else if (level === 'debug') {
    console.debug(
      '%c%s %c%s %c--- %c[%s] %c%s',
      styles.gray,
      dayjs().toISOString(),
      styles.debug,
      level.toUpperCase(),
      styles.gray,
      styles.where,
      'OVERLAY',
      styles.log,
      ...args,
    )
  } else {
    console.info(
      '%c%s %c%s %c--- %c[%s] %c%s',
      styles.gray,
      dayjs().toISOString(),
      styles.info,
      level.toUpperCase(),
      styles.gray,
      styles.where,
      'OVERLAY',
      styles.log,
      ...args,
    )
  }
}
